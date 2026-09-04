import type {
  OperationCatalogEntry,
  OperationCatalogMetadata,
} from '@luna-devops/api-contract'
import type {
  CommandCatalogEntry,
  CommandCatalogMetadata,
  CommandParameter,
  CommandResult,
  JsonSchema,
} from './types.js'
import { CliCommandError } from './errors.js'
import { CommandRegistry } from './registry.js'

interface CanonicalContractModule {
  readonly OPERATION_CATALOG: readonly OperationCatalogEntry[]
  readonly OPERATION_CATALOG_METADATA: OperationCatalogMetadata
}

const GLOBAL_HTTP_HEADERS = new Set(['idempotency-key'])

export function createRegistryFromContract(contractModule: CanonicalContractModule): CommandRegistry {
  const catalog = extractCatalog(contractModule)
  const registry = new CommandRegistry(catalog.metadata)
  registerOpenApiCommands(registry, catalog.entries)
  return registry
}

export function extractCatalog(contractModule: CanonicalContractModule): {
  metadata: Partial<CommandCatalogMetadata>
  entries: readonly CommandCatalogEntry[]
} {
  const metadata = contractModule.OPERATION_CATALOG_METADATA

  return {
    metadata: {
      catalogVersion: metadata.catalogVersion,
      openapiDigest: metadata.openapiDigest,
      schemaDigest: metadata.catalogDigest,
    },
    entries: contractModule.OPERATION_CATALOG.map(normalizeCatalogEntry),
  }
}

export function registerOpenApiCommands(
  registry: CommandRegistry,
  entries: readonly CommandCatalogEntry[],
): void {
  for (const entry of entries) {
    if (
      entry.source !== 'openapi'
      || entry.hidden
    ) {
      continue
    }
    const commandPath = entry.canonicalPath ?? `${entry.category}.${entry.tool}`
    const existing = registry.get(commandPath)
    if (
      existing?.metadata.source === 'protocol'
      && entry.operationId
      && existing.metadata.consumedOperations?.includes(entry.operationId)
    ) {
      continue
    }
    registry.register(entry, async (invocation, ports) => {
      if (!entry.operationId) {
        throw new CliCommandError(
          'missing_operation_id',
          `Command "${invocation.metadata.canonicalPath}" has no operationId.`,
          { status: 500 },
        )
      }
      const result = await ports.api.execute({
        operationId: entry.operationId,
        params: invocation.params,
        globals: invocation.globals,
        metadata: invocation.metadata,
        authentication: invocation.authentication,
      })
      return asCommandResult(result, invocation.metadata.schemaVersion)
    })
  }
}

function normalizeCatalogEntry(entry: OperationCatalogEntry): CommandCatalogEntry {
  const command = entry.command
  const category = command.category
  const tool = command.tool
  const parameters = parameterArray(entry.parameters)
    .filter(parameter => !isGlobalHttpHeader(parameter))
  if (entry.requestBody) {
    parameters.push({
      name: 'body',
      location: 'body',
      description: 'OpenAPI request body.',
      required: entry.requestBody.required,
      valueSources: ['file', 'stdin'],
      schema: {
        type: ['object', 'array', 'string', 'null'],
        contentTypes: entry.requestBody.contentTypes,
        schemaRefs: entry.requestBody.schemaRefs,
      },
    })
  }

  return {
    category,
    tool,
    canonicalPath: command.canonicalPath,
    categoryAliases: command.categoryAliases,
    aliases: command.aliases,
    source: 'openapi',
    operationId: entry.operationId,
    summary: entry.summary,
    description: entry.description,
    parameters,
    inputSchema: withoutGlobalHttpHeaders(schemaValue(entry.inputSchema)),
    outputSchema: schemaValue(entry.outputSchema),
    errorSchema: schemaValue(entry.errorSchema),
    mfaPurpose: command.mfaPurpose,
    risk: command.risk,
    transport: command.transport,
    projectContext: command.projectContext,
    streaming: command.streaming,
    hidden: command.hidden,
    agentAllowed: command.agentAllowed,
    examples: command.examples,
    method: entry.method,
    path: entry.path,
  }
}

function parameterArray(value: unknown): CommandParameter[] {
  if (!Array.isArray(value))
    return []
  return value.map((item) => {
    const parameter = asRecord(item)
    return {
      name: requiredString(parameter.name, 'parameter name'),
      location: parameterLocation(parameter.in ?? parameter.location),
      description: stringValue(parameter.description),
      descriptionKey: stringValue(parameter.descriptionKey),
      required: booleanValue(parameter.required),
      repeated: booleanValue(parameter.repeated),
      sensitive: booleanValue(parameter.sensitive),
      valueSources: valueSourceArray(parameter.valueSources),
      schema: schemaValue(parameter.schema),
    }
  })
}

function isGlobalHttpHeader(parameter: CommandParameter): boolean {
  return parameter.location === 'header'
    && GLOBAL_HTTP_HEADERS.has(parameter.name.toLocaleLowerCase())
}

function withoutGlobalHttpHeaders(schema: JsonSchema | undefined): JsonSchema | undefined {
  if (!schema)
    return undefined
  const properties = asRecord(schema.properties)
  const filteredProperties = Object.fromEntries(
    Object.entries(properties).filter(([name]) =>
      !GLOBAL_HTTP_HEADERS.has(name.toLocaleLowerCase())),
  )
  const required = Array.isArray(schema.required)
    ? schema.required.filter(name =>
        typeof name !== 'string'
        || !GLOBAL_HTTP_HEADERS.has(name.toLocaleLowerCase()))
    : undefined
  if (
    Object.keys(filteredProperties).length === Object.keys(properties).length
    && required === undefined
  ) {
    return schema
  }
  return {
    ...schema,
    properties: filteredProperties,
    ...(required ? { required } : {}),
  }
}

function valueSourceArray(
  value: unknown,
): readonly ('inline' | 'file' | 'stdin')[] | undefined {
  if (!Array.isArray(value))
    return undefined
  return value.filter(
    (item): item is 'inline' | 'file' | 'stdin' =>
      item === 'inline' || item === 'file' || item === 'stdin',
  )
}

function asCommandResult(value: unknown, schemaVersion?: string): CommandResult {
  const record = asRecord(value)
  if ('data' in record && ('schemaVersion' in record || 'meta' in record)) {
    return value as CommandResult
  }
  return { data: value, schemaVersion }
}

function parameterLocation(
  value: unknown,
): 'query' | 'header' | 'path' | 'cookie' | 'body' | undefined {
  return value === 'query'
    || value === 'header'
    || value === 'path'
    || value === 'cookie'
    || value === 'body'
    ? value
    : undefined
}

function schemaValue(value: unknown): JsonSchema | undefined {
  return typeof value === 'object' && value !== null
    ? value as JsonSchema
    : undefined
}

function requiredString(value: unknown, label: string): string {
  const result = stringValue(value)
  if (!result) {
    throw new CliCommandError('invalid_command_catalog', `Missing ${label}.`, {
      status: 500,
    })
  }
  return result
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : {}
}
