import type { AuthenticationContext } from '../auth/context.js'
import type {
  CommandExecutionGlobals,
  CommandParameter,
  NormalizedCommandMetadata,
  ResourceReferenceKind,
  ResourceReferenceSpec,
  RuntimePorts,
} from './types.js'
import { CliCommandError } from './errors.js'

const RESOURCE_IDS: Readonly<Record<ResourceReferenceKind, {
  readonly label: string
  readonly pattern: RegExp
  readonly prefix: string
}>> = Object.freeze({
  'project': {
    label: 'project',
    pattern: /^prj_[0-9a-f]{24}$/,
    prefix: 'prj_',
  },
  'application': {
    label: 'application',
    pattern: /^app_[0-9a-f]{24}$/,
    prefix: 'app_',
  },
  'deployment-target': {
    label: 'deployment target',
    pattern: /^dplt_[0-9a-f]{24}$/,
    prefix: 'dplt_',
  },
  'release': {
    label: 'release',
    pattern: /^rel_[0-9a-f]{24}$/,
    prefix: 'rel_',
  },
})

const KNOWN_ID_PREFIXES = Object.freeze([
  ...Object.values(RESOURCE_IDS).map(value => value.prefix),
])

const RESOURCE_PARAMETER_SPECS: Readonly<Record<string, ResourceReferenceSpec>>
  = Object.freeze({
    projectId: Object.freeze({ kind: 'project' }),
    projectID: Object.freeze({ kind: 'project' }),
    applicationId: Object.freeze({
      kind: 'application',
      scope: Object.freeze(['projectId']),
    }),
    applicationID: Object.freeze({
      kind: 'application',
      scope: Object.freeze(['projectId']),
    }),
    targetId: Object.freeze({
      kind: 'deployment-target',
      scope: Object.freeze(['projectId', 'applicationId']),
    }),
    deploymentTargetId: Object.freeze({
      kind: 'deployment-target',
      scope: Object.freeze(['projectId', 'applicationId']),
    }),
    releaseId: Object.freeze({ kind: 'release', stableOnly: true }),
  })

const RESOLUTION_ORDER: Readonly<Record<ResourceReferenceKind, number>> = {
  'project': 0,
  'application': 1,
  'deployment-target': 2,
  'release': 3,
}

export function resourceReferenceForParameter(
  name: string,
): ResourceReferenceSpec | undefined {
  return RESOURCE_PARAMETER_SPECS[name]
}

export function isStableResourceId(
  kind: ResourceReferenceKind,
  value: string,
): boolean {
  return RESOURCE_IDS[kind].pattern.test(value)
}

export async function resolveResourceReferences(
  metadata: NormalizedCommandMetadata,
  params: Readonly<Record<string, unknown>>,
  globals: CommandExecutionGlobals,
  ports: RuntimePorts,
  authentication?: AuthenticationContext,
): Promise<Readonly<Record<string, unknown>>> {
  const references = metadata.parameters
    .filter((parameter): parameter is CommandParameter & { resourceReference: ResourceReferenceSpec } =>
      parameter.resourceReference !== undefined)
    .sort((left, right) =>
      RESOLUTION_ORDER[left.resourceReference.kind]
      - RESOLUTION_ORDER[right.resourceReference.kind])
  if (references.length === 0)
    return params

  const resolvedParams: Record<string, unknown> = { ...params }
  if (isRecord(params.params))
    resolvedParams.params = { ...params.params }

  for (const parameter of references) {
    const rawValue = parameterValue(resolvedParams, parameter.name)
    if (rawValue === undefined || rawValue === null || rawValue === '')
      continue
    if (typeof rawValue !== 'string') {
      throw new CliCommandError(
        'resource_reference_invalid',
        `Resource reference "${parameter.name}" must be a string.`,
        {
          status: 400,
          exitCode: 2,
          details: { parameter: parameter.name, resource: parameter.resourceReference.kind },
        },
      )
    }

    const value = rawValue.trim()
    if (isStableResourceId(parameter.resourceReference.kind, value)) {
      setParameterValue(resolvedParams, parameter.name, value)
      continue
    }
    assertReferenceShape(parameter, value)
    if (parameter.resourceReference.stableOnly) {
      throw new CliCommandError(
        'resource_id_required',
        `"${parameter.name}" requires an immutable ${RESOURCE_IDS[parameter.resourceReference.kind].label} ID.`,
        {
          status: 400,
          exitCode: 2,
          details: {
            command: metadata.canonicalPath,
            parameter: parameter.name,
            resource: parameter.resourceReference.kind,
            expectedPrefix: RESOURCE_IDS[parameter.resourceReference.kind].prefix,
            remediation: 'Use the corresponding list command to find the immutable ID.',
          },
        },
      )
    }
    if (globals.agent) {
      throw new CliCommandError(
        'stable_resource_id_required',
        `Agent mode requires a stable ${RESOURCE_IDS[parameter.resourceReference.kind].label} ID for "${parameter.name}".`,
        {
          status: 400,
          exitCode: 2,
          details: {
            command: metadata.canonicalPath,
            parameter: parameter.name,
            resource: parameter.resourceReference.kind,
            expectedPrefix: RESOURCE_IDS[parameter.resourceReference.kind].prefix,
          },
        },
      )
    }
    if (globals.dryRun === 'client') {
      throw new CliCommandError(
        'client_dry_run_resource_id_required',
        `Client dry-run requires a stable ${RESOURCE_IDS[parameter.resourceReference.kind].label} ID for "${parameter.name}".`,
        {
          status: 400,
          exitCode: 2,
          details: {
            command: metadata.canonicalPath,
            parameter: parameter.name,
            resource: parameter.resourceReference.kind,
            expectedPrefix: RESOURCE_IDS[parameter.resourceReference.kind].prefix,
          },
        },
      )
    }
    if (!ports.api.resolveResource) {
      throw new CliCommandError(
        'resource_resolution_unsupported',
        'This CLI API adapter does not support resource reference resolution.',
        {
          status: 501,
          details: { parameter: parameter.name, resource: parameter.resourceReference.kind },
        },
      )
    }

    const scope = resourceScope(parameter, resolvedParams)
    const result = await ports.api.resolveResource({
      kind: parameter.resourceReference.kind,
      parameter: parameter.name,
      value,
      scope,
    }, globals, authentication)
    if (!isStableResourceId(parameter.resourceReference.kind, result.id)) {
      throw new CliCommandError(
        'resource_resolution_invalid',
        'The Luna server returned an invalid resource ID while resolving a reference.',
        {
          status: 502,
          details: {
            parameter: parameter.name,
            resource: parameter.resourceReference.kind,
          },
        },
      )
    }
    setParameterValue(resolvedParams, parameter.name, result.id)
  }

  return resolvedParams
}

function assertReferenceShape(
  parameter: CommandParameter & { resourceReference: ResourceReferenceSpec },
  value: string,
): void {
  const expected = RESOURCE_IDS[parameter.resourceReference.kind]
  const knownPrefix = KNOWN_ID_PREFIXES.find(prefix => value.startsWith(prefix))
  if (!knownPrefix)
    return
  const code = knownPrefix === expected.prefix
    ? 'resource_id_invalid'
    : 'resource_reference_type_mismatch'
  throw new CliCommandError(
    code,
    knownPrefix === expected.prefix
      ? `"${value}" is not a valid ${expected.label} ID.`
      : `"${value}" is not a ${expected.label} ID.`,
    {
      status: 400,
      exitCode: 2,
      details: {
        parameter: parameter.name,
        resource: parameter.resourceReference.kind,
        expectedPrefix: expected.prefix,
        actualPrefix: knownPrefix,
      },
    },
  )
}

function resourceScope(
  parameter: CommandParameter & { resourceReference: ResourceReferenceSpec },
  params: Readonly<Record<string, unknown>>,
): Readonly<Record<string, string>> {
  const scope: Record<string, string> = {}
  for (const name of parameter.resourceReference.scope ?? []) {
    const value = parameterValue(params, name)
    if (typeof value !== 'string' || !value.trim()) {
      throw new CliCommandError(
        'resource_reference_scope_required',
        `Resolving "${parameter.name}" requires "${name}".`,
        {
          status: 400,
          exitCode: 2,
          details: {
            parameter: parameter.name,
            resource: parameter.resourceReference.kind,
            missingScope: name,
          },
        },
      )
    }
    scope[name] = value
  }
  return scope
}

function parameterValue(
  params: Readonly<Record<string, unknown>>,
  name: string,
): unknown {
  if (Object.hasOwn(params, name))
    return params[name]
  return isRecord(params.params) ? params.params[name] : undefined
}

function setParameterValue(
  params: Record<string, unknown>,
  name: string,
  value: string,
): void {
  params[name] = value
  if (!isRecord(params.params) || !Object.hasOwn(params.params, name))
    return
  const structured = { ...params.params }
  delete structured[name]
  if (Object.keys(structured).length === 0)
    delete params.params
  else
    params.params = structured
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
