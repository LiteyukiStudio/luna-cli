import { Buffer } from 'node:buffer'
import { isDeepStrictEqual } from 'node:util'
import { parse, stringify } from 'yaml'
import { invalidInput, LunaError } from '../errors/index.js'

export const MAX_KUBECONFIG_BYTES = 4 * 1024 * 1024

export interface KubeconfigNamedEntry extends Readonly<Record<string, unknown>> {
  readonly name: string
}

export interface KubeconfigDocument extends Readonly<Record<string, unknown>> {
  readonly 'apiVersion': 'v1'
  readonly 'kind': 'Config'
  readonly 'clusters': readonly KubeconfigNamedEntry[]
  readonly 'contexts': readonly KubeconfigNamedEntry[]
  readonly 'users': readonly KubeconfigNamedEntry[]
  readonly 'current-context'?: string
}

export interface KubeconfigContextSelection {
  readonly projectId: string
  readonly runtimeClusterId: string
  readonly applicationId?: string
}

export interface KubeconfigMergeResult {
  readonly document: KubeconfigDocument
  readonly contextNames: readonly string[]
  readonly replacedEntries: Readonly<{
    clusters: readonly string[]
    contexts: readonly string[]
    users: readonly string[]
  }>
}

export function parseKubeconfig(source: string): KubeconfigDocument {
  if (Buffer.byteLength(source, 'utf8') > MAX_KUBECONFIG_BYTES) {
    throw invalidInput(
      'kubeconfig_too_large',
      'The kubeconfig exceeds the supported file size limit.',
      { details: { limitBytes: MAX_KUBECONFIG_BYTES } },
    )
  }

  let value: unknown
  try {
    value = parse(source, {
      maxAliasCount: 50,
      merge: false,
      prettyErrors: false,
      uniqueKeys: true,
    })
  }
  catch (cause) {
    throw invalidInput(
      'kubeconfig_invalid',
      'The kubeconfig is not valid YAML.',
      { cause },
    )
  }

  if (!isRecord(value) || value.apiVersion !== 'v1' || value.kind !== 'Config') {
    throw invalidInput(
      'kubeconfig_invalid',
      'The file must contain a Kubernetes v1 Config document.',
    )
  }

  const clusters = namedEntries(value.clusters, 'clusters')
  const contexts = namedEntries(value.contexts, 'contexts')
  const users = namedEntries(value.users, 'users')
  const currentContext = value['current-context']
  if (currentContext !== undefined && typeof currentContext !== 'string') {
    throw invalidInput(
      'kubeconfig_invalid',
      'The kubeconfig current-context must be a string.',
      { details: { field: 'current-context' } },
    )
  }

  return {
    ...value,
    apiVersion: 'v1',
    kind: 'Config',
    clusters,
    contexts,
    users,
    ...(typeof currentContext === 'string' ? { 'current-context': currentContext } : {}),
  }
}

export function stringifyKubeconfig(document: KubeconfigDocument): string {
  const source = stringify(document, {
    lineWidth: 0,
    sortMapEntries: false,
  })
  if (Buffer.byteLength(source, 'utf8') > MAX_KUBECONFIG_BYTES) {
    throw new LunaError(
      'kubeconfig_too_large',
      'The merged kubeconfig exceeds the supported file size limit.',
      { status: 413, details: { limitBytes: MAX_KUBECONFIG_BYTES } },
    )
  }
  return source.endsWith('\n') ? source : `${source}\n`
}

export function assertSafeGeneratedKubeconfig(
  document: KubeconfigDocument,
  expectedServerOrigin: string,
  expectedCredentialId: string,
): void {
  if (
    document.clusters.length < 1
    || document.clusters.length > 20
    || document.contexts.length < 1
    || document.contexts.length > 20
    || document.users.length !== 1
  ) {
    throw generatedResponseInvalid('entry-count')
  }

  const clusters = new Set(document.clusters.map(entry => entry.name))
  const users = new Set(document.users.map(entry => entry.name))
  const expectedUserName = `luna/${expectedCredentialId}`
  for (const entry of document.clusters) {
    const cluster = asRecord(entry.cluster)
    if (Object.keys(cluster).some(key => key !== 'server'))
      throw generatedResponseInvalid('clusters')
    if (
      typeof cluster.server !== 'string'
      || !isSafeGatewayServer(cluster.server, expectedServerOrigin)
    ) {
      throw generatedResponseInvalid('clusters')
    }
  }

  for (const entry of document.users) {
    const user = asRecord(entry.user)
    if (entry.name !== expectedUserName || Object.keys(user).some(key => key !== 'token'))
      throw generatedResponseInvalid('users')
    if (
      typeof user.token !== 'string'
      || user.token.length < 1
      || /[\r\n]/u.test(user.token)
    ) {
      throw generatedResponseInvalid('users')
    }
  }

  for (const entry of document.contexts) {
    const context = asRecord(entry.context)
    if (Object.keys(context).some(key => !['cluster', 'namespace', 'user'].includes(key)))
      throw generatedResponseInvalid('contexts')
    if (
      typeof context.cluster !== 'string'
      || !clusters.has(context.cluster)
      || context.cluster !== entry.name
      || typeof context.user !== 'string'
      || !users.has(context.user)
      || context.user !== expectedUserName
      || typeof context.namespace !== 'string'
      || context.namespace.length < 1
      || hasUnsafeNameCharacters(context.namespace)
    ) {
      throw generatedResponseInvalid('contexts')
    }
  }

  if (
    document['current-context'] !== undefined
    && !document.contexts.some(entry => entry.name === document['current-context'])
  ) {
    throw generatedResponseInvalid('current-context')
  }
}

export function mergeKubeconfigDocuments(
  existing: KubeconfigDocument,
  incoming: KubeconfigDocument,
  options: { readonly replaceConflicts?: boolean } = {},
): KubeconfigMergeResult {
  const clusterMerge = mergeNamedEntries(
    'clusters',
    existing.clusters,
    incoming.clusters,
    options.replaceConflicts ?? false,
  )
  const contextMerge = mergeNamedEntries(
    'contexts',
    existing.contexts,
    incoming.contexts,
    options.replaceConflicts ?? false,
  )
  const userMerge = mergeNamedEntries(
    'users',
    existing.users,
    incoming.users,
    options.replaceConflicts ?? false,
  )
  const conflicts = [
    ...clusterMerge.conflicts,
    ...contextMerge.conflicts,
    ...userMerge.conflicts,
  ]
  if (conflicts.length > 0) {
    throw new LunaError(
      'kubeconfig_conflict',
      'The target kubeconfig contains entries with the same name and different content.',
      {
        status: 409,
        details: {
          entries: conflicts.map(conflict => ({
            kind: conflict.kind,
            name: conflict.name,
          })),
        },
      },
    )
  }

  const existingCurrentContext = existing['current-context']?.trim()
  const incomingCurrentContext = incoming['current-context']?.trim()
  const currentContext = existingCurrentContext || incomingCurrentContext
  const document: KubeconfigDocument = {
    ...incoming,
    ...existing,
    apiVersion: 'v1',
    kind: 'Config',
    clusters: clusterMerge.entries,
    contexts: contextMerge.entries,
    users: userMerge.entries,
    ...(currentContext ? { 'current-context': currentContext } : {}),
  }

  return {
    document,
    contextNames: incoming.contexts.map(entry => entry.name),
    replacedEntries: {
      clusters: clusterMerge.replaced,
      contexts: contextMerge.replaced,
      users: userMerge.replaced,
    },
  }
}

export function contextEntryNames(
  contexts: readonly KubeconfigContextSelection[],
): readonly string[] {
  return contexts.map(context =>
    `luna/${context.projectId}/${context.runtimeClusterId}/${context.applicationId ?? 'all'}`)
}

export function findAnticipatedConflicts(
  document: KubeconfigDocument,
  contextNames: readonly string[],
): readonly Readonly<{ kind: 'cluster' | 'context', name: string }>[] {
  const expected = new Set(contextNames)
  return [
    ...document.clusters
      .filter(entry => expected.has(entry.name))
      .map(entry => ({ kind: 'cluster' as const, name: entry.name })),
    ...document.contexts
      .filter(entry => expected.has(entry.name))
      .map(entry => ({ kind: 'context' as const, name: entry.name })),
  ]
}

function mergeNamedEntries(
  kind: 'clusters' | 'contexts' | 'users',
  existing: readonly KubeconfigNamedEntry[],
  incoming: readonly KubeconfigNamedEntry[],
  replaceConflicts: boolean,
): {
  readonly entries: readonly KubeconfigNamedEntry[]
  readonly conflicts: readonly Readonly<{ kind: string, name: string }>[]
  readonly replaced: readonly string[]
} {
  const entries = existing.map(entry => structuredClone(entry))
  const indexByName = new Map(entries.map((entry, index) => [entry.name, index]))
  const conflicts: Array<Readonly<{ kind: string, name: string }>> = []
  const replaced: string[] = []

  for (const entry of incoming) {
    const existingIndex = indexByName.get(entry.name)
    if (existingIndex === undefined) {
      indexByName.set(entry.name, entries.length)
      entries.push(structuredClone(entry))
      continue
    }
    if (isDeepStrictEqual(entries[existingIndex], entry))
      continue
    if (!replaceConflicts) {
      conflicts.push({ kind: kind.slice(0, -1), name: entry.name })
      continue
    }
    entries[existingIndex] = structuredClone(entry)
    replaced.push(entry.name)
  }

  return { entries, conflicts, replaced }
}

function namedEntries(value: unknown, field: string): readonly KubeconfigNamedEntry[] {
  if (value === undefined)
    return []
  if (!Array.isArray(value)) {
    throw invalidInput(
      'kubeconfig_invalid',
      `The kubeconfig ${field} field must be an array.`,
      { details: { field } },
    )
  }

  const names = new Set<string>()
  return value.map((entry) => {
    if (!isRecord(entry) || !safeEntryName(entry.name)) {
      throw invalidInput(
        'kubeconfig_invalid',
        `Every kubeconfig ${field} entry must have a safe non-empty name.`,
        { details: { field } },
      )
    }
    if (names.has(entry.name)) {
      throw invalidInput(
        'kubeconfig_invalid',
        `The kubeconfig contains duplicate ${field} entry names.`,
        { details: { field, name: entry.name } },
      )
    }
    names.add(entry.name)
    return entry as KubeconfigNamedEntry
  })
}

function safeEntryName(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 512
    && !hasUnsafeNameCharacters(value)
}

function hasUnsafeNameCharacters(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1F
      || codePoint === 0x7F
      || (codePoint >= 0x202A && codePoint <= 0x202E)
      || (codePoint >= 0x2066 && codePoint <= 0x2069)
  })
}

function isSafeGatewayServer(value: string, expectedServerOrigin: string): boolean {
  try {
    const url = new URL(value)
    const expected = new URL(expectedServerOrigin)
    const secureTransport = url.protocol === 'https:'
      || (url.protocol === 'http:' && isLoopbackHost(url.hostname))
    return secureTransport
      && url.origin === expected.origin
      && !url.username
      && !url.password
      && /^\/kube\/v1\/bindings\/[\w-]+\/?$/u.test(url.pathname)
      && !url.search
      && !url.hash
  }
  catch {
    return false
  }
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

function generatedResponseInvalid(field: string): LunaError {
  return new LunaError(
    'kubeconfig_response_invalid',
    'The Luna server returned an invalid kubeconfig response.',
    { status: 502, details: { field } },
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return isRecord(value) ? value : {}
}
