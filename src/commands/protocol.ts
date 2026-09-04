import type {
  CommandHandler,
  CommandInvocation,
  CommandMetadata,
  CommandParameter,
  CommandResult,
  RuntimePorts,
} from './types.js'
import { CliCommandError } from './errors.js'
import { executeWebSocketTerminal } from './protocol-terminal.js'
import { executeSseStream } from './stream.js'
import {
  executeVolumeAdopt,
  executeVolumeDelete,
  executeVolumeExport,
  executeVolumeImport,
  executeVolumeRetry,
  executeVolumeTransferRetry,
  executeVolumeUpdate,
} from './volume-transfer.js'

const BUILD_LOG_STREAM_PATH = '/api/v1/projects/{projectId}/build-jobs/{jobId}/logs/stream'
const DEPLOYMENT_METRICS_STREAM_PATH
  = '/api/v1/projects/{projectId}/applications/{applicationId}/deployment-targets/{targetId}/metrics/stream'
const RUNTIME_TERMINAL_PATH = '/api/v1/runtime/clusters/{clusterId}/pods/terminal'
const RELEASE_TERMINAL_PATH = '/api/v1/projects/{projectId}/releases/{releaseId}/terminal'
const VOLUME_IMPORT_PATH = '/api/v1/projects/{projectId}/volume-imports'
const VOLUME_EXPORT_CONTENT_PATH
  = '/api/v1/projects/{projectId}/volume-transfers/{transferId}/content'

export interface ProtocolCommandDefinition {
  readonly metadata: CommandMetadata
  readonly handler: CommandHandler
}

export function protocolCommandDefinitions(): readonly ProtocolCommandDefinition[] {
  return [
    protocolDefinition({
      category: 'build',
      tool: 'job-logs-follow',
      source: 'protocol',
      consumedOperations: ['streamBuildJobLogs'],
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
      examples: [
        'luna build job-logs-follow jobId=bldj_example maxEvents=200',
        'luna build job-logs-follow jobId=bldj_example --agent',
      ],
    }),
    protocolDefinition({
      category: 'volume',
      tool: 'import',
      source: 'protocol',
      consumedOperations: [
        'createVolumeImport',
        'getVolumeTransfer',
        'uploadVolumeImportContent',
      ],
      method: 'POST',
      path: VOLUME_IMPORT_PATH,
      summary: 'Import a local archive into a project volume',
      summaryKey: 'commands.volume.import.summary',
      transport: 'upload',
      projectContext: 'required',
      risk: 'high',
      mfaPurpose: 'volume_import',
      agentAllowed: false,
      parameters: [
        pathParameter('projectId'),
        localParameter('file', { type: 'string', minLength: 1 }, true),
        localParameter('displayName', { type: 'string', minLength: 1, maxLength: 120 }, true),
        localParameter('clusterId', { type: 'string', minLength: 1 }, true),
        localParameter('capacity', { type: 'string', minLength: 1 }, true),
        localParameter('storageClassName', { type: 'string', minLength: 1 }, true),
        localParameter('format', { type: 'string', enum: ['tar_gz', 'raw_zst'] }),
        localParameter('accessMode', {
          type: 'string',
          enum: ['ReadWriteOnce', 'ReadWriteOncePod', 'ReadOnlyMany', 'ReadWriteMany'],
        }),
        localParameter('volumeMode', { type: 'string', enum: ['Filesystem', 'Block'] }),
        localParameter('checksum', { type: 'string', pattern: '^[a-fA-F0-9]{64}$' }),
        localParameter('pollIntervalMs', { type: 'integer', minimum: 1, maximum: 60_000 }),
        localParameter('waitTimeoutMs', { type: 'integer', minimum: 1, maximum: 86_400_000 }),
      ],
      examples: [
        'luna volume import file=backup.tar.gz displayName=data clusterId=cluster_example capacity=10Gi storageClassName=standard idempotencyKey=volume-import-001',
      ],
    }),
    protocolDefinition({
      category: 'volume',
      tool: 'export',
      source: 'protocol',
      consumedOperations: [
        'createVolumeExport',
        'getVolumeTransfer',
        'authorizeVolumeTransferDownload',
        'downloadVolumeTransferContent',
        'downloadVolumeTransferManifest',
      ],
      method: 'GET',
      path: VOLUME_EXPORT_CONTENT_PATH,
      summary: 'Export a project volume to a local archive',
      summaryKey: 'commands.volume.export.summary',
      transport: 'download',
      projectContext: 'required',
      risk: 'high',
      mfaPurpose: 'volume_export',
      agentAllowed: false,
      parameters: [
        pathParameter('projectId'),
        localParameter('volumeId', { type: 'string', minLength: 1 }),
        localParameter('transferId', { type: 'string', minLength: 1 }),
        localParameter('destination', { type: 'string', minLength: 1 }, true),
        localParameter('format', { type: 'string', enum: ['tar_gz', 'raw_zst'] }),
        localParameter('consistency', {
          type: 'string',
          enum: ['auto', 'snapshot', 'live'],
        }),
        localParameter('overwrite', { type: 'boolean' }),
        localParameter('maxBytes', { type: 'integer', minimum: 1 }),
        localParameter('pollIntervalMs', { type: 'integer', minimum: 1, maximum: 60_000 }),
        localParameter('waitTimeoutMs', { type: 'integer', minimum: 1, maximum: 86_400_000 }),
      ],
      examples: [
        'luna volume export volumeId=pvol_example destination=backup.tar.gz consistency=auto idempotencyKey=volume-export-001',
        'luna volume export volumeId=pvol_block destination=block.raw.zst format=raw_zst consistency=snapshot idempotencyKey=volume-export-block-001',
        'luna volume export transferId=vtx_example destination=backup.tar.gz',
      ],
    }),
    {
      metadata: {
        category: 'volume',
        tool: 'adopt',
        source: 'protocol',
        consumedOperations: ['createProjectVolume'],
        method: 'POST',
        path: '/api/v1/projects/{projectId}/volumes',
        summary: 'Reference or adopt an existing persistent volume claim',
        summaryKey: 'commands.volume.adopt.summary',
        transport: 'http',
        projectContext: 'required',
        risk: 'high',
        mfaPurpose: 'volume_adopt',
        parameters: [
          pathParameter('projectId'),
          localParameter('displayName', { type: 'string', minLength: 1, maxLength: 120 }, true),
          localParameter('clusterId', { type: 'string', minLength: 1 }, true),
          localParameter('claimName', { type: 'string', minLength: 1, maxLength: 253 }, true),
          localParameter('ownershipMode', { type: 'string', enum: ['managed', 'referenced'] }, true),
          localParameter('capacity', { type: 'string', minLength: 1 }),
          localParameter('storageClassName', { type: 'string', minLength: 1 }),
          localParameter('accessMode', {
            type: 'string',
            enum: ['ReadWriteOnce', 'ReadWriteOncePod', 'ReadOnlyMany', 'ReadWriteMany'],
          }),
          localParameter('volumeMode', { type: 'string', enum: ['Filesystem', 'Block'] }),
        ],
        examples: [
          'luna volume adopt displayName=shared-data clusterId=cluster_example claimName=shared-pvc ownershipMode=referenced idempotencyKey=volume-adopt-001',
        ],
      },
      handler: executeVolumeAdopt,
    },
    {
      metadata: {
        category: 'volume',
        tool: 'update',
        source: 'protocol',
        consumedOperations: ['updateProjectVolume'],
        method: 'PATCH',
        path: '/api/v1/projects/{projectId}/volumes/{volumeId}',
        summary: 'Rename or expand a project volume',
        summaryKey: 'commands.volume.update.summary',
        transport: 'http',
        projectContext: 'required',
        risk: 'high',
        parameters: [
          pathParameter('projectId'),
          pathParameter('volumeId'),
          localParameter('revision', { type: 'integer', minimum: 1 }, true),
          localParameter('displayName', { type: 'string', minLength: 1, maxLength: 120 }),
          localParameter('capacity', { type: 'string', minLength: 1 }),
        ],
        examples: [
          'luna volume update volumeId=pvol_example revision=3 capacity=20Gi',
        ],
      },
      handler: executeVolumeUpdate,
    },
    {
      metadata: {
        category: 'volume',
        tool: 'delete',
        source: 'protocol',
        consumedOperations: ['deleteProjectVolume'],
        method: 'DELETE',
        path: '/api/v1/projects/{projectId}/volumes/{volumeId}',
        summary: 'Delete a managed volume or detach a referenced volume',
        summaryKey: 'commands.volume.delete.summary',
        transport: 'http',
        projectContext: 'required',
        risk: 'critical',
        mfaPurpose: 'volume_delete',
        parameters: [
          pathParameter('projectId'),
          pathParameter('volumeId'),
          localParameter('revision', { type: 'integer', minimum: 1 }, true),
          localParameter('dataAction', { type: 'string', enum: ['delete', 'detach'] }, true),
        ],
        examples: [
          'luna volume delete volumeId=pvol_example revision=3 dataAction=delete --yes',
        ],
      },
      handler: executeVolumeDelete,
    },
    {
      metadata: {
        category: 'volume',
        tool: 'retry',
        source: 'protocol',
        consumedOperations: ['getProjectVolume', 'retryProjectVolumeOperation'],
        method: 'POST',
        path: '/api/v1/projects/{projectId}/volumes/{volumeId}/retry',
        summary: 'Retry the latest failed volume operation',
        summaryKey: 'commands.volume.retry.summary',
        transport: 'http',
        projectContext: 'required',
        risk: 'high',
        parameters: [
          pathParameter('projectId'),
          pathParameter('volumeId'),
          localParameter('revision', { type: 'integer', minimum: 1 }, true),
        ],
        examples: [
          'luna volume retry volumeId=pvol_example revision=3',
        ],
      },
      handler: executeVolumeRetry,
    },
    {
      metadata: {
        category: 'volume-transfer',
        tool: 'retry',
        source: 'protocol',
        consumedOperations: ['getVolumeTransfer', 'retryVolumeTransfer'],
        method: 'POST',
        path: '/api/v1/projects/{projectId}/volume-transfers/{transferId}/retry',
        summary: 'Retry a failed volume transfer with direction-specific authorization',
        summaryKey: 'commands.volumeTransfer.retry.summary',
        transport: 'http',
        projectContext: 'required',
        risk: 'high',
        agentAllowed: false,
        parameters: [
          pathParameter('projectId'),
          pathParameter('transferId'),
        ],
        examples: [
          'luna volume-transfer retry transferId=vtx_example idempotencyKey=volume-retry-001 --yes',
        ],
      },
      handler: executeVolumeTransferRetry,
    },
    protocolDefinition({
      category: 'deployment',
      tool: 'metrics-follow',
      source: 'protocol',
      consumedOperations: ['streamDeploymentTargetMetrics'],
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
      examples: [
        'luna deployment metrics-follow applicationId=app_example targetId=dplt_example maxEvents=10',
      ],
    }),
    webSocketDefinition({
      category: 'cluster',
      tool: 'pod-terminal',
      path: RUNTIME_TERMINAL_PATH,
      consumedOperations: [
        'authorizeRuntimeClusterPodTerminal',
        'streamRuntimeClusterPodTerminal',
      ],
      parameters: [
        pathParameter('clusterId'),
        queryParameter('namespace', { type: 'string', minLength: 1 }, true),
        queryParameter('name', { type: 'string', minLength: 1 }, true),
        queryParameter('container', { type: 'string' }),
      ],
      mfaPurpose: 'runtime_terminal',
    }),
    webSocketDefinition({
      category: 'release',
      tool: 'exec',
      aliases: ['terminal'],
      path: RELEASE_TERMINAL_PATH,
      consumedOperations: [
        'authorizeReleaseRuntimeTerminal',
        'streamReleaseRuntimeTerminal',
      ],
      projectContext: 'required',
      parameters: [
        pathParameter('projectId'),
        pathParameter('releaseId'),
        queryParameter('container', { type: 'string' }),
      ],
      mfaPurpose: 'runtime_terminal',
      summary: 'Open an interactive exec session for a release',
      description: 'Connect the local TTY to the release container until the remote shell exits.',
      examples: [
        'luna release exec projectId=prj_example releaseId=rel_example',
        'luna release exec projectId=prj_example releaseId=rel_example container=app',
      ],
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
  if (
    invocation.metadata.transport === 'download'
    && invocation.metadata.canonicalPath === 'volume.export'
  ) {
    return executeVolumeExport(invocation, ports)
  }
  if (invocation.metadata.transport === 'upload')
    return executeVolumeImport(invocation, ports)
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
    agentAllowed: false,
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
  required = false,
): CommandParameter {
  return { name, schema, required }
}
