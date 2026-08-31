import type {
  CommandHandler,
  CommandInvocation,
  CommandMetadata,
  CommandParameter,
  CommandResult,
  RuntimePorts,
} from './types.js'
import { executeDownload } from './download.js'
import { CliCommandError } from './errors.js'
import { kubeconfigCommandDefinitions } from './kubeconfig.js'
import { executeWebSocketTerminal } from './protocol-terminal.js'
import { executeSseStream } from './stream.js'

const BUILD_LOG_STREAM_PATH = '/api/v1/projects/{projectId}/build-jobs/{jobId}/logs/stream'
const DEPLOYMENT_METRICS_STREAM_PATH
  = '/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}/metrics/stream'
const RUNTIME_TERMINAL_PATH = '/api/v1/runtime/clusters/{clusterId}/pods/terminal'
const RELEASE_TERMINAL_PATH = '/api/v1/projects/{projectId}/releases/{releaseId}/terminal'

export interface ProtocolCommandDefinition {
  readonly metadata: CommandMetadata
  readonly handler: CommandHandler
}

export function protocolCommandDefinitions(): readonly ProtocolCommandDefinition[] {
  return [
    ...kubeconfigCommandDefinitions(),
    protocolDefinition({
      category: 'build',
      tool: 'job-logs-follow',
      source: 'protocol',
      consumedOperations: ['StreamBuildJobLogs'],
      method: 'GET',
      path: BUILD_LOG_STREAM_PATH,
      summary: 'Follow build job logs',
      transport: 'sse',
      streaming: true,
      projectContext: 'required',
      parameters: [
        pathParameter('projectId'),
        pathParameter('jobId'),
        queryParameter('after', { type: 'integer', minimum: 0 }),
        localParameter('maxEvents', { type: 'integer', minimum: 1, maximum: 10_000 }),
        localParameter('maxBytes', { type: 'integer', minimum: 1, maximum: 16 * 1024 * 1024 }),
      ],
      scopes: ['build:read'],
      examples: [
        'luna build job-logs-follow jobId=bldj_example maxEvents=200',
        'luna build job-logs-follow jobId=bldj_example --agent',
      ],
    }),
    protocolDefinition({
      category: 'deployment',
      tool: 'metrics-follow',
      source: 'protocol',
      consumedOperations: ['StreamDeploymentTargetMetrics'],
      method: 'GET',
      path: DEPLOYMENT_METRICS_STREAM_PATH,
      summary: 'Follow deployment runtime metrics',
      transport: 'sse',
      streaming: true,
      projectContext: 'required',
      parameters: [
        pathParameter('projectId'),
        pathParameter('applicationId'),
        pathParameter('targetId'),
        localParameter('maxEvents', { type: 'integer', minimum: 1, maximum: 10_000 }),
        localParameter('maxBytes', { type: 'integer', minimum: 1, maximum: 16 * 1024 * 1024 }),
      ],
      scopes: ['deployment:read'],
      examples: [
        'luna deployment metrics-follow applicationId=app_example targetId=dplt_example maxEvents=10',
      ],
    }),
    webSocketDefinition({
      category: 'cluster',
      tool: 'pod-terminal',
      path: RUNTIME_TERMINAL_PATH,
      consumedOperations: [
        'AuthorizeRuntimeClusterPodTerminal',
        'StreamRuntimeClusterPodTerminal',
      ],
      parameters: [
        pathParameter('clusterId'),
        queryParameter('namespace', { type: 'string', minLength: 1 }, true),
        queryParameter('name', { type: 'string', minLength: 1 }, true),
        queryParameter('container', { type: 'string' }),
      ],
      mfaPurpose: 'runtime_terminal',
      scopes: ['cluster:manage'],
    }),
    webSocketDefinition({
      category: 'release',
      tool: 'terminal',
      path: RELEASE_TERMINAL_PATH,
      consumedOperations: [
        'AuthorizeReleaseRuntimeTerminal',
        'StreamReleaseRuntimeTerminal',
      ],
      projectContext: 'required',
      parameters: [
        pathParameter('projectId'),
        pathParameter('releaseId'),
        queryParameter('container', { type: 'string' }),
      ],
      mfaPurpose: 'runtime_terminal',
      scopes: ['deployment:exec'],
    }),
  ]
}

export function prepareProtocolRegistration(
  metadata: CommandMetadata,
  handler: CommandHandler,
): { metadata: CommandMetadata, handler: CommandHandler } {
  if (!isProtocolTransport(metadata.transport))
    return { metadata, handler }
  return {
    metadata,
    handler: protocolHandler,
  }
}

async function protocolHandler(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  if (invocation.metadata.transport === 'sse')
    return executeSseStream(invocation, ports)
  if (invocation.metadata.transport === 'download')
    return executeDownload(invocation, ports)
  if (invocation.metadata.transport === 'websocket')
    return executeWebSocketTerminal(invocation, ports)
  throw new CliCommandError(
    'protocol_transport_unsupported',
    `Protocol transport "${invocation.metadata.transport}" is not supported.`,
    { status: 501, details: { transport: invocation.metadata.transport } },
  )
}

function protocolDefinition(metadata: CommandMetadata): ProtocolCommandDefinition {
  return { metadata, handler: protocolHandler }
}

function webSocketDefinition(
  options: Omit<CommandMetadata, 'source' | 'method' | 'transport' | 'streaming' | 'agentAllowed'>,
): ProtocolCommandDefinition {
  return protocolDefinition({
    ...options,
    source: 'protocol',
    method: 'GET',
    transport: 'websocket',
    streaming: true,
    agentAllowed: true,
    risk: options.risk ?? 'high',
    summary: options.summary ?? 'Open an interactive terminal',
  })
}

function isProtocolTransport(
  value: CommandMetadata['transport'],
): value is 'sse' | 'websocket' | 'download' | 'upload' {
  return value === 'sse' || value === 'websocket' || value === 'download' || value === 'upload'
}

function pathParameter(name: string): CommandParameter {
  return {
    name,
    location: 'path',
    required: true,
    schema: { type: 'string', minLength: 1 },
  }
}

function queryParameter(
  name: string,
  schema: Readonly<Record<string, unknown>>,
  required = false,
): CommandParameter {
  return { name, location: 'query', required, schema }
}

function localParameter(
  name: string,
  schema: Readonly<Record<string, unknown>>,
): CommandParameter {
  return { name, schema }
}
