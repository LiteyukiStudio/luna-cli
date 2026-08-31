import { chmod, lstat, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  atomicWriteKubeconfig,
  inspectKubeconfigTarget,
  resolveDefaultMergePath,
} from '../../src/kubeconfig/index.js'

describe('kubeconfig store', () => {
  const directories: string[] = []

  afterEach(async () => {
    await Promise.all(directories.splice(0).map(path => rm(path, {
      recursive: true,
      force: true,
    })))
  })

  it('atomically creates a new file with 0600 permissions', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, '.kube', 'config')
    const snapshot = await inspectKubeconfigTarget(path, { requireAbsent: true })

    await atomicWriteKubeconfig(snapshot, minimalKubeconfig())

    await expect(readFile(path, 'utf8')).resolves.toBe(minimalKubeconfig())
    if (process.platform !== 'win32')
      expect((await lstat(path)).mode & 0o777).toBe(0o600)
  })

  it('refuses to overwrite an existing file in write mode', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, 'config')
    await writeFile(path, minimalKubeconfig(), { mode: 0o644 })

    await expect(inspectKubeconfigTarget(path, { requireAbsent: true }))
      .rejects
      .toMatchObject({ code: 'kubeconfig_target_exists', status: 409 })
  })

  it('refuses a symbolic-link target', async () => {
    const directory = await temporaryDirectory()
    const target = join(directory, 'actual')
    const path = join(directory, 'config')
    await writeFile(target, minimalKubeconfig())
    await symlink(target, path)

    await expect(inspectKubeconfigTarget(path)).rejects.toMatchObject({
      code: 'kubeconfig_target_unsafe',
    })
  })

  it('does not overwrite a file that changes after preflight', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, 'config')
    await writeFile(path, minimalKubeconfig())
    const snapshot = await inspectKubeconfigTarget(path)
    await writeFile(path, 'changed by another process\n')

    await expect(atomicWriteKubeconfig(snapshot, minimalKubeconfig('new-token')))
      .rejects
      .toMatchObject({ code: 'kubeconfig_target_changed', status: 409 })
    await expect(readFile(path, 'utf8')).resolves.toBe('changed by another process\n')
  })

  it('resolves one KUBECONFIG path and rejects a multi-file merge target', async () => {
    const directory = await temporaryDirectory()
    const one = join(directory, 'one')
    const two = join(directory, 'two')

    expect(resolveDefaultMergePath(undefined, { KUBECONFIG: one })).toBe(one)
    expect(() => resolveDefaultMergePath(undefined, {
      KUBECONFIG: `${one}${delimiter}${two}`,
    })).toThrowError(expect.objectContaining({ code: 'kubeconfig_multiple_paths' }))
  })

  it('tightens an existing merge target to 0600', async () => {
    const directory = await temporaryDirectory()
    const path = join(directory, 'config')
    await writeFile(path, minimalKubeconfig(), { mode: 0o666 })
    if (process.platform !== 'win32')
      await chmod(path, 0o666)
    const snapshot = await inspectKubeconfigTarget(path)

    await atomicWriteKubeconfig(snapshot, minimalKubeconfig('rotated-token'))

    if (process.platform !== 'win32')
      expect((await lstat(path)).mode & 0o777).toBe(0o600)
  })

  async function temporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), 'luna-kubeconfig-store-'))
    directories.push(directory)
    return directory
  }
})

function minimalKubeconfig(token = 'secret'): string {
  return `apiVersion: v1
kind: Config
clusters: []
contexts: []
users:
  - name: user
    user:
      token: ${token}
`
}
