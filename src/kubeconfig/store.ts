import type { KubeconfigDocument } from './document.js'
import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import {
  link,
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
} from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, isAbsolute, join, resolve } from 'node:path'
import process from 'node:process'
import { invalidInput, LunaError } from '../errors/index.js'
import {
  MAX_KUBECONFIG_BYTES,
  parseKubeconfig,
} from './document.js'

export interface KubeconfigTargetSnapshot {
  readonly path: string
  readonly existed: boolean
  readonly source?: string
  readonly document?: KubeconfigDocument
}

export function resolveKubeconfigPath(
  value: string,
  options: { readonly cwd?: string, readonly home?: string } = {},
): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('\u0000')) {
    throw invalidInput(
      'kubeconfig_path_invalid',
      'A non-empty kubeconfig path is required.',
    )
  }
  const home = options.home ?? homedir()
  const expanded = trimmed === '~'
    ? home
    : trimmed.startsWith('~/')
      ? join(home, trimmed.slice(2))
      : trimmed
  return isAbsolute(expanded) ? resolve(expanded) : resolve(options.cwd ?? process.cwd(), expanded)
}

export function resolveDefaultMergePath(
  explicitPath: string | undefined,
  env: Readonly<Record<string, string | undefined>>,
  options: { readonly cwd?: string, readonly home?: string } = {},
): string {
  if (explicitPath)
    return resolveKubeconfigPath(explicitPath, options)

  const configured = env.KUBECONFIG
  if (!configured)
    return resolveKubeconfigPath('~/.kube/config', options)

  const paths = configured.split(delimiter).filter(value => value.length > 0)
  if (paths.length !== 1) {
    throw invalidInput(
      'kubeconfig_multiple_paths',
      'KUBECONFIG contains multiple paths; choose one with destination=<path>.',
      { details: { pathCount: paths.length } },
    )
  }
  return resolveKubeconfigPath(paths[0]!, options)
}

export async function inspectKubeconfigTarget(
  path: string,
  options: { readonly requireAbsent?: boolean } = {},
): Promise<KubeconfigTargetSnapshot> {
  const target = resolveKubeconfigPath(path)
  const parent = dirname(target)
  try {
    await mkdir(parent, { recursive: true, mode: 0o700 })
  }
  catch (cause) {
    throw pathFailure('kubeconfig_path_unavailable', target, cause)
  }

  let existed = false
  let source: string | undefined
  let document: KubeconfigDocument | undefined
  try {
    const stats = await lstat(target)
    existed = true
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw invalidInput(
        'kubeconfig_target_unsafe',
        'The kubeconfig target must be a regular file and cannot be a symbolic link.',
        { details: { path: target } },
      )
    }
    if (options.requireAbsent) {
      throw new LunaError(
        'kubeconfig_target_exists',
        'The kubeconfig target already exists.',
        { status: 409, details: { path: target } },
      )
    }
    if (stats.size > MAX_KUBECONFIG_BYTES) {
      throw invalidInput(
        'kubeconfig_too_large',
        'The kubeconfig exceeds the supported file size limit.',
        { details: { limitBytes: MAX_KUBECONFIG_BYTES, path: target } },
      )
    }
    source = await readFile(target, 'utf8')
    document = parseKubeconfig(source)
  }
  catch (error) {
    if (!isMissingFile(error))
      throw error
  }

  await assertDirectoryWritable(parent)
  return {
    path: target,
    existed,
    ...(source !== undefined ? { source } : {}),
    ...(document ? { document } : {}),
  }
}

export async function atomicWriteKubeconfig(
  snapshot: KubeconfigTargetSnapshot,
  source: string,
): Promise<void> {
  if (Buffer.byteLength(source, 'utf8') > MAX_KUBECONFIG_BYTES) {
    throw new LunaError(
      'kubeconfig_too_large',
      'The kubeconfig exceeds the supported file size limit.',
      { status: 413, details: { limitBytes: MAX_KUBECONFIG_BYTES } },
    )
  }

  const parent = dirname(snapshot.path)
  const temporaryPath = join(parent, `.luna-kubeconfig-${randomUUID()}.tmp`)
  let temporaryExists = false
  try {
    const handle = await open(temporaryPath, 'wx', 0o600)
    temporaryExists = true
    try {
      await handle.writeFile(source, 'utf8')
      await handle.chmod(0o600)
      await handle.sync()
    }
    finally {
      await handle.close()
    }

    if (!snapshot.existed) {
      await link(temporaryPath, snapshot.path)
      await unlink(temporaryPath)
      temporaryExists = false
    }
    else {
      await assertTargetUnchanged(snapshot)
      await rename(temporaryPath, snapshot.path)
      temporaryExists = false
    }
    await syncDirectory(parent)
  }
  catch (cause) {
    if (temporaryExists)
      await unlink(temporaryPath).catch(() => undefined)
    if (cause instanceof LunaError)
      throw cause
    if (isFileExists(cause)) {
      throw new LunaError(
        'kubeconfig_target_exists',
        'The kubeconfig target appeared before the atomic write completed.',
        { status: 409, details: { path: snapshot.path }, cause },
      )
    }
    throw pathFailure('kubeconfig_write_failed', snapshot.path, cause)
  }
}

async function assertTargetUnchanged(snapshot: KubeconfigTargetSnapshot): Promise<void> {
  try {
    const stats = await lstat(snapshot.path)
    if (!stats.isFile() || stats.isSymbolicLink())
      throw new Error('target type changed')
    const current = await readFile(snapshot.path, 'utf8')
    if (current !== snapshot.source)
      throw new Error('target content changed')
  }
  catch (cause) {
    throw new LunaError(
      'kubeconfig_target_changed',
      'The kubeconfig changed after it was checked; no local changes were written.',
      { status: 409, details: { path: snapshot.path }, cause },
    )
  }
}

async function assertDirectoryWritable(parent: string): Promise<void> {
  const probePath = join(parent, `.luna-kubeconfig-probe-${randomUUID()}.tmp`)
  try {
    const handle = await open(probePath, 'wx', 0o600)
    await handle.close()
    await unlink(probePath)
  }
  catch (cause) {
    await unlink(probePath).catch(() => undefined)
    throw pathFailure('kubeconfig_path_unavailable', parent, cause)
  }
}

async function syncDirectory(parent: string): Promise<void> {
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(parent, 'r')
    await handle.sync()
  }
  catch (error) {
    if (!isUnsupportedDirectorySync(error))
      throw error
  }
  finally {
    await handle?.close().catch(() => undefined)
  }
}

function pathFailure(code: string, path: string, cause: unknown): LunaError {
  return new LunaError(
    code,
    'The kubeconfig target cannot be accessed safely.',
    { status: 500, details: { path }, cause },
  )
}

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined
}

function isMissingFile(error: unknown): boolean {
  return errorCode(error) === 'ENOENT'
}

function isFileExists(error: unknown): boolean {
  return errorCode(error) === 'EEXIST'
}

function isUnsupportedDirectorySync(error: unknown): boolean {
  return ['EACCES', 'EBADF', 'EINVAL', 'EISDIR', 'ENOTSUP', 'EPERM']
    .includes(errorCode(error) ?? '')
}
