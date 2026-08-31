import type { KubeconfigContextSelection, KubeconfigDocument, KubeconfigTargetSnapshot } from '../kubeconfig/index.js'
import type {
  CommandHandler,
  CommandInvocation,
  CommandMetadata,
  CommandParameter,
  CommandResult,
  NormalizedCommandMetadata,
  RuntimePorts,
} from './types.js'
import {
  assertSafeGeneratedKubeconfig,
  atomicWriteKubeconfig,
  contextEntryNames,
  findAnticipatedConflicts,
  inspectKubeconfigTarget,
  mergeKubeconfigDocuments,
  parseKubeconfig,
  resolveDefaultMergePath,
  resolveKubeconfigPath,
  stringifyKubeconfig,
} from '../kubeconfig/index.js'
import { CliCommandError, toCliCommandError } from './errors.js'

export const CREATE_KUBE_CREDENTIAL_OPERATION = 'createKubeCredential'
export const REVOKE_KUBE_CREDENTIAL_OPERATION = 'revokeKubeCredential'
export const PROTOCOL_ONLY_OPERATION_IDS = new Set([
  CREATE_KUBE_CREDENTIAL_OPERATION,
])

const KUBE_CREDENTIAL_PATH = '/api/v1/kube-credentials'
const CONTEXT_ID_PATTERN = /^[A-Za-z0-9][\w-]{0,127}$/u
const SCOPE_MAP = Object.freeze({
  read: 'kube:read',
  write: 'kube:write',
  connect: 'kube:connect',
} as const)

interface KubeconfigCommandDefinition {
  readonly metadata: CommandMetadata
  readonly handler: CommandHandler
}

interface CreatedKubeCredential {
  readonly credentialId: string
  readonly document: KubeconfigDocument
  readonly meta?: Readonly<Record<string, unknown>>
}

export function kubeconfigCommandDefinitions(): readonly KubeconfigCommandDefinition[] {
  return [
    {
      metadata: kubeconfigMetadata('write', [
        commonParameter('destination', { required: true }),
      ], [
        'luna kubeconfig write credentialName=development context=prj_example:clu_example scope=read destination=~/.kube/luna.yaml',
      ]),
      handler: executeKubeconfigWrite,
    },
    {
      metadata: kubeconfigMetadata('merge', [
        commonParameter('destination'),
        commonParameter('replaceConflicts', { schema: { type: 'boolean' } }),
      ], [
        'luna kubeconfig merge credentialName=development context=prj_example:clu_example scope=read',
        'luna kubeconfig merge credentialName=development context=prj_example:clu_example scope=read destination=~/.kube/config replaceConflicts=true',
      ]),
      handler: executeKubeconfigMerge,
    },
  ]
}

export async function executeKubeconfigWrite(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  assertDryRunDisabled(invocation)
  const request = parseCredentialRequest(invocation.params)
  const target = resolveKubeconfigPath(requiredString(invocation.params.destination, 'destination'))
  const snapshot = await inspectKubeconfigTarget(target, { requireAbsent: true })
  return createAndPersist(invocation, ports, request, snapshot, 'write', false)
}

export async function executeKubeconfigMerge(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  assertDryRunDisabled(invocation)
  const request = parseCredentialRequest(invocation.params)
  const target = resolveDefaultMergePath(
    optionalString(invocation.params.destination),
    ports.env ?? {},
  )
  const snapshot = await inspectKubeconfigTarget(target)
  const replaceConflicts = invocation.params.replaceConflicts === true
  if (snapshot.document && !replaceConflicts) {
    const conflicts = findAnticipatedConflicts(
      snapshot.document,
      contextEntryNames(request.contexts),
    )
    if (conflicts.length > 0) {
      throw new CliCommandError(
        'kubeconfig_conflict',
        'The target kubeconfig already contains one or more requested context names.',
        {
          status: 409,
          details: { entries: conflicts, path: snapshot.path },
        },
      )
    }
  }
  return createAndPersist(
    invocation,
    ports,
    request,
    snapshot,
    'merge',
    replaceConflicts,
  )
}

async function createAndPersist(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  request: ReturnType<typeof parseCredentialRequest>,
  snapshot: KubeconfigTargetSnapshot,
  mode: 'merge' | 'write',
  replaceConflicts: boolean,
): Promise<CommandResult> {
  const created = await createKubeCredential(invocation, ports, request)
  try {
    const expectedContextNames = [...contextEntryNames(request.contexts)].sort()
    const actualContextNames = created.document.contexts.map(entry => entry.name).sort()
    if (
      expectedContextNames.length !== actualContextNames.length
      || expectedContextNames.some((name, index) => name !== actualContextNames[index])
    ) {
      throw new CliCommandError(
        'kubeconfig_response_invalid',
        'The Luna server returned contexts that do not match the request.',
        { status: 502, details: { field: 'contexts' } },
      )
    }

    const merged = mode === 'merge' && snapshot.document
      ? mergeKubeconfigDocuments(snapshot.document, created.document, {
          replaceConflicts,
        })
      : {
          document: created.document,
          contextNames: created.document.contexts.map(entry => entry.name),
          replacedEntries: { clusters: [], contexts: [], users: [] },
        }
    await atomicWriteKubeconfig(snapshot, stringifyKubeconfig(merged.document))
    return {
      schemaVersion: `cli.luna.devops/kubeconfig-${mode}/v1`,
      data: {
        path: snapshot.path,
        credentialId: created.credentialId,
        contexts: merged.contextNames,
        mode,
        replacedConflicts:
          merged.replacedEntries.clusters.length
          + merged.replacedEntries.contexts.length
          + merged.replacedEntries.users.length,
      },
      meta: created.meta,
    }
  }
  catch (error) {
    return throwAfterRevocation(invocation, ports, created.credentialId, error)
  }
}

async function createKubeCredential(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  request: ReturnType<typeof parseCredentialRequest>,
): Promise<CreatedKubeCredential> {
  const result = await ports.api.execute({
    operationId: CREATE_KUBE_CREDENTIAL_OPERATION,
    params: { body: request },
    globals: invocation.globals,
    metadata: apiMetadata(invocation.metadata, {
      operationId: CREATE_KUBE_CREDENTIAL_OPERATION,
      method: 'POST',
      path: KUBE_CREDENTIAL_PATH,
      parameters: [{ name: 'body', location: 'body', required: true }],
    }),
    authentication: invocation.authentication,
  })
  const commandResult = asCommandResult(result)
  const response = asRecord(commandResult.data)
  const credential = asRecord(response.credential)
  const credentialId = safeResourceId(credential.id)
  if (!credentialId) {
    throw new CliCommandError(
      'kubeconfig_response_invalid',
      'The Luna server returned an invalid kube credential response.',
      { status: 502, details: { field: 'credential.id' } },
    )
  }
  if (typeof response.kubeconfig !== 'string') {
    return throwAfterRevocation(
      invocation,
      ports,
      credentialId,
      new CliCommandError(
        'kubeconfig_response_invalid',
        'The Luna server did not return the one-time kubeconfig.',
        { status: 502, details: { field: 'kubeconfig' } },
      ),
    )
  }

  let document: KubeconfigDocument
  try {
    document = parseKubeconfig(response.kubeconfig)
    assertSafeGeneratedKubeconfig(
      document,
      invocation.globals.server ?? '',
      credentialId,
    )
  }
  catch (error) {
    await throwAfterRevocation(invocation, ports, credentialId, error)
  }
  return { credentialId, document: document!, meta: commandResult.meta }
}

async function throwAfterRevocation(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  credentialId: string,
  originalError: unknown,
): Promise<never> {
  const original = toCliCommandError(originalError)
  try {
    await ports.api.execute({
      operationId: REVOKE_KUBE_CREDENTIAL_OPERATION,
      params: { credentialId },
      globals: invocation.globals,
      metadata: apiMetadata(invocation.metadata, {
        operationId: REVOKE_KUBE_CREDENTIAL_OPERATION,
        method: 'DELETE',
        path: `${KUBE_CREDENTIAL_PATH}/{credentialId}`,
        parameters: [{ name: 'credentialId', location: 'path', required: true }],
      }),
      authentication: invocation.authentication,
    })
  }
  catch (revocationError) {
    const revocation = toCliCommandError(revocationError)
    throw new CliCommandError(
      'kubeconfig_write_failed_revoke_failed',
      'The kubeconfig could not be saved and the new credential could not be revoked automatically.',
      {
        status: 500,
        details: {
          credentialId,
          causeCode: original.code,
          revokeCauseCode: revocation.code,
          manualRevokeCommand: `luna kubectl-access revoke-kube-credential credentialId=${credentialId}`,
        },
        cause: originalError,
      },
    )
  }
  throw new CliCommandError(original.code, original.message, {
    status: original.status,
    exitCode: original.exitCode,
    retryable: original.retryable,
    details: {
      ...original.details,
      credentialId,
      credentialRevoked: true,
    },
    cause: originalError,
  })
}

function parseCredentialRequest(params: Readonly<Record<string, unknown>>): {
  readonly name: string
  readonly expiresInDays: 1 | 7 | 30
  readonly scopes: readonly string[]
  readonly contexts: readonly KubeconfigContextSelection[]
} {
  const name = requiredString(params.credentialName, 'credentialName').trim()
  if (name.length < 1 || name.length > 64)
    throw invalidArguments('credentialName must contain 1 to 64 characters.', 'credentialName')

  const expiresInDays = params.expiresInDays ?? 7
  if (expiresInDays !== 1 && expiresInDays !== 7 && expiresInDays !== 30) {
    throw invalidArguments('expiresInDays must be 1, 7, or 30.', 'expiresInDays')
  }

  const rawScopes = stringList(params.scope)
  if (rawScopes.length < 1)
    throw invalidArguments('At least one scope is required.', 'scope')
  const scopes = [...new Set(rawScopes.map((scope) => {
    const mapped = SCOPE_MAP[scope as keyof typeof SCOPE_MAP]
    if (!mapped)
      throw invalidArguments('scope must be read, write, or connect.', 'scope')
    return mapped
  }))]

  const rawContexts = stringList(params.context)
  if (rawContexts.length < 1 || rawContexts.length > 20) {
    throw invalidArguments('context must contain between 1 and 20 entries.', 'context')
  }
  const contexts = rawContexts.map(parseContextSelection)
  const unique = new Set(contexts.map(context => [
    context.projectId,
    context.runtimeClusterId,
    context.applicationId ?? '',
  ].join(':')))
  if (unique.size !== contexts.length)
    throw invalidArguments('context entries must be unique.', 'context')

  return { name, expiresInDays, scopes, contexts }
}

function parseContextSelection(value: string): KubeconfigContextSelection {
  const parts = value.split(':')
  if (
    (parts.length !== 2 && parts.length !== 3)
    || !parts.every(part => CONTEXT_ID_PATTERN.test(part))
  ) {
    throw invalidArguments(
      'context must use projectId:runtimeClusterId[:applicationId] with stable resource IDs.',
      'context',
    )
  }
  return {
    projectId: parts[0]!,
    runtimeClusterId: parts[1]!,
    ...(parts[2] ? { applicationId: parts[2] } : {}),
  }
}

function kubeconfigMetadata(
  tool: 'merge' | 'write',
  modeParameters: readonly CommandParameter[],
  examples: readonly string[],
): CommandMetadata {
  return {
    category: 'kubeconfig',
    tool,
    source: 'protocol',
    consumedOperations: [CREATE_KUBE_CREDENTIAL_OPERATION],
    method: 'POST',
    path: KUBE_CREDENTIAL_PATH,
    summary: tool === 'write'
      ? 'Create a short-lived credential and write a new kubeconfig safely.'
      : 'Create a short-lived credential and merge it into one kubeconfig safely.',
    description: 'This human-only command never prints the one-time kubeconfig or secret credential material.',
    schemaVersion: `cli.luna.devops/kubeconfig-${tool}/v1`,
    scopes: ['token:manage'],
    risk: 'high',
    transport: 'http',
    projectContext: 'none',
    agentAllowed: false,
    parameters: [
      commonParameter('credentialName', {
        required: true,
        schema: { type: 'string', minLength: 1, maxLength: 64 },
      }),
      commonParameter('context', {
        required: true,
        repeated: true,
        schema: { type: 'string', minLength: 3, maxLength: 386 },
      }),
      commonParameter('scope', {
        required: true,
        repeated: true,
        descriptionKey: 'parameters.kubeScope',
        schema: { type: 'string', enum: ['read', 'write', 'connect'] },
      }),
      commonParameter('expiresInDays', {
        schema: { type: 'integer', enum: [1, 7, 30] },
      }),
      ...modeParameters,
    ],
    outputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['contexts', 'credentialId', 'mode', 'path', 'replacedConflicts'],
      properties: {
        contexts: { type: 'array', items: { type: 'string' } },
        credentialId: { type: 'string' },
        mode: { type: 'string', enum: [tool] },
        path: { type: 'string' },
        replacedConflicts: { type: 'integer', minimum: 0 },
      },
    },
    examples,
  }
}

function commonParameter(
  name: string,
  options: Omit<CommandParameter, 'name'> = {},
): CommandParameter {
  return {
    name,
    schema: { type: 'string' },
    valueSources: ['inline'],
    ...options,
  }
}

function apiMetadata(
  metadata: NormalizedCommandMetadata,
  values: {
    readonly operationId: string
    readonly method: string
    readonly path: string
    readonly parameters: readonly CommandParameter[]
  },
): NormalizedCommandMetadata {
  return {
    ...metadata,
    operationId: values.operationId,
    method: values.method,
    path: values.path,
    parameters: values.parameters,
    transport: 'http',
  }
}

function asCommandResult(value: unknown): CommandResult {
  return isRecord(value) && 'data' in value
    ? value as unknown as CommandResult
    : { data: value }
}

function requiredString(value: unknown, key: string): string {
  const result = optionalString(value)
  if (!result)
    throw invalidArguments(`Missing required argument "${key}".`, key)
  return result
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((entry): entry is string => typeof entry === 'string')
  return typeof value === 'string' ? [value] : []
}

function safeResourceId(value: unknown): string | undefined {
  return typeof value === 'string' && CONTEXT_ID_PATTERN.test(value) ? value : undefined
}

function invalidArguments(message: string, key: string): CliCommandError {
  return new CliCommandError('invalid_arguments', message, {
    status: 400,
    exitCode: 2,
    details: { key },
  })
}

function assertDryRunDisabled(invocation: CommandInvocation): void {
  if (invocation.globals.dryRun) {
    throw new CliCommandError(
      'dry_run_unsupported',
      'kubeconfig commands do not support dry-run.',
      { status: 400, exitCode: 2 },
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return isRecord(value) ? value : {}
}
