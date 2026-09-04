import type { FileHandle } from 'node:fs/promises'
import type {
  CommandInvocation,
  CommandParameter,
  CommandResult,
  NormalizedCommandMetadata,
  RuntimePorts,
} from './types.js'
import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { createWriteStream, constants as fsConstants } from 'node:fs'
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  open,
  rename,
  rm,
  rmdir,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { CliCommandError } from './errors.js'
import { openProtocolRequest } from './protocol-request.js'

const HASH_BUFFER_SIZE = 8 * 1024 * 1024
const DEFAULT_MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024 * 1024
const DEFAULT_POLL_INTERVAL_MS = 2_000
const DEFAULT_WAIT_TIMEOUT_MS = 60 * 60 * 1_000
const MAX_MANIFEST_BYTES = 1024 * 1024

interface VolumeExportManifest {
  readonly schemaVersion: 1
  readonly volumeMode: 'Block'
  readonly format: 'raw_zst'
  readonly exportedAt: string
  readonly logicalBytes: number
  readonly fileCount: 0
  readonly dataSHA256: string
  readonly consistencyMode: 'snapshot' | 'live' | 'unmounted'
}

interface ContentFingerprint {
  readonly length: number
  readonly sha256: string
}

interface PreparedExportFile {
  readonly destination: string
  readonly partial: string
  readonly recoveryPath: string
  readonly handle: FileHandle
  readonly identity: ExportFileIdentity
  readonly initialDestination: ExportDestinationState
  expectedContent?: ContentFingerprint
}

interface PreparedExportFiles {
  readonly archive: PreparedExportFile
  readonly manifest?: PreparedExportFile
  readonly transactionDirectory: string
}

interface ExportFileIdentity {
  readonly device: bigint
  readonly inode: bigint
}

interface ExportFileSnapshot extends ExportFileIdentity {
  readonly size: bigint
  readonly mtimeNs: bigint
  readonly ctimeNs: bigint
}

type ExportDestinationState
  = | { readonly kind: 'absent' }
    | { readonly kind: 'file', readonly snapshot: ExportFileSnapshot }

interface ExportBackup {
  readonly destination: string
  readonly path: string
  readonly snapshot: ExportFileSnapshot
  readonly initialSnapshot: ExportFileSnapshot
}

interface PreparedImportFile {
  readonly path: string
  readonly stagedPath: string
  readonly stagingDirectory: string
  readonly handle: FileHandle
  readonly identity: ExportFileIdentity
  readonly length: number
  readonly sha256: string
}

export async function executeVolumeImport(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  const filePath = resolve(requiredString(invocation.params.file, 'file'))
  const sourceHandle = await openRegularFile(filePath)
  let staged: PreparedImportFile | undefined
  let operationError: unknown
  let commandResult: CommandResult | undefined
  const uploadAbortController = new AbortController()
  const unsubscribeInterrupt = subscribeVolumeTransferInterrupt(ports, () => uploadAbortController.abort('interrupt'))
  try {
    requiredIdempotencyKey(invocation)
    staged = await prepareVolumeImportFile(sourceHandle, filePath)
    const requestedChecksum = optionalString(invocation.params.checksum)?.toLowerCase()
    if (requestedChecksum && requestedChecksum !== staged.sha256) {
      throw new CliCommandError(
        'volume_transfer.checksum_mismatch',
        'The local archive checksum does not match checksum.',
        { status: 422, details: { expected: requestedChecksum, actual: staged.sha256 } },
      )
    }

    const created = await createImportTransfer(invocation, ports, staged)
    const createdTransfer = transferRecord(created)
    const transferId = createdTransfer.id
    const volumeId = optionalString(asRecord(created.volume).id)
      ?? optionalString(createdTransfer.record.projectVolumeId)
    let completed: Readonly<Record<string, unknown>>
    const createdState = optionalString(createdTransfer.record.state)
    if (createdState === 'succeeded') {
      try {
        validateReconciledImportTransfer(createdTransfer.record, staged)
      }
      catch (error) {
        throw withImportTransferRecovery(error, transferId, volumeId, createdState)
      }
      completed = createdTransfer.record
    }
    else if (createdState === 'streaming') {
      completed = await reconcileImportAfterFailure(
        invocation,
        ports,
        projectId,
        transferId,
        volumeId,
        staged,
        new CliCommandError(
          'volume_transfer.upload_replay_blocked',
          'An existing one-shot import transfer was returned and its upload was not replayed.',
          { status: 409, retryable: true },
        ),
      )
    }
    else {
      await waitForTransferReady(
        invocation,
        ports,
        projectId,
        transferId,
        'import',
        uploadAbortController.signal,
      )
      try {
        completed = await uploadImportContent(
          invocation,
          ports,
          projectId,
          transferId,
          staged.handle,
          staged,
          uploadAbortController.signal,
        )
      }
      catch (error) {
        completed = await reconcileImportAfterFailure(
          invocation,
          ports,
          projectId,
          transferId,
          volumeId,
          staged,
          error,
        )
      }
    }
    try {
      validateCompletedTransfer(completed, 'import', staged.length, staged.sha256)
    }
    catch (error) {
      throw withImportTransferRecovery(
        error,
        transferId,
        volumeId,
        optionalString(completed.state),
      )
    }
    commandResult = {
      schemaVersion: 'cli.luna.devops/volume-import/v1',
      data: {
        volume: asRecord(created.volume),
        transfer: completed,
        file: {
          path: filePath,
          length: staged.length,
          sha256: staged.sha256,
        },
      },
      meta: { transport: 'upload', projectId },
    }
  }
  catch (error) {
    operationError = error
  }
  finally {
    unsubscribeInterrupt()
    await sourceHandle.close().catch(() => undefined)
  }
  if (staged) {
    try {
      await cleanupVolumeImportFile(staged)
    }
    catch (cleanupError) {
      throw withImportCleanupFailure(operationError, cleanupError, staged)
    }
  }
  if (operationError)
    throw operationError
  if (commandResult)
    return commandResult
  throw new CliCommandError(
    'internal_error',
    'The volume import ended without a result.',
    { status: 500 },
  )
}

async function reconcileImportAfterFailure(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
  transferId: string,
  volumeId: string | undefined,
  file: PreparedImportFile,
  operationError: unknown,
): Promise<Readonly<Record<string, unknown>>> {
  let authoritative: Readonly<Record<string, unknown>>
  try {
    authoritative = await getVolumeTransfer(invocation, ports, projectId, transferId)
  }
  catch (readbackError) {
    throw withImportTransferRecovery(
      operationError,
      transferId,
      volumeId,
      undefined,
      readbackError,
    )
  }
  const state = optionalString(authoritative.state)
  if (state !== 'succeeded') {
    throw withImportTransferRecovery(
      operationError,
      transferId,
      volumeId,
      state,
    )
  }
  try {
    validateReconciledImportTransfer(authoritative, file)
  }
  catch (error) {
    throw withImportTransferRecovery(error, transferId, volumeId, state)
  }
  return authoritative
}

function validateReconciledImportTransfer(
  transfer: Readonly<Record<string, unknown>>,
  file: PreparedImportFile,
): void {
  const expectedBytes = requiredNonNegativeInteger(transfer.expectedBytes, 'expectedBytes')
  if (expectedBytes !== file.length) {
    throw new CliCommandError(
      'volume_transfer.checksum_mismatch',
      'The completed import transfer does not match the protected local staging archive.',
      {
        status: 422,
        details: { expectedLength: expectedBytes, actualLength: file.length },
      },
    )
  }
  validateCompletedTransfer(transfer, 'import', file.length, file.sha256)
}

function withImportTransferRecovery(
  error: unknown,
  transferId: string,
  volumeId: string | undefined,
  authoritativeState?: string,
  readbackError?: unknown,
): CliCommandError {
  const details = {
    transferId,
    ...(volumeId ? { volumeId } : {}),
    ...(authoritativeState ? { authoritativeState } : {}),
    uploadReplaySafe: false,
  }
  const cause = readbackError
    ? new AggregateError([error, readbackError], 'Import failed and authoritative readback failed.')
    : error
  if (error instanceof CliCommandError) {
    return new CliCommandError(error.code, error.message, {
      status: error.status,
      exitCode: error.exitCode,
      retryable: error.retryable,
      details: { ...error.details, ...details },
      cause,
    })
  }
  return new CliCommandError(
    'volume_transfer.upload_outcome_unknown',
    'The one-shot import upload was not replayed; inspect or retry the recorded transfer.',
    { status: 503, retryable: true, details, cause },
  )
}

export async function executeVolumeExport(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  const destination = resolve(requiredString(invocation.params.destination, 'destination'))
  const volumeId = optionalString(invocation.params.volumeId)
  const explicitTransferId = optionalString(invocation.params.transferId)
  if (volumeId && explicitTransferId) {
    throw new CliCommandError(
      'invalid_arguments',
      'Set exactly one of volumeId or transferId for an export.',
      {
        status: 400,
        exitCode: 2,
        details: { fields: ['volumeId', 'transferId'], code: 'mutually_exclusive' },
      },
    )
  }
  if (!volumeId && !explicitTransferId) {
    throw new CliCommandError(
      'invalid_arguments',
      'Set volumeId to create an export or transferId to download a prepared export.',
      {
        status: 400,
        exitCode: 2,
        details: { fields: ['volumeId', 'transferId'], code: 'required_one_of' },
      },
    )
  }
  const downloadAbortController = new AbortController()
  const unsubscribeInterrupt = subscribeVolumeTransferInterrupt(ports, () => downloadAbortController.abort('interrupt'))
  const partial = `${destination}.part`
  const manifestPath = `${destination}.manifest.json`
  const manifestPartial = `${manifestPath}.part`
  let prepared: PreparedExportFiles | undefined
  let archiveDownloaded = false
  let verifiedArchive = false
  let manifestWritten = false
  let commitStarted = false
  try {
    const transferId = explicitTransferId ?? await createExportTransfer(invocation, ports, projectId)
    const ready = await waitForTransferReady(
      invocation,
      ports,
      projectId,
      transferId,
      'export',
      downloadAbortController.signal,
    )
    const format = requiredTransferFormat(ready.format)
    const blockExport = format === 'raw_zst'
    const overwrite = invocation.params.overwrite === true
    prepared = await prepareExportDestinations(
      destination,
      partial,
      manifestPath,
      manifestPartial,
      blockExport,
      overwrite,
    )

    const maxBytes = positiveInteger(invocation.params.maxBytes, DEFAULT_MAX_DOWNLOAD_BYTES)
    const ticket = await authorizeDownload(invocation, ports, projectId, transferId)
    const downloaded = await downloadExportContent(
      invocation,
      ports,
      projectId,
      transferId,
      ticket,
      prepared.archive,
      maxBytes,
      Number(ready.expectedBytes) || 0,
      downloadAbortController.signal,
    )
    prepared.archive.expectedContent = downloaded
    archiveDownloaded = true
    const completed = await getVolumeTransfer(invocation, ports, projectId, transferId)
    validateCompletedTransfer(completed, 'export', downloaded.length, downloaded.sha256)
    if (requiredTransferFormat(completed.format) !== format) {
      throw new CliCommandError(
        'volume_transfer.response_invalid',
        'The export format changed while the transfer was running.',
        { status: 502, details: { expected: format, actual: completed.format } },
      )
    }
    verifiedArchive = true

    let manifest: VolumeExportManifest | undefined
    if (blockExport) {
      const manifestTicket = await authorizeDownload(invocation, ports, projectId, transferId)
      manifest = await requestExportManifest(
        invocation,
        ports,
        projectId,
        transferId,
        completed,
        manifestTicket,
        downloadAbortController.signal,
      )
      const preparedManifest = requiredPreparedManifest(prepared)
      preparedManifest.expectedContent = await writePrivateJson(preparedManifest, manifest)
      manifestWritten = true
    }
    await verifyPreparedExportFiles(prepared, true)
    await closePreparedExportFiles(prepared)
    commitStarted = true
    await commitExportFiles(prepared, overwrite)

    return {
      schemaVersion: 'cli.luna.devops/volume-export/v1',
      data: {
        transfer: completed,
        file: {
          path: destination,
          filename: basename(destination),
          length: downloaded.length,
          sha256: downloaded.sha256,
          ...(manifest
            ? { manifest: { path: manifestPath, ...manifest } }
            : {}),
        },
      },
      meta: { transport: 'download', projectId },
    }
  }
  catch (error) {
    let protectionError: unknown
    if (archiveDownloaded && prepared) {
      try {
        await verifyPreparedExportFiles({
          archive: prepared.archive,
          ...(manifestWritten && prepared.manifest ? { manifest: prepared.manifest } : {}),
          transactionDirectory: prepared.transactionDirectory,
        }, false)
      }
      catch (candidate) {
        protectionError = candidate
      }
    }
    await closePreparedExportFiles(prepared).catch(() => undefined)
    if (commitStarted)
      throw error
    if (archiveDownloaded && prepared) {
      let cleanupError: unknown
      if (prepared.manifest && !manifestWritten) {
        try {
          await cleanupPreparedExportFile(prepared.manifest)
        }
        catch (candidate) {
          cleanupError = candidate
        }
      }
      const recoveryFiles = [
        prepared.archive,
        ...(manifestWritten && prepared.manifest ? [prepared.manifest] : []),
      ]
      const recovery = await inspectExportRecovery(recoveryFiles)
      throw withExportRecoveryDetails(
        error,
        mergeExportRecoveryDetails(recovery, protectionError, cleanupError),
        verifiedArchive,
      )
    }
    try {
      await cleanupPreparedExportFiles(prepared)
    }
    catch (cleanupError) {
      throw withPreservedExportConflicts(error, cleanupError)
    }
    throw error
  }
  finally {
    unsubscribeInterrupt()
  }
}

export async function executeVolumeAdopt(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  requiredIdempotencyKey(invocation)
  const result = await executeApiOperation(invocation, ports, {
    operationId: 'createProjectVolume',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/volumes',
    params: {
      projectId,
      body: {
        displayName: requiredString(invocation.params.displayName, 'displayName'),
        clusterId: requiredString(invocation.params.clusterId, 'clusterId'),
        ...(optionalString(invocation.params.capacity)
          ? { capacity: optionalString(invocation.params.capacity) }
          : {}),
        ...(optionalString(invocation.params.storageClassName)
          ? { storageClassName: optionalString(invocation.params.storageClassName) }
          : {}),
        ...(optionalString(invocation.params.accessMode)
          ? { accessMode: optionalString(invocation.params.accessMode) }
          : {}),
        ...(optionalString(invocation.params.volumeMode)
          ? { volumeMode: optionalString(invocation.params.volumeMode) }
          : {}),
        source: {
          type: 'existingClaim',
          claimName: requiredString(invocation.params.claimName, 'claimName'),
          ownershipMode: requiredString(invocation.params.ownershipMode, 'ownershipMode'),
        },
      },
    },
  })
  return {
    schemaVersion: 'cli.luna.devops/volume-adopt/v1',
    data: result,
    meta: { transport: 'http', projectId },
  }
}

export async function executeVolumeUpdate(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  const volumeId = requiredString(invocation.params.volumeId, 'volumeId')
  const revision = requiredPositiveInteger(invocation.params.revision, 'revision')
  const body = {
    ...(optionalString(invocation.params.displayName)
      ? { displayName: optionalString(invocation.params.displayName) }
      : {}),
    ...(optionalString(invocation.params.capacity)
      ? { capacity: optionalString(invocation.params.capacity) }
      : {}),
  }
  if (Object.keys(body).length === 0) {
    throw new CliCommandError(
      'invalid_arguments',
      'Set displayName or capacity when updating a volume.',
      { status: 400, exitCode: 2 },
    )
  }
  const result = await executeApiOperation(invocation, ports, {
    operationId: 'updateProjectVolume',
    method: 'PATCH',
    path: '/api/v1/projects/{projectId}/volumes/{volumeId}',
    params: { 'projectId': projectId, 'volumeId': volumeId, 'If-Match': revision, 'body': body },
  })
  return volumeMutationResult(result, projectId)
}

export async function executeVolumeDelete(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  const result = await executeApiOperation(invocation, ports, {
    operationId: 'deleteProjectVolume',
    method: 'DELETE',
    path: '/api/v1/projects/{projectId}/volumes/{volumeId}',
    params: {
      'projectId': projectId,
      'volumeId': requiredString(invocation.params.volumeId, 'volumeId'),
      'If-Match': requiredPositiveInteger(invocation.params.revision, 'revision'),
      'dataAction': requiredString(invocation.params.dataAction, 'dataAction'),
    },
  })
  return volumeMutationResult(result, projectId)
}

export async function executeVolumeRetry(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  const volumeId = requiredString(invocation.params.volumeId, 'volumeId')
  const current = asRecord(await executeApiOperation(invocation, ports, {
    operationId: 'getProjectVolume',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/volumes/{volumeId}',
    params: { projectId, volumeId },
  }))
  const mfaPurpose = volumeRetryMfaPurpose(current)
  const result = await executeApiOperation(invocation, ports, {
    operationId: 'retryProjectVolumeOperation',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/volumes/{volumeId}/retry',
    ...(mfaPurpose ? { mfaPurpose } : {}),
    params: {
      'projectId': projectId,
      'volumeId': volumeId,
      'If-Match': requiredPositiveInteger(invocation.params.revision, 'revision'),
    },
  })
  return volumeMutationResult(result, projectId)
}

function volumeRetryMfaPurpose(
  volume: Readonly<Record<string, unknown>>,
): 'volume_adopt' | 'volume_delete' | undefined {
  const pendingOperation = optionalString(volume.pendingOperation)
  if (pendingOperation === 'delete')
    return 'volume_delete'
  if (pendingOperation === 'expand')
    return undefined
  if (pendingOperation === 'provision') {
    return volume.sourceKind === 'existing_claim' && volume.ownershipMode === 'managed'
      ? 'volume_adopt'
      : undefined
  }
  throw new CliCommandError(
    'volume.state_conflict',
    'The failed volume operation must be retried through its matching workflow.',
    { status: 409, details: { pendingOperation: pendingOperation ?? '' } },
  )
}

export async function executeVolumeTransferRetry(
  invocation: CommandInvocation,
  ports: RuntimePorts,
): Promise<CommandResult> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  const transferId = requiredString(invocation.params.transferId, 'transferId')
  const current = asRecord(await executeApiOperation(invocation, ports, {
    operationId: 'getVolumeTransfer',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/volume-transfers/{transferId}',
    params: { projectId, transferId },
  }))
  const direction = requiredString(current.direction, 'direction')
  if (direction !== 'import' && direction !== 'export') {
    throw new CliCommandError(
      'volume_transfer.response_invalid',
      'The transfer direction is invalid.',
      { status: 502, details: { field: 'direction' } },
    )
  }
  requiredIdempotencyKey(invocation)
  const result = await executeApiOperation(invocation, ports, {
    operationId: 'retryVolumeTransfer',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/volume-transfers/{transferId}/retry',
    mfaPurpose: direction === 'import' ? 'volume_import' : 'volume_export',
    params: { projectId, transferId },
  })
  return {
    schemaVersion: 'cli.luna.devops/volume-transfer-retry/v1',
    data: result,
    meta: { transport: 'http', projectId },
  }
}

async function createImportTransfer(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  file: { readonly path: string, readonly length: number, readonly sha256: string },
): Promise<Readonly<Record<string, unknown>>> {
  const projectId = requiredString(invocation.params.projectId, 'projectId')
  const format = optionalString(invocation.params.format) ?? inferFormat(file.path)
  const volumeMode = optionalString(invocation.params.volumeMode)
    ?? (format === 'raw_zst' ? 'Block' : 'Filesystem')
  if (
    (format === 'raw_zst' && volumeMode !== 'Block')
    || (format === 'tar_gz' && volumeMode !== 'Filesystem')
  ) {
    throw new CliCommandError(
      'invalid_arguments',
      'raw_zst requires volumeMode=Block and tar_gz requires volumeMode=Filesystem.',
      {
        status: 400,
        exitCode: 2,
        details: { fields: ['format', 'volumeMode'], code: 'incompatible' },
      },
    )
  }
  return asRecord(await executeApiOperation(invocation, ports, {
    operationId: 'createVolumeImport',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/volume-imports',
    params: {
      projectId,
      body: {
        displayName: requiredString(invocation.params.displayName, 'displayName'),
        clusterId: requiredString(invocation.params.clusterId, 'clusterId'),
        capacity: requiredString(invocation.params.capacity, 'capacity'),
        storageClassName: requiredString(invocation.params.storageClassName, 'storageClassName'),
        accessMode: optionalString(invocation.params.accessMode) ?? 'ReadWriteOnce',
        volumeMode,
        format,
        filename: basename(file.path),
        contentLength: file.length,
      },
    },
  }))
}

async function createExportTransfer(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
): Promise<string> {
  requiredIdempotencyKey(invocation)
  const result = asRecord(await executeApiOperation(invocation, ports, {
    operationId: 'createVolumeExport',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/volumes/{volumeId}/exports',
    params: {
      projectId,
      volumeId: requiredString(invocation.params.volumeId, 'volumeId'),
      body: {
        format: optionalString(invocation.params.format) ?? 'tar_gz',
        consistency: optionalString(invocation.params.consistency) ?? 'auto',
      },
    },
  }))
  return transferRecord(result).id
}

async function waitForTransferReady(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
  transferId: string,
  direction: 'import' | 'export',
  signal: AbortSignal,
): Promise<Readonly<Record<string, unknown>>> {
  const pollInterval = positiveInteger(invocation.params.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS)
  const waitTimeout = positiveInteger(invocation.params.waitTimeoutMs, DEFAULT_WAIT_TIMEOUT_MS)
  const deadline = Date.now() + waitTimeout
  for (;;) {
    throwIfVolumeTransferAborted(signal)
    const transfer = await getVolumeTransfer(invocation, ports, projectId, transferId)
    if (requiredString(transfer.direction, 'direction') !== direction) {
      throw new CliCommandError(
        'volume_transfer.response_invalid',
        'The transfer direction does not match the requested operation.',
        { status: 502, details: { direction: transfer.direction, expected: direction } },
      )
    }
    const state = requiredString(transfer.state, 'state')
    if (state === 'ready')
      return transfer
    if (['failed', 'cancelled', 'expired'].includes(state)) {
      throw new CliCommandError(
        optionalString(transfer.lastErrorCode) ?? `volume_transfer.${state}`,
        `The volume transfer reached terminal state "${state}".`,
        { status: state === 'expired' ? 410 : 409, details: { transferId, state } },
      )
    }
    if (state !== 'created' && state !== 'preparing') {
      throw new CliCommandError(
        'volume_transfer.state_conflict',
        `The volume transfer cannot open a new direct stream from state "${state}".`,
        { status: 409, details: { transferId, state } },
      )
    }
    if (Date.now() >= deadline) {
      throw new CliCommandError(
        'volume_transfer.wait_timeout',
        'Timed out waiting for the volume transfer to become ready.',
        { status: 504, retryable: true, details: { transferId, waitTimeoutMs: waitTimeout } },
      )
    }
    if (direction === 'export') {
      writeProgress(
        ports,
        invocation,
        'export',
        Number(transfer.transferredBytes) || 0,
        Number(transfer.expectedBytes) || 0,
      )
    }
    await abortableVolumeTransferDelay(pollInterval, signal)
  }
}

async function getVolumeTransfer(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
  transferId: string,
): Promise<Readonly<Record<string, unknown>>> {
  return asRecord(await executeApiOperation(invocation, ports, {
    operationId: 'getVolumeTransfer',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/volume-transfers/{transferId}',
    params: { projectId, transferId },
  }))
}

async function uploadImportContent(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
  transferId: string,
  handle: FileHandle,
  file: { readonly path: string, readonly length: number, readonly sha256: string },
  signal: AbortSignal,
): Promise<Readonly<Record<string, unknown>>> {
  const source = Readable.from(readFileHandleChunks(handle, file.length, file.path))
  let uploaded = 0
  const uploadHash = createHash('sha256')
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      uploaded += chunk.length
      if (uploaded > file.length) {
        callback(new CliCommandError(
          'volume_transfer.local_file_changed',
          'The local archive grew while it was being uploaded.',
          { status: 409, details: { path: file.path } },
        ))
        return
      }
      uploadHash.update(chunk)
      writeProgress(ports, invocation, 'upload', uploaded, file.length)
      callback(null, chunk)
    },
  })
  const body = Readable.toWeb(source.pipe(meter)) as unknown as BodyInit
  const request = protocolInvocation(invocation, {
    operationId: 'uploadVolumeImportContent',
    method: 'PUT',
    path: '/api/v1/projects/{projectId}/volume-imports/{transferId}/content',
    params: { projectId, transferId },
  })
  try {
    const { response } = await openProtocolRequest(request, ports, {
      accept: 'application/json',
      body,
      contentLength: file.length,
      duplex: true,
      headers: { 'Content-Type': 'application/octet-stream' },
      signal,
      streaming: true,
    })
    const result = await responseJsonRecord(response, 'volume import')
    if (uploaded !== file.length) {
      throw new CliCommandError(
        'volume_transfer.local_file_changed',
        'The local archive changed while it was being uploaded.',
        { status: 409, details: { path: file.path, expected: file.length, actual: uploaded } },
      )
    }
    const uploadedSha256 = uploadHash.digest('hex')
    if (uploadedSha256 !== file.sha256) {
      throw new CliCommandError(
        'volume_transfer.local_file_changed',
        'The protected local staging archive changed while it was being uploaded.',
        {
          status: 409,
          details: { path: file.path, expected: file.sha256, actual: uploadedSha256 },
        },
      )
    }
    return result
  }
  finally {
    source.destroy()
    meter.destroy()
  }
}

async function* readFileHandleChunks(
  handle: FileHandle,
  length: number,
  path: string,
): AsyncGenerator<Buffer> {
  const buffer = Buffer.allocUnsafe(Math.min(HASH_BUFFER_SIZE, length))
  let position = 0
  while (position < length) {
    const requested = Math.min(buffer.length, length - position)
    const { bytesRead } = await handle.read(buffer, 0, requested, position)
    if (bytesRead !== requested) {
      throw new CliCommandError(
        'volume_transfer.local_file_changed',
        'The protected local staging archive changed while it was being uploaded.',
        { status: 409, details: { path } },
      )
    }
    position += bytesRead
    yield Buffer.from(buffer.subarray(0, bytesRead))
  }
}

async function authorizeDownload(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
  transferId: string,
): Promise<string> {
  const authorization = asRecord(await executeApiOperation(invocation, ports, {
    operationId: 'authorizeVolumeTransferDownload',
    method: 'POST',
    path: '/api/v1/projects/{projectId}/volume-transfers/{transferId}/download-authorizations',
    params: { projectId, transferId },
  }))
  return requiredString(authorization.ticket, 'ticket')
}

async function downloadExportContent(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
  transferId: string,
  ticket: string,
  output: PreparedExportFile,
  maxBytes: number,
  expectedBytes: number,
  signal: AbortSignal,
): Promise<{ readonly length: number, readonly sha256: string }> {
  const request = protocolInvocation(invocation, {
    operationId: 'downloadVolumeTransferContent',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/volume-transfers/{transferId}/content',
    params: { projectId, transferId, ticket },
  })
  const { response } = await openProtocolRequest(request, ports, {
    accept: 'application/octet-stream, application/gzip, application/zstd',
    signal,
    streaming: true,
  })
  if (!response.body) {
    throw new CliCommandError(
      'download_body_missing',
      'The export download response has no body.',
      { status: 502 },
    )
  }
  let streamed = 0
  const hash = createHash('sha256')
  const meter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      const transferred = streamed + chunk.length
      if (transferred > maxBytes) {
        callback(new CliCommandError(
          'download_too_large',
          'The export response exceeded the configured byte limit.',
          { status: 413, details: { transferred, maxBytes } },
        ))
        return
      }
      streamed = transferred
      hash.update(chunk)
      writeProgress(ports, invocation, 'download', streamed, expectedBytes)
      callback(null, chunk)
    },
  })
  try {
    await pipeline(
      Readable.fromWeb(response.body as import('node:stream/web').ReadableStream),
      meter,
      createWriteStream('', { fd: output.handle.fd, autoClose: false }),
    )
    await output.handle.sync()
  }
  catch (error) {
    await response.body.cancel().catch(() => undefined)
    if (error instanceof CliCommandError)
      throw error
    if (signal.aborted) {
      throw new CliCommandError('request_cancelled', 'The volume transfer was cancelled.', {
        status: 499,
        exitCode: 130,
        cause: error,
      })
    }
    throw new CliCommandError(
      'download_failed',
      'The export download did not complete.',
      { status: 502, retryable: false, cause: error },
    )
  }
  if (streamed < 1) {
    throw new CliCommandError(
      'volume_transfer.response_invalid',
      'The export download was empty.',
      { status: 502 },
    )
  }
  return { length: streamed, sha256: hash.digest('hex') }
}

async function requestExportManifest(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  projectId: string,
  transferId: string,
  transfer: Readonly<Record<string, unknown>>,
  ticket: string,
  signal: AbortSignal,
): Promise<VolumeExportManifest> {
  const request = protocolInvocation(invocation, {
    operationId: 'downloadVolumeTransferManifest',
    method: 'GET',
    path: '/api/v1/projects/{projectId}/volume-transfers/{transferId}/manifest',
    params: { projectId, transferId, ticket },
  })
  const { response } = await openProtocolRequest(request, ports, {
    accept: 'application/json',
    signal,
    streaming: true,
  })
  const text = await readBoundedManifest(response, signal)
  let value: unknown
  try {
    value = JSON.parse(text)
  }
  catch (error) {
    throw new CliCommandError(
      'volume_transfer.manifest_invalid',
      'The export manifest is not valid JSON.',
      { status: 502, cause: error },
    )
  }
  return parseExportManifest(value, transfer)
}

async function readBoundedManifest(response: Response, signal: AbortSignal): Promise<string> {
  if (!response.body) {
    throw new CliCommandError(
      'download_body_missing',
      'The export manifest response has no body.',
      { status: 502 },
    )
  }
  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let length = 0
  try {
    for (;;) {
      const result = await reader.read()
      if (result.done)
        break
      const chunk = Buffer.from(result.value)
      length += chunk.length
      if (length > MAX_MANIFEST_BYTES) {
        await reader.cancel('manifest_too_large').catch(() => undefined)
        throw new CliCommandError(
          'download_too_large',
          'The export manifest exceeded the allowed size.',
          { status: 413, details: { maxBytes: MAX_MANIFEST_BYTES } },
        )
      }
      chunks.push(chunk)
    }
  }
  catch (error) {
    if (error instanceof CliCommandError)
      throw error
    if (signal.aborted) {
      throw new CliCommandError('request_cancelled', 'The volume transfer was cancelled.', {
        status: 499,
        exitCode: 130,
        cause: error,
      })
    }
    throw new CliCommandError(
      'download_failed',
      'The export manifest download did not complete.',
      { status: 502, retryable: true, cause: error },
    )
  }
  finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks, length).toString('utf8')
}

async function prepareExportDestinations(
  destination: string,
  partial: string,
  manifestPath: string,
  manifestPartial: string,
  blockExport: boolean,
  overwrite: boolean,
): Promise<PreparedExportFiles> {
  await mkdir(dirname(destination), { recursive: true })
  const destinations = [destination, ...(blockExport ? [manifestPath] : [])]
  const reservedPartials = [partial, ...(blockExport ? [manifestPartial] : [])]
  for (const path of reservedPartials)
    await assertExportPathAbsent(path)
  const initialDestinations = new Map<string, ExportDestinationState>()
  for (const path of destinations) {
    const initial = await readExportDestinationState(path)
    if (!overwrite && initial.kind !== 'absent') {
      throw new CliCommandError(
        'download_destination_exists',
        'The export destination or its temporary file already exists.',
        { status: 409, details: { destination: path } },
      )
    }
    initialDestinations.set(path, initial)
  }
  const transactionDirectory = join(
    dirname(destination),
    `.luna-volume-export-transaction-${randomUUID()}`,
  )
  try {
    await mkdir(transactionDirectory, { mode: 0o700 })
  }
  catch (error) {
    throw new CliCommandError(
      'download_destination_unwritable',
      'The export transaction directory could not be created safely.',
      { status: 422, details: { destination: transactionDirectory }, cause: error },
    )
  }
  let archive: PreparedExportFile | undefined
  try {
    archive = await createPreparedExportFile(
      destination,
      partial,
      join(transactionDirectory, 'archive.part'),
      requiredInitialDestination(initialDestinations, destination),
    )
    await verifyExportHardLinkSupport(archive)
    const manifest = blockExport
      ? await createPreparedExportFile(
          manifestPath,
          manifestPartial,
          join(transactionDirectory, 'manifest.part'),
          requiredInitialDestination(initialDestinations, manifestPath),
        )
      : undefined
    return { archive, ...(manifest ? { manifest } : {}), transactionDirectory }
  }
  catch (error) {
    if (archive) {
      await archive.handle.close().catch(() => undefined)
      await cleanupPreparedExportFile(archive).catch(() => undefined)
    }
    await rmdir(transactionDirectory).catch(() => undefined)
    throw error
  }
}

async function createPreparedExportFile(
  destination: string,
  partial: string,
  recoveryPath: string,
  initialDestination: ExportDestinationState,
): Promise<PreparedExportFile> {
  let handle: FileHandle | undefined
  let identity: ExportFileIdentity | undefined
  try {
    const flags = fsConstants.O_CREAT
      | fsConstants.O_EXCL
      | fsConstants.O_RDWR
      | (fsConstants.O_NOFOLLOW ?? 0)
    handle = await open(recoveryPath, flags, 0o600)
    const stats = await handle.stat({ bigint: true })
    if (!stats.isFile()) {
      throw new CliCommandError(
        'download_destination_unsafe',
        'The protected export recovery path is not a regular file.',
        { status: 409, details: { destination: recoveryPath } },
      )
    }
    identity = reliableExportFileIdentity(stats, recoveryPath)
    const prepared: PreparedExportFile = {
      destination,
      partial,
      recoveryPath,
      handle,
      identity,
      initialDestination,
    }
    await assertExportFileIdentity(recoveryPath, identity)
    return prepared
  }
  catch (error) {
    await handle?.close().catch(() => undefined)
    if (identity)
      await removeKnownExportFile(recoveryPath, identity, true).catch(() => undefined)
    if (isNodeError(error, 'EEXIST')) {
      throw new CliCommandError(
        'download_destination_exists',
        'The export destination or its temporary file already exists.',
        { status: 409, details: { destination: recoveryPath }, cause: error },
      )
    }
    if (error instanceof CliCommandError)
      throw error
    throw new CliCommandError(
      'download_destination_unwritable',
      'The export temporary file could not be created safely.',
      { status: 422, details: { destination: recoveryPath }, cause: error },
    )
  }
}

async function assertExportPathAbsent(path: string): Promise<void> {
  try {
    await lstat(path)
  }
  catch (error) {
    if (isNodeError(error, 'ENOENT'))
      return
    throw new CliCommandError(
      'download_destination_unsafe',
      'The export path could not be inspected safely.',
      { status: 409, details: { unverifiedPaths: [path] }, cause: error },
    )
  }
  throw new CliCommandError(
    'download_destination_exists',
    'A reserved export partial path already exists and was preserved.',
    { status: 409, details: { destination: path, preservedUnknownPaths: [path] } },
  )
}

async function verifyExportHardLinkSupport(file: PreparedExportFile): Promise<void> {
  const probe = join(dirname(file.recoveryPath), `.link-probe-${randomUUID()}`)
  try {
    await link(file.recoveryPath, probe)
    await assertExportFileIdentity(probe, file.identity)
    await removeKnownExportFile(probe, file.identity)
  }
  catch (error) {
    await removeKnownExportFile(probe, file.identity, true).catch(() => undefined)
    throw new CliCommandError(
      'download_destination_unsafe',
      'The destination filesystem does not support safe atomic export commits.',
      {
        status: 422,
        details: mergeConflictDetails(error),
        cause: error,
      },
    )
  }
}

function requiredInitialDestination(
  states: ReadonlyMap<string, ExportDestinationState>,
  path: string,
): ExportDestinationState {
  const state = states.get(path)
  if (state)
    return state
  throw new CliCommandError(
    'download_destination_unsafe',
    'The export destination was not inspected before staging.',
    { status: 500, details: { destination: path } },
  )
}

async function readExportDestinationState(path: string): Promise<ExportDestinationState> {
  try {
    const stats = await lstat(path, { bigint: true })
    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new CliCommandError(
        'download_destination_unsafe',
        'Overwrite can replace only an existing regular file.',
        { status: 409, details: { destination: path, preservedUnknownPaths: [path] } },
      )
    }
    const identity = reliableExportFileIdentity(stats, path)
    return {
      kind: 'file',
      snapshot: {
        ...identity,
        size: stats.size,
        mtimeNs: stats.mtimeNs,
        ctimeNs: stats.ctimeNs,
      },
    }
  }
  catch (error) {
    if (isNodeError(error, 'ENOENT'))
      return { kind: 'absent' }
    throw error
  }
}

function requiredPreparedManifest(files: PreparedExportFiles): PreparedExportFile {
  if (files.manifest)
    return files.manifest
  throw new CliCommandError(
    'volume_transfer.manifest_invalid',
    'The block-volume manifest destination was not prepared.',
    { status: 500 },
  )
}

async function closePreparedExportFiles(files: PreparedExportFiles | undefined): Promise<void> {
  if (!files)
    return
  await Promise.all([
    files.archive.handle.close().catch(() => undefined),
    files.manifest?.handle.close().catch(() => undefined),
  ])
}

async function verifyPreparedExportFiles(
  files: PreparedExportFiles,
  requireReservedPartialsAbsent: boolean,
): Promise<void> {
  const pending = [files.archive, ...(files.manifest ? [files.manifest] : [])]
  for (const file of pending) {
    const stats = await file.handle.stat({ bigint: true })
    const identity = reliableExportFileIdentity(stats, file.recoveryPath)
    if (!sameExportFileIdentity(identity, file.identity)) {
      throw new CliCommandError(
        'download_file_identity_changed',
        'The open export staging file changed identity before it could be closed.',
        { status: 409, details: { unverifiedPaths: [file.recoveryPath] } },
      )
    }
    await assertExportFileIdentity(file.recoveryPath, file.identity)
    const expected = file.expectedContent
    if (!expected) {
      throw new CliCommandError(
        'download_file_identity_changed',
        'The export staging file has no verified content fingerprint.',
        { status: 409, details: { unverifiedPaths: [file.recoveryPath] } },
      )
    }
    const actual = await fingerprintFileHandle(file.handle, file.identity, file.recoveryPath)
    if (actual.length !== expected.length || actual.sha256 !== expected.sha256) {
      throw new CliCommandError(
        'download_file_identity_changed',
        'The protected export staging content changed before commit.',
        {
          status: 409,
          details: { unverifiedPaths: [file.recoveryPath] },
        },
      )
    }
    if (requireReservedPartialsAbsent)
      await assertExportPathAbsent(file.partial)
  }
}

async function cleanupPreparedExportFile(file: PreparedExportFile): Promise<void> {
  const failures: unknown[] = []
  try {
    await removeKnownExportFile(file.recoveryPath, file.identity, true)
  }
  catch (error) {
    failures.push(error)
  }
  if (failures.length > 0) {
    throw new CliCommandError(
      'download_cleanup_failed',
      'One or more export staging paths could not be cleaned safely.',
      {
        status: 500,
        details: mergeConflictDetails(...failures),
        cause: new AggregateError(failures, 'Export staging cleanup failed.'),
      },
    )
  }
}

async function cleanupPreparedExportFiles(files: PreparedExportFiles | undefined): Promise<void> {
  if (!files)
    return
  const failures: unknown[] = []
  for (const file of [files.archive, ...(files.manifest ? [files.manifest] : [])]) {
    try {
      await cleanupPreparedExportFile(file)
    }
    catch (error) {
      failures.push(error)
    }
  }
  try {
    await rmdir(files.transactionDirectory)
  }
  catch (error) {
    failures.push(new CliCommandError(
      'download_cleanup_failed',
      'The export transaction directory could not be removed.',
      { status: 500, details: { cleanupPaths: [files.transactionDirectory] }, cause: error },
    ))
  }
  if (failures.length > 0) {
    throw new CliCommandError(
      'download_cleanup_failed',
      'The incomplete export could not be cleaned safely.',
      {
        status: 500,
        details: mergeConflictDetails(...failures),
        cause: new AggregateError(failures, 'Incomplete export cleanup failed.'),
      },
    )
  }
}

async function commitExportFiles(files: PreparedExportFiles, overwrite: boolean): Promise<void> {
  const pending = [files.archive, ...(files.manifest ? [files.manifest] : [])]
  if (!overwrite) {
    const committed: PreparedExportFile[] = []
    try {
      for (const file of pending) {
        await assertExportFileIdentity(file.recoveryPath, file.identity)
        await assertExportFileContent(file)
        await assertExportPathAbsent(file.partial)
        try {
          await link(file.recoveryPath, file.destination)
        }
        catch (error) {
          if (isNodeError(error, 'EEXIST')) {
            throw new CliCommandError(
              'download_destination_exists',
              'The export destination appeared before the verified files could be committed.',
              {
                status: 409,
                details: { preservedUnknownPaths: [file.destination] },
                cause: error,
              },
            )
          }
          throw error
        }
        committed.push(file)
        await assertExportFileIdentity(file.destination, file.identity)
        await assertExportFileContent(file, file.destination)
        await assertExportFileIdentity(file.recoveryPath, file.identity)
        await assertExportPathAbsent(file.partial)
      }
    }
    catch (error) {
      const rollbackErrors: unknown[] = []
      for (const file of [...committed].reverse()) {
        try {
          await rollbackCommittedExportFile(file)
        }
        catch (rollbackError) {
          rollbackErrors.push(rollbackError)
        }
      }
      const recovery = await inspectExportRecovery(pending, true)
      const details = mergeExportRecoveryDetails(recovery, error, ...rollbackErrors)
      const cause = rollbackErrors.length > 0
        ? new AggregateError([error, ...rollbackErrors], 'Export commit and rollback failed.')
        : error
      if (error instanceof CliCommandError && error.code === 'download_destination_exists') {
        throw new CliCommandError(
          'download_destination_exists',
          'The export destination appeared before the verified files could be committed.',
          { status: 409, details, cause },
        )
      }
      throw new CliCommandError(
        'download_commit_failed',
        'The verified export files could not be committed.',
        { status: 500, details, cause },
      )
    }
    await cleanupCommittedExportArtifacts(files, [])
    return
  }

  const backups: ExportBackup[] = []
  const committed: PreparedExportFile[] = []
  try {
    for (const file of pending) {
      await assertExportPathAbsent(file.partial)
      await assertExportFileContent(file)
    }
    for (const [index, file] of pending.entries()) {
      await assertInitialDestinationState(file)
      if (file.initialDestination.kind === 'absent')
        continue
      const initialSnapshot = file.initialDestination.snapshot
      const backup = join(files.transactionDirectory, `backup-${index}-${basename(file.destination)}`)
      try {
        await rename(file.destination, backup)
        const snapshot = await readRequiredExportFileSnapshot(backup)
        backups.push({ destination: file.destination, path: backup, snapshot, initialSnapshot })
        if (!sameExportFilePayloadSnapshot(snapshot, initialSnapshot)) {
          throw new CliCommandError(
            'download_destination_changed',
            'The overwrite target changed while it was being moved into protected backup.',
            { status: 409, details: { preservedUnknownPaths: [backup] } },
          )
        }
      }
      catch (error) {
        if (isNodeError(error, 'ENOENT')) {
          throw new CliCommandError(
            'download_destination_changed',
            'The overwrite target disappeared before it could be backed up.',
            { status: 409, details: { missingOriginalPaths: [file.destination] }, cause: error },
          )
        }
        throw error
      }
    }
    for (const file of pending) {
      await assertExportFileIdentity(file.recoveryPath, file.identity)
      await assertExportFileContent(file)
      await assertExportPathAbsent(file.partial)
      try {
        await link(file.recoveryPath, file.destination)
      }
      catch (error) {
        if (isNodeError(error, 'EEXIST')) {
          throw new CliCommandError(
            'download_destination_changed',
            'A file appeared at the overwrite destination before commit.',
            {
              status: 409,
              details: { preservedUnknownPaths: [file.destination] },
              cause: error,
            },
          )
        }
        throw error
      }
      committed.push(file)
      await assertExportFileIdentity(file.destination, file.identity)
      await assertExportFileContent(file, file.destination)
      await assertExportFileIdentity(file.recoveryPath, file.identity)
      await assertExportPathAbsent(file.partial)
    }
  }
  catch (error) {
    const rollbackErrors: unknown[] = []
    for (const file of [...committed].reverse()) {
      try {
        await rollbackCommittedExportFile(file)
      }
      catch (rollbackError) {
        rollbackErrors.push(rollbackError)
      }
    }
    for (const backup of [...backups].reverse()) {
      try {
        await assertExportFileSnapshot(backup.path, backup.snapshot)
        await link(backup.path, backup.destination)
        await assertExportFileIdentity(backup.destination, backup.snapshot)
        const linkedSnapshot = await readRequiredExportFileSnapshot(backup.path)
        if (
          !sameExportFileIdentity(linkedSnapshot, backup.snapshot)
          || linkedSnapshot.size !== backup.snapshot.size
          || linkedSnapshot.mtimeNs !== backup.snapshot.mtimeNs
        ) {
          throw new CliCommandError(
            'download_destination_changed',
            'The preserved overwrite target changed while it was being restored.',
            { status: 409, details: { preservedUnknownPaths: [backup.path, backup.destination] } },
          )
        }
        await removeKnownExportFile(backup.path, linkedSnapshot)
      }
      catch (rollbackError) {
        rollbackErrors.push(rollbackError)
      }
    }
    const recovery = await inspectExportRecovery(pending, true)
    const originals = await inspectPreservedOriginals(pending, backups)
    const details = mergeExportRecoveryDetails(
      recovery,
      originals,
      error,
      ...rollbackErrors,
    )
    throw new CliCommandError(
      'download_commit_failed',
      'The verified export files could not be committed.',
      {
        status: 500,
        details,
        cause: rollbackErrors.length > 0
          ? new AggregateError([error, ...rollbackErrors], 'Export commit and rollback failed.')
          : error,
      },
    )
  }
  await cleanupCommittedExportArtifacts(files, backups)
}

async function cleanupCommittedExportArtifacts(
  files: PreparedExportFiles,
  backups: readonly ExportBackup[] = [],
): Promise<void> {
  const pending = [files.archive, ...(files.manifest ? [files.manifest] : [])]
  const validationFailures: unknown[] = []
  for (const file of pending) {
    try {
      await assertExportPathAbsent(file.partial)
    }
    catch (error) {
      validationFailures.push(error)
    }
  }
  for (const backup of backups) {
    try {
      await assertExportFileSnapshot(backup.path, backup.snapshot)
    }
    catch (error) {
      validationFailures.push(error)
    }
  }
  for (const file of pending) {
    try {
      await assertExportFileIdentity(file.destination, file.identity)
      await assertExportFileContent(file, file.destination)
      await assertExportFileContent(file)
    }
    catch (error) {
      validationFailures.push(error)
    }
  }
  if (validationFailures.length > 0)
    await throwCommittedExportCleanupFailure(files, backups, validationFailures)

  const cleanupFailures: unknown[] = []
  for (const backup of backups) {
    try {
      await removeKnownExportFile(backup.path, backup.snapshot)
    }
    catch (error) {
      cleanupFailures.push(error)
    }
  }
  for (const file of pending) {
    try {
      await removeKnownExportFile(file.recoveryPath, file.identity)
    }
    catch (error) {
      cleanupFailures.push(error)
    }
  }
  if (cleanupFailures.length > 0)
    await throwCommittedExportCleanupFailure(files, backups, cleanupFailures)

  try {
    await rmdir(files.transactionDirectory)
  }
  catch (error) {
    if (!isNodeError(error, 'ENOENT')) {
      await throwCommittedExportCleanupFailure(files, backups, [new CliCommandError(
        'download_cleanup_failed',
        'The export transaction directory could not be removed.',
        {
          status: 500,
          details: { cleanupPaths: [files.transactionDirectory] },
          cause: error,
        },
      )])
    }
  }
}

async function throwCommittedExportCleanupFailure(
  files: PreparedExportFiles,
  backups: readonly ExportBackup[],
  failures: readonly unknown[],
): Promise<never> {
  const pending = [files.archive, ...(files.manifest ? [files.manifest] : [])]
  const recovery = await inspectExportRecovery(pending, true)
  const originals = await inspectPreservedOriginals(pending, backups)
  throw new CliCommandError(
    'download_cleanup_failed',
    'The export was committed, but one or more protected recovery artifacts could not be removed.',
    {
      status: 500,
      details: mergeExportRecoveryDetails(recovery, originals, ...failures),
      cause: new AggregateError(failures, 'Export artifact cleanup failed.'),
    },
  )
}

async function assertInitialDestinationState(file: PreparedExportFile): Promise<void> {
  const current = await readExportDestinationState(file.destination)
  const expected = file.initialDestination
  if (expected.kind === 'absent' && current.kind === 'absent')
    return
  if (
    expected.kind === 'file'
    && current.kind === 'file'
    && sameExportFileSnapshot(current.snapshot, expected.snapshot)
  ) {
    return
  }
  throw new CliCommandError(
    'download_destination_changed',
    'The overwrite destination changed after the export started.',
    {
      status: 409,
      details: current.kind === 'absent'
        ? { missingOriginalPaths: [file.destination] }
        : { preservedUnknownPaths: [file.destination] },
    },
  )
}

async function rollbackCommittedExportFile(file: PreparedExportFile): Promise<void> {
  await assertExportFileIdentity(file.recoveryPath, file.identity)
  await removeKnownExportFile(file.destination, file.identity)
}

type ExportPathInspection = 'verified' | 'unknown' | 'missing' | 'unverified'

async function inspectExportPath(
  path: string,
  expected: ExportFileIdentity,
): Promise<ExportPathInspection> {
  try {
    const stats = await lstat(path, { bigint: true })
    if (stats.isSymbolicLink() || !stats.isFile())
      return 'unknown'
    if (stats.ino === 0n)
      return 'unverified'
    return stats.dev === expected.device && stats.ino === expected.inode
      ? 'verified'
      : 'unknown'
  }
  catch (error) {
    return isNodeError(error, 'ENOENT') ? 'missing' : 'unverified'
  }
}

async function inspectExportRecovery(
  files: readonly PreparedExportFile[],
  includeDestinations = false,
): Promise<Readonly<Record<string, unknown>>> {
  const recoveryPaths: string[] = []
  const preservedUnknownPaths: string[] = []
  const unverifiedPaths: string[] = []
  for (const file of files) {
    const candidates = [
      file.recoveryPath,
      ...(includeDestinations ? [file.destination] : []),
    ]
    for (const path of candidates) {
      const observed = await inspectVerifiedExportContent(file, path)
      if (observed === 'verified')
        recoveryPaths.push(path)
      else if (observed === 'unknown')
        preservedUnknownPaths.push(path)
      else if (observed === 'unverified')
        unverifiedPaths.push(path)
    }
    const partial = await inspectUnknownExportPath(file.partial)
    if (partial === 'unknown')
      preservedUnknownPaths.push(file.partial)
    else if (partial === 'unverified')
      unverifiedPaths.push(file.partial)
  }
  return {
    recoveryPaths: uniqueStrings(recoveryPaths),
    ...(preservedUnknownPaths.length > 0
      ? { preservedUnknownPaths: uniqueStrings(preservedUnknownPaths) }
      : {}),
    ...(unverifiedPaths.length > 0 ? { unverifiedPaths: uniqueStrings(unverifiedPaths) } : {}),
  }
}

async function inspectVerifiedExportContent(
  file: PreparedExportFile,
  path: string,
): Promise<ExportPathInspection> {
  const observed = await inspectExportPath(path, file.identity)
  if (observed !== 'verified')
    return observed
  try {
    await assertExportFileContent(file, path)
    return 'verified'
  }
  catch {
    const after = await inspectExportPath(path, file.identity)
    return after === 'unknown' || after === 'missing' ? after : 'unverified'
  }
}

async function inspectUnknownExportPath(path: string): Promise<ExportPathInspection> {
  try {
    await lstat(path)
    return 'unknown'
  }
  catch (error) {
    return isNodeError(error, 'ENOENT') ? 'missing' : 'unverified'
  }
}

async function inspectPreservedOriginals(
  files: readonly PreparedExportFile[],
  backups: readonly ExportBackup[],
): Promise<Readonly<Record<string, unknown>>> {
  const preservedOriginalPaths: string[] = []
  const preservedUnknownPaths: string[] = []
  const unverifiedPaths: string[] = []
  for (const backup of backups) {
    const observed = await inspectExportDestinationSnapshot(backup.path, backup.snapshot)
    if (observed === 'verified') {
      if (sameExportFilePayloadSnapshot(backup.snapshot, backup.initialSnapshot))
        preservedOriginalPaths.push(backup.path)
      else
        preservedUnknownPaths.push(backup.path)
    }
    else if (observed === 'unknown') {
      preservedUnknownPaths.push(backup.path)
    }
    else if (observed === 'unverified') {
      unverifiedPaths.push(backup.path)
    }
  }
  for (const file of files) {
    if (file.initialDestination.kind !== 'file')
      continue
    const current = await inspectExportOriginalPayload(
      file.destination,
      file.initialDestination.snapshot,
    )
    if (current === 'verified')
      preservedOriginalPaths.push(file.destination)
    else if (current === 'unknown')
      preservedUnknownPaths.push(file.destination)
    else if (current === 'unverified')
      unverifiedPaths.push(file.destination)
  }
  return {
    ...(preservedOriginalPaths.length > 0
      ? { preservedOriginalPaths: uniqueStrings(preservedOriginalPaths) }
      : {}),
    ...(preservedUnknownPaths.length > 0
      ? { preservedUnknownPaths: uniqueStrings(preservedUnknownPaths) }
      : {}),
    ...(unverifiedPaths.length > 0 ? { unverifiedPaths: uniqueStrings(unverifiedPaths) } : {}),
  }
}

async function inspectExportDestinationSnapshot(
  path: string,
  expected: ExportFileSnapshot,
): Promise<ExportPathInspection> {
  try {
    const current = await readExportDestinationState(path)
    if (current.kind === 'absent')
      return 'missing'
    return sameExportFileSnapshot(current.snapshot, expected) ? 'verified' : 'unknown'
  }
  catch (error) {
    return isNodeError(error, 'ENOENT') ? 'missing' : 'unverified'
  }
}

async function inspectExportOriginalPayload(
  path: string,
  expected: ExportFileSnapshot,
): Promise<ExportPathInspection> {
  try {
    const current = await readExportDestinationState(path)
    if (current.kind === 'absent')
      return 'missing'
    return sameExportFilePayloadSnapshot(current.snapshot, expected) ? 'verified' : 'unknown'
  }
  catch (error) {
    return isNodeError(error, 'ENOENT') ? 'missing' : 'unverified'
  }
}

async function readRequiredExportFileSnapshot(path: string): Promise<ExportFileSnapshot> {
  const current = await readExportDestinationState(path)
  if (current.kind === 'file')
    return current.snapshot
  throw new CliCommandError(
    'download_file_identity_changed',
    'A protected export file disappeared during the file transaction.',
    { status: 409, details: { missingPaths: [path] } },
  )
}

async function assertExportFileSnapshot(
  path: string,
  expected: ExportFileSnapshot,
): Promise<void> {
  const observed = await inspectExportDestinationSnapshot(path, expected)
  if (observed === 'verified')
    return
  throw new CliCommandError(
    'download_file_identity_changed',
    'A protected export file changed during the file transaction.',
    {
      status: 409,
      details: observed === 'unknown'
        ? { preservedUnknownPaths: [path] }
        : observed === 'missing'
          ? { missingPaths: [path] }
          : { unverifiedPaths: [path] },
    },
  )
}

function reliableExportFileIdentity(
  stats: { readonly dev: bigint, readonly ino: bigint },
  path: string,
): ExportFileIdentity {
  if (stats.ino === 0n) {
    throw new CliCommandError(
      'download_file_identity_unavailable',
      'The filesystem did not provide a reliable export file identity.',
      { status: 409, details: { unverifiedPaths: [path] } },
    )
  }
  return { device: stats.dev, inode: stats.ino }
}

function sameExportFileIdentity(
  left: ExportFileIdentity,
  right: ExportFileIdentity,
): boolean {
  return left.device === right.device && left.inode === right.inode
}

function sameExportFileSnapshot(
  left: ExportFileSnapshot,
  right: ExportFileSnapshot,
): boolean {
  return sameExportFileIdentity(left, right)
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}

function sameExportFilePayloadSnapshot(
  left: ExportFileSnapshot,
  right: ExportFileSnapshot,
): boolean {
  return sameExportFileIdentity(left, right)
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
}

async function fingerprintFileHandle(
  handle: FileHandle,
  expectedIdentity: ExportFileIdentity,
  path: string,
  errorCode = 'download_file_identity_changed',
): Promise<ContentFingerprint> {
  const before = await handle.stat({ bigint: true })
  if (!before.isFile() || before.size < 0n || before.size > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new CliCommandError(
      errorCode,
      'The protected local file is not a supported regular file.',
      { status: 409, details: { unverifiedPaths: [path] } },
    )
  }
  const beforeIdentity = { device: before.dev, inode: before.ino }
  if (before.ino === 0n || !sameExportFileIdentity(beforeIdentity, expectedIdentity)) {
    throw new CliCommandError(
      errorCode,
      'The protected local file identity changed unexpectedly.',
      { status: 409, details: { unverifiedPaths: [path] } },
    )
  }
  const beforeSnapshot: ExportFileSnapshot = {
    ...beforeIdentity,
    size: before.size,
    mtimeNs: before.mtimeNs,
    ctimeNs: before.ctimeNs,
  }
  const length = Number(before.size)
  const hash = createHash('sha256')
  const buffer = Buffer.allocUnsafe(Math.max(1, Math.min(HASH_BUFFER_SIZE, length)))
  let position = 0
  while (position < length) {
    const requested = Math.min(buffer.length, length - position)
    const { bytesRead } = await handle.read(buffer, 0, requested, position)
    if (bytesRead !== requested) {
      throw new CliCommandError(
        errorCode,
        'The protected local file changed while it was being verified.',
        { status: 409, details: { unverifiedPaths: [path] } },
      )
    }
    hash.update(buffer.subarray(0, bytesRead))
    position += bytesRead
  }
  const after = await handle.stat({ bigint: true })
  const afterSnapshot: ExportFileSnapshot = {
    device: after.dev,
    inode: after.ino,
    size: after.size,
    mtimeNs: after.mtimeNs,
    ctimeNs: after.ctimeNs,
  }
  if (!after.isFile() || after.ino === 0n || !sameExportFileSnapshot(beforeSnapshot, afterSnapshot)) {
    throw new CliCommandError(
      errorCode,
      'The protected local file changed while it was being verified.',
      { status: 409, details: { unverifiedPaths: [path] } },
    )
  }
  return { length, sha256: hash.digest('hex') }
}

async function assertExportFileContent(
  file: PreparedExportFile,
  path = file.recoveryPath,
): Promise<void> {
  const expected = file.expectedContent
  if (!expected) {
    throw new CliCommandError(
      'download_file_identity_changed',
      'The export file has no verified content fingerprint.',
      { status: 409, details: { unverifiedPaths: [path] } },
    )
  }
  let handle: FileHandle | undefined
  try {
    handle = await open(path, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0))
    const actual = await fingerprintFileHandle(handle, file.identity, path)
    if (actual.length !== expected.length || actual.sha256 !== expected.sha256) {
      throw new CliCommandError(
        'download_file_identity_changed',
        'The protected export content changed before commit.',
        { status: 409, details: { unverifiedPaths: [path] } },
      )
    }
  }
  catch (error) {
    if (error instanceof CliCommandError)
      throw error
    throw new CliCommandError(
      'download_file_identity_changed',
      'The protected export file could not be verified before commit.',
      { status: 409, details: { unverifiedPaths: [path] }, cause: error },
    )
  }
  finally {
    await handle?.close().catch(() => undefined)
  }
}

function mergeExportRecoveryDetails(
  recovery: Readonly<Record<string, unknown>>,
  ...sources: readonly unknown[]
): Readonly<Record<string, unknown>> {
  const recoveryPaths = stringArray(recovery.recoveryPaths)
  const conflicts = mergeConflictDetails(recovery, ...sources)
  return {
    ...(recoveryPaths[0] ? { recoveryPath: recoveryPaths[0] } : {}),
    recoveryPaths,
    ...(recoveryPaths.length === 0 ? { recoveryUnavailable: true } : {}),
    ...conflicts,
  }
}

function mergeConflictDetails(...sources: readonly unknown[]): Readonly<Record<string, unknown>> {
  const keys = [
    'preservedUnknownPaths',
    'unverifiedPaths',
    'missingPaths',
    'missingOriginalPaths',
    'cleanupPaths',
    'verifiedPaths',
    'preservedOriginalPaths',
  ] as const
  const values = new Map<string, string[]>()
  const seen = new Set<unknown>()
  const visit = (source: unknown): void => {
    if (!source || (typeof source !== 'object' && typeof source !== 'function') || seen.has(source))
      return
    seen.add(source)
    const record = source as Readonly<Record<string, unknown>>
    const details = source instanceof CliCommandError ? source.details : record
    for (const key of keys) {
      const entries = stringArray(details[key])
      if (entries.length > 0)
        values.set(key, [...(values.get(key) ?? []), ...entries])
    }
    if (source instanceof AggregateError) {
      for (const error of source.errors)
        visit(error)
    }
    if (source instanceof Error)
      visit(source.cause)
  }
  for (const source of sources)
    visit(source)
  return Object.fromEntries(
    [...values.entries()].map(([key, entries]) => [key, uniqueStrings(entries)]),
  )
}

function withoutRecoveryClaims(
  details: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const sanitized = { ...details }
  delete sanitized.recoveryPath
  delete sanitized.recoveryPaths
  return sanitized
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : []
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)]
}

async function assertExportFileIdentity(
  path: string,
  expected: ExportFileIdentity,
): Promise<void> {
  const observed = await inspectExportPath(path, expected)
  if (observed === 'verified')
    return
  throw new CliCommandError(
    'download_file_identity_changed',
    'An export file path changed during the protected file transaction.',
    {
      status: 409,
      details: observed === 'unknown'
        ? { preservedUnknownPaths: [path] }
        : observed === 'missing'
          ? { missingPaths: [path] }
          : { unverifiedPaths: [path] },
    },
  )
}

async function removeKnownExportFile(
  path: string,
  expected: ExportFileIdentity | ExportFileSnapshot,
  allowMissing = false,
): Promise<void> {
  const before = await inspectExpectedExportPath(path, expected)
  if (before === 'missing' && allowMissing)
    return
  if (before !== 'verified') {
    throw new CliCommandError(
      'download_file_identity_changed',
      'An export file path changed before cleanup and was preserved.',
      {
        status: 409,
        details: before === 'unknown'
          ? { preservedUnknownPaths: [path] }
          : before === 'missing'
            ? { missingPaths: [path] }
            : { unverifiedPaths: [path] },
      },
    )
  }
  const quarantine = `${path}.luna-quarantine-${randomUUID()}`
  try {
    await rename(path, quarantine)
  }
  catch (error) {
    if (allowMissing && isNodeError(error, 'ENOENT'))
      return
    throw error
  }
  try {
    if (isExportFileSnapshot(expected)) {
      const quarantinedSnapshot = await readRequiredExportFileSnapshot(quarantine)
      if (!sameExportFilePayloadSnapshot(quarantinedSnapshot, expected)) {
        throw new CliCommandError(
          'download_file_identity_changed',
          'A protected export file changed while it was moved into quarantine.',
          { status: 409, details: { preservedUnknownPaths: [quarantine] } },
        )
      }
      await assertExportFileSnapshot(quarantine, quarantinedSnapshot)
    }
    else {
      await assertExportFileIdentity(quarantine, expected)
    }
  }
  catch (error) {
    await link(quarantine, path).catch(() => undefined)
    throw new CliCommandError(
      'download_file_identity_changed',
      'An export file path changed before cleanup and the unknown file was preserved.',
      { status: 409, details: { preservedUnknownPaths: [path, quarantine] }, cause: error },
    )
  }
  try {
    await rm(quarantine)
  }
  catch (error) {
    throw new CliCommandError(
      'download_cleanup_failed',
      'A verified export file could not be removed from quarantine.',
      { status: 500, details: { verifiedPaths: [quarantine] }, cause: error },
    )
  }
}

function isExportFileSnapshot(
  value: ExportFileIdentity | ExportFileSnapshot,
): value is ExportFileSnapshot {
  return 'size' in value
}

async function inspectExpectedExportPath(
  path: string,
  expected: ExportFileIdentity | ExportFileSnapshot,
): Promise<ExportPathInspection> {
  return isExportFileSnapshot(expected)
    ? await inspectExportDestinationSnapshot(path, expected)
    : await inspectExportPath(path, expected)
}

function withExportRecoveryDetails(
  error: unknown,
  recovery: Readonly<Record<string, unknown>>,
  archiveVerified: boolean,
): CliCommandError {
  if (error instanceof CliCommandError) {
    return new CliCommandError(error.code, error.message, {
      status: error.status,
      exitCode: error.exitCode,
      retryable: error.retryable,
      details: {
        ...withoutRecoveryClaims(error.details),
        ...recovery,
        archiveVerified,
      },
      cause: error,
    })
  }
  return new CliCommandError(
    'download_failed',
    'The export failed after the archive had been downloaded.',
    { status: 500, details: { ...recovery, archiveVerified }, cause: error },
  )
}

function withPreservedExportConflicts(error: unknown, cleanupError: unknown): CliCommandError {
  const conflicts = mergeConflictDetails(error, cleanupError)
  if (error instanceof CliCommandError) {
    return new CliCommandError(error.code, error.message, {
      status: error.status,
      exitCode: error.exitCode,
      retryable: error.retryable,
      details: { ...withoutRecoveryClaims(error.details), ...conflicts },
      cause: new AggregateError([error, cleanupError], 'Export and cleanup failed.'),
    })
  }
  return new CliCommandError(
    'download_failed',
    'The export failed and its staging paths could not all be cleaned safely.',
    {
      status: 500,
      details: conflicts,
      cause: new AggregateError([error, cleanupError], 'Export and cleanup failed.'),
    },
  )
}

async function responseJsonRecord(
  response: Response,
  subject: string,
): Promise<Readonly<Record<string, unknown>>> {
  try {
    return asRecord(await response.json())
  }
  catch (error) {
    throw new CliCommandError(
      'volume_transfer.response_invalid',
      `The ${subject} response is not valid JSON.`,
      { status: 502, cause: error },
    )
  }
}

function validateCompletedTransfer(
  transfer: Readonly<Record<string, unknown>>,
  direction: 'import' | 'export',
  localLength: number,
  localChecksum: string,
): void {
  const state = requiredString(transfer.state, 'state')
  const actualDirection = requiredString(transfer.direction, 'direction')
  const transferredBytes = requiredNonNegativeInteger(transfer.transferredBytes, 'transferredBytes')
  const checksum = requiredChecksum(transfer.sha256)
  if (
    state !== 'succeeded'
    || actualDirection !== direction
    || transferredBytes !== localLength
    || checksum !== localChecksum
  ) {
    throw new CliCommandError(
      'volume_transfer.checksum_mismatch',
      'The completed transfer does not match the local archive.',
      {
        status: 422,
        details: {
          state,
          direction: actualDirection,
          expectedDirection: direction,
          expectedLength: transferredBytes,
          actualLength: localLength,
          expectedChecksum: checksum,
          actualChecksum: localChecksum,
        },
      },
    )
  }
}

function requiredTransferFormat(value: unknown): 'tar_gz' | 'raw_zst' {
  const format = requiredString(value, 'format')
  if (format === 'tar_gz' || format === 'raw_zst')
    return format
  throw new CliCommandError(
    'volume_transfer.response_invalid',
    'The transfer format is invalid.',
    { status: 502, details: { field: 'format' } },
  )
}

async function executeApiOperation(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  operation: {
    readonly operationId: string
    readonly method: string
    readonly path: string
    readonly mfaPurpose?: string
    readonly params: Readonly<Record<string, unknown>>
  },
): Promise<unknown> {
  const metadata = operationMetadata(invocation.metadata, operation)
  const result = await ports.api.execute({
    operationId: operation.operationId,
    params: operation.params,
    globals: invocation.globals,
    metadata,
  })
  return unwrapCommandResult(result)
}

function protocolInvocation(
  invocation: CommandInvocation,
  operation: {
    readonly operationId: string
    readonly method: string
    readonly path: string
    readonly mfaPurpose?: string
    readonly params: Readonly<Record<string, unknown>>
  },
): CommandInvocation {
  return {
    ...invocation,
    metadata: operationMetadata(invocation.metadata, operation),
    params: operation.params,
  }
}

function operationMetadata(
  source: NormalizedCommandMetadata,
  operation: {
    readonly operationId: string
    readonly method: string
    readonly path: string
    readonly mfaPurpose?: string
    readonly params: Readonly<Record<string, unknown>>
  },
): NormalizedCommandMetadata {
  const parameters: CommandParameter[] = [pathParameter('projectId')]
  if (operation.path.includes('{volumeId}'))
    parameters.push(pathParameter('volumeId'))
  if (operation.path.includes('{transferId}'))
    parameters.push(pathParameter('transferId'))
  if (Object.hasOwn(operation.params, 'If-Match')) {
    parameters.push({
      name: 'If-Match',
      location: 'header',
      required: true,
      schema: { type: 'integer', minimum: 1 },
    })
  }
  if (Object.hasOwn(operation.params, 'dataAction')) {
    parameters.push({
      name: 'dataAction',
      location: 'query',
      required: true,
      schema: { type: 'string', enum: ['delete', 'detach'] },
    })
  }
  if (Object.hasOwn(operation.params, 'ticket'))
    parameters.push(queryParameter('ticket'))
  if (['POST', 'PATCH'].includes(operation.method))
    parameters.push({ name: 'body', location: 'body' })
  return {
    ...source,
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    ...(operation.mfaPurpose ? { mfaPurpose: operation.mfaPurpose } : {}),
    transport: 'http',
    streaming: false,
    parameters,
  }
}

async function openRegularFile(path: string): Promise<FileHandle> {
  try {
    const stats = await lstat(path)
    if (stats.isSymbolicLink() || !stats.isFile())
      throw new Error('not a regular file')
    return await open(path, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0))
  }
  catch (error) {
    throw new CliCommandError(
      'volume_transfer.file_unreadable',
      'The import archive is not a readable regular file.',
      { status: 422, details: { path }, cause: error },
    )
  }
}

async function prepareVolumeImportFile(
  sourceHandle: FileHandle,
  path: string,
): Promise<PreparedImportFile> {
  let stagingDirectory: string | undefined
  let stagedPath: string | undefined
  let stagingHandle: FileHandle | undefined
  let readHandle: FileHandle | undefined
  let identity: ExportFileIdentity | undefined
  try {
    const sourceBefore = await readImportSourceSnapshot(sourceHandle, path)
    const length = Number(sourceBefore.size)
    stagingDirectory = await mkdtemp(join(tmpdir(), 'luna-volume-import-'))
    stagedPath = join(stagingDirectory, 'archive')
    const flags = fsConstants.O_CREAT
      | fsConstants.O_EXCL
      | fsConstants.O_RDWR
      | (fsConstants.O_NOFOLLOW ?? 0)
    stagingHandle = await open(stagedPath, flags, 0o600)
    const stagingStats = await stagingHandle.stat({ bigint: true })
    if (!stagingStats.isFile())
      throw new Error('staging path is not a regular file')
    identity = reliableImportFileIdentity(stagingStats, stagedPath)

    const hash = createHash('sha256')
    const buffer = Buffer.allocUnsafe(Math.min(HASH_BUFFER_SIZE, length))
    let position = 0
    while (position < length) {
      const requested = Math.min(buffer.length, length - position)
      const { bytesRead } = await sourceHandle.read(buffer, 0, requested, position)
      if (bytesRead !== requested)
        throw importSourceChanged(path)
      const chunk = buffer.subarray(0, bytesRead)
      hash.update(chunk)
      let chunkOffset = 0
      while (chunkOffset < chunk.length) {
        const { bytesWritten } = await stagingHandle.write(
          chunk,
          chunkOffset,
          chunk.length - chunkOffset,
          position + chunkOffset,
        )
        if (bytesWritten < 1)
          throw new Error('staging write made no progress')
        chunkOffset += bytesWritten
      }
      position += bytesRead
    }
    const sourceAfter = await readImportSourceSnapshot(sourceHandle, path)
    if (!sameExportFileSnapshot(sourceBefore, sourceAfter))
      throw importSourceChanged(path)

    const sha256 = hash.digest('hex')
    await stagingHandle.sync()
    await stagingHandle.chmod(0o400)
    const staged = await fingerprintFileHandle(stagingHandle, identity, stagedPath)
    if (staged.length !== length || staged.sha256 !== sha256) {
      throw new CliCommandError(
        'volume_transfer.local_file_changed',
        'The protected local staging archive does not match the inspected source.',
        {
          status: 409,
          details: {
            path,
            expectedLength: length,
            actualLength: staged.length,
            expectedSha256: sha256,
            actualSha256: staged.sha256,
          },
        },
      )
    }

    readHandle = await open(stagedPath, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0))
    const readStats = await readHandle.stat({ bigint: true })
    const readIdentity = reliableImportFileIdentity(readStats, stagedPath)
    if (!sameExportFileIdentity(readIdentity, identity))
      throw importStagingChanged(stagedPath)
    await stagingHandle.close()
    stagingHandle = undefined

    // Detach the read-only staging inode from the filesystem before any remote
    // resource is created. If the platform cannot do this safely, fail closed.
    await rm(stagedPath)
    await assertImportStagingDetached(stagedPath)
    const detachedStats = await readHandle.stat({ bigint: true })
    const detachedIdentity = reliableImportFileIdentity(detachedStats, stagedPath)
    if (!sameExportFileIdentity(detachedIdentity, identity))
      throw importStagingChanged(stagedPath)
    const detached = await fingerprintFileHandle(
      readHandle,
      identity,
      stagedPath,
      'volume_transfer.local_file_changed',
    )
    if (detached.length !== length || detached.sha256 !== sha256)
      throw importStagingChanged(stagedPath)

    return {
      path,
      stagedPath,
      stagingDirectory,
      handle: readHandle,
      identity,
      length,
      sha256,
    }
  }
  catch (error) {
    const cleanupErrors: unknown[] = []
    await readHandle?.close().catch(cleanupError => cleanupErrors.push(cleanupError))
    await stagingHandle?.close().catch(cleanupError => cleanupErrors.push(cleanupError))
    if (stagedPath && identity) {
      try {
        await removeKnownExportFile(stagedPath, identity, true)
      }
      catch (cleanupError) {
        cleanupErrors.push(cleanupError)
      }
    }
    if (stagingDirectory) {
      try {
        await rmdir(stagingDirectory)
      }
      catch (cleanupError) {
        if (!isNodeError(cleanupError, 'ENOENT'))
          cleanupErrors.push(cleanupError)
      }
    }
    if (cleanupErrors.length === 0)
      throw normalizeImportStagingError(error, path)
    throw new CliCommandError(
      'volume_transfer.local_staging_failed',
      'The import archive could not be staged or cleaned safely.',
      {
        status: 500,
        details: mergeConflictDetails(error, ...cleanupErrors),
        cause: new AggregateError([error, ...cleanupErrors], 'Import staging failed.'),
      },
    )
  }
}

async function readImportSourceSnapshot(
  handle: FileHandle,
  path: string,
): Promise<ExportFileSnapshot> {
  const stats = await handle.stat({ bigint: true })
  if (
    !stats.isFile()
    || stats.size <= 0n
    || stats.size > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new CliCommandError(
      'volume_transfer.file_invalid',
      'The import archive must be a non-empty regular file with a supported size.',
      { status: 422, details: { path } },
    )
  }
  const identity = reliableImportFileIdentity(stats, path)
  return {
    ...identity,
    size: stats.size,
    mtimeNs: stats.mtimeNs,
    ctimeNs: stats.ctimeNs,
  }
}

function reliableImportFileIdentity(
  stats: { readonly dev: bigint, readonly ino: bigint },
  path: string,
): ExportFileIdentity {
  if (stats.ino === 0n) {
    throw new CliCommandError(
      'volume_transfer.file_identity_unavailable',
      'The filesystem did not provide a reliable local file identity.',
      { status: 409, details: { unverifiedPaths: [path] } },
    )
  }
  return { device: stats.dev, inode: stats.ino }
}

function importSourceChanged(path: string): CliCommandError {
  return new CliCommandError(
    'volume_transfer.local_file_changed',
    'The local archive changed while its protected staging copy was being created.',
    { status: 409, details: { path } },
  )
}

function importStagingChanged(path: string): CliCommandError {
  return new CliCommandError(
    'volume_transfer.local_file_changed',
    'The protected local staging archive changed unexpectedly.',
    { status: 409, details: { unverifiedPaths: [path] } },
  )
}

async function assertImportStagingDetached(path: string): Promise<void> {
  try {
    await lstat(path)
  }
  catch (error) {
    if (isNodeError(error, 'ENOENT'))
      return
    throw error
  }
  throw importStagingChanged(path)
}

function normalizeImportStagingError(error: unknown, path: string): CliCommandError {
  if (error instanceof CliCommandError)
    return error
  return new CliCommandError(
    'volume_transfer.local_staging_failed',
    'The import archive could not be copied into protected local staging.',
    { status: 500, details: { path }, cause: error },
  )
}

async function cleanupVolumeImportFile(file: PreparedImportFile): Promise<void> {
  const failures: unknown[] = []
  try {
    const stats = await file.handle.stat({ bigint: true })
    const identity = reliableImportFileIdentity(stats, file.stagedPath)
    if (!sameExportFileIdentity(identity, file.identity))
      throw importStagingChanged(file.stagedPath)
  }
  catch (error) {
    failures.push(error)
  }
  try {
    await file.handle.close()
  }
  catch (error) {
    failures.push(error)
  }
  try {
    await assertImportStagingDetached(file.stagedPath)
  }
  catch (error) {
    failures.push(error)
  }
  try {
    await rmdir(file.stagingDirectory)
  }
  catch (error) {
    if (!isNodeError(error, 'ENOENT'))
      failures.push(error)
  }
  if (failures.length > 0) {
    throw new CliCommandError(
      'volume_transfer.local_cleanup_failed',
      'The protected local import staging could not be cleaned safely.',
      {
        status: 500,
        details: {
          cleanupPaths: [file.stagingDirectory],
          ...mergeConflictDetails(...failures),
        },
        cause: new AggregateError(failures, 'Import staging cleanup failed.'),
      },
    )
  }
}

function withImportCleanupFailure(
  operationError: unknown,
  cleanupError: unknown,
  file: PreparedImportFile,
): CliCommandError {
  const cleanupDetails = {
    cleanupPaths: [file.stagingDirectory],
    ...mergeConflictDetails(cleanupError),
  }
  if (operationError instanceof CliCommandError) {
    return new CliCommandError(operationError.code, operationError.message, {
      status: operationError.status,
      exitCode: operationError.exitCode,
      retryable: operationError.retryable,
      details: { ...operationError.details, ...cleanupDetails },
      cause: new AggregateError([operationError, cleanupError], 'Import and cleanup failed.'),
    })
  }
  return new CliCommandError(
    'volume_transfer.local_cleanup_failed',
    operationError
      ? 'The import failed and its protected local staging could not be cleaned safely.'
      : 'The import completed, but its protected local staging could not be cleaned safely.',
    {
      status: 500,
      details: cleanupDetails,
      cause: operationError
        ? new AggregateError([operationError, cleanupError], 'Import and cleanup failed.')
        : cleanupError,
    },
  )
}

function parseExportManifest(
  value: unknown,
  transfer: Readonly<Record<string, unknown>>,
): VolumeExportManifest {
  const manifest = asRecord(value)
  const exportedAt = requiredString(manifest.exportedAt, 'manifest.exportedAt')
  const logicalBytes = requiredNonNegativeInteger(
    manifest.logicalBytes,
    'manifest.logicalBytes',
  )
  const dataSHA256 = requiredChecksum(manifest.dataSHA256)
  const consistencyMode = requiredString(
    manifest.consistencyMode,
    'manifest.consistencyMode',
  )
  if (
    manifest.schemaVersion !== 1
    || manifest.volumeMode !== 'Block'
    || manifest.format !== 'raw_zst'
    || manifest.fileCount !== 0
    || !Number.isFinite(Date.parse(exportedAt))
    || !['snapshot', 'live', 'unmounted'].includes(consistencyMode)
  ) {
    throw new CliCommandError(
      'volume_transfer.manifest_invalid',
      'The export manifest does not match the raw block-volume schema.',
      { status: 502 },
    )
  }
  const expectedLogicalBytes = requiredNonNegativeInteger(
    transfer.logicalBytes,
    'transfer.logicalBytes',
  )
  const expectedDataSHA256 = requiredChecksum(transfer.dataSHA256)
  if (
    logicalBytes !== expectedLogicalBytes
    || dataSHA256 !== expectedDataSHA256
  ) {
    throw new CliCommandError(
      'volume_transfer.manifest_mismatch',
      'The export manifest does not match the completed transfer.',
      {
        status: 422,
        details: {
          expectedLogicalBytes,
          actualLogicalBytes: logicalBytes,
          expectedDataSHA256,
          actualDataSHA256: dataSHA256,
        },
      },
    )
  }
  return {
    schemaVersion: 1,
    volumeMode: 'Block',
    format: 'raw_zst',
    exportedAt,
    logicalBytes,
    fileCount: 0,
    dataSHA256,
    consistencyMode: consistencyMode as VolumeExportManifest['consistencyMode'],
  }
}

async function writePrivateJson(
  file: PreparedExportFile,
  value: unknown,
): Promise<ContentFingerprint> {
  const content = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
  try {
    await file.handle.truncate(0)
    await file.handle.writeFile(content)
    await file.handle.sync()
    await file.handle.chmod(0o600)
    return {
      length: content.length,
      sha256: createHash('sha256').update(content).digest('hex'),
    }
  }
  catch (error) {
    throw new CliCommandError(
      'volume_transfer.manifest_write_failed',
      'The export manifest could not be written safely.',
      { status: 500, details: { path: file.recoveryPath }, cause: error },
    )
  }
}

function transferRecord(value: Readonly<Record<string, unknown>>): {
  readonly id: string
  readonly record: Readonly<Record<string, unknown>>
} {
  const record = Object.keys(asRecord(value.transfer)).length > 0
    ? asRecord(value.transfer)
    : value
  return { id: requiredString(record.id, 'transfer.id'), record }
}

function writeProgress(
  ports: RuntimePorts,
  invocation: CommandInvocation,
  phase: 'upload' | 'export' | 'download',
  current: number,
  total: number,
): void {
  if (
    invocation.globals.agent
    || invocation.globals.output !== 'table'
    || invocation.globals.quiet
    || !ports.output.writeInfo
  ) {
    return
  }
  const percent = total > 0 ? Math.min(100, Math.floor((current / total) * 100)) : 0
  const filled = Math.round(percent / 5)
  const bar = `${'#'.repeat(filled)}${'-'.repeat(20 - filled)}`
  const label = ports.translate?.(
    `volume.progress.${phase}`,
    phase === 'upload' ? 'Uploading' : phase === 'download' ? 'Downloading' : 'Exporting',
    invocation.globals.lang,
  ) ?? phase
  void ports.output.writeInfo(`${label} [${bar}] ${percent}%`, invocation.globals)
}

function inferFormat(path: string): 'tar_gz' | 'raw_zst' {
  return path.toLowerCase().endsWith('.raw.zst')
    ? 'raw_zst'
    : 'tar_gz'
}

function unwrapCommandResult(value: unknown): unknown {
  const record = asRecord(value)
  return 'data' in record && ('schemaVersion' in record || 'meta' in record)
    ? record.data
    : value
}

function pathParameter(name: string): CommandParameter {
  return { name, location: 'path', required: true, schema: { type: 'string', minLength: 1 } }
}

function queryParameter(name: string): CommandParameter {
  return { name, location: 'query', required: true, schema: { type: 'string', minLength: 1 } }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim())
    return value.trim()
  throw new CliCommandError(
    'volume_transfer.response_invalid',
    `Required field "${field}" is missing or invalid.`,
    { status: 502, details: { field } },
  )
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function requiredNonNegativeInteger(value: unknown, field: string): number {
  const parsed = Number(value)
  if (Number.isSafeInteger(parsed) && parsed >= 0)
    return parsed
  throw new CliCommandError(
    'volume_transfer.response_invalid',
    `Required field "${field}" is missing or invalid.`,
    { status: 502, details: { field } },
  )
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : fallback
}

function requiredPositiveInteger(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
    return value
  throw new CliCommandError(
    'invalid_arguments',
    `Field "${field}" must be a positive integer.`,
    { status: 400, exitCode: 2, details: { field } },
  )
}

function requiredIdempotencyKey(invocation: CommandInvocation): string {
  const value = optionalString(invocation.globals.idempotencyKey)
  if (value && value.length >= 8 && value.length <= 160)
    return value
  throw new CliCommandError(
    'invalid_arguments',
    'Set idempotencyKey to 8–160 characters for this operation.',
    {
      status: 400,
      exitCode: 2,
      details: {
        field: 'idempotencyKey',
        code: value ? 'length' : 'required',
      },
    },
  )
}

function volumeMutationResult(result: unknown, projectId: string): CommandResult {
  return {
    schemaVersion: 'cli.luna.devops/volume-mutation/v1',
    data: result,
    meta: { transport: 'http', projectId },
  }
}

function requiredChecksum(value: unknown): string {
  const checksum = optionalString(value)?.toLowerCase()
  if (checksum && /^[a-f0-9]{64}$/u.test(checksum))
    return checksum
  throw new CliCommandError(
    'volume_transfer.response_invalid',
    'The export checksum is missing or invalid.',
    { status: 502, details: { field: 'sha256' } },
  )
}

function throwIfVolumeTransferAborted(signal: AbortSignal): void {
  if (!signal.aborted)
    return
  throw new CliCommandError('request_cancelled', 'The volume transfer was cancelled.', {
    status: 499,
    exitCode: 130,
    cause: signal.reason,
  })
}

function abortableVolumeTransferDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  try {
    throwIfVolumeTransferAborted(signal)
  }
  catch (error) {
    return Promise.reject(error)
  }
  return new Promise((resolveDelay, reject) => {
    let timeout: ReturnType<typeof setTimeout>
    const onAbort = () => {
      clearTimeout(timeout)
      reject(new CliCommandError('request_cancelled', 'The volume transfer was cancelled.', {
        status: 499,
        exitCode: 130,
        cause: signal.reason,
      }))
    }
    timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolveDelay()
    }, milliseconds)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function subscribeVolumeTransferInterrupt(ports: RuntimePorts, listener: () => void): () => void {
  if (ports.protocol?.onInterrupt)
    return ports.protocol.onInterrupt(listener)
  process.once('SIGINT', listener)
  process.once('SIGTERM', listener)
  return () => {
    process.off('SIGINT', listener)
    process.off('SIGTERM', listener)
  }
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : {}
}

function isNodeError(error: unknown, code: string): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as NodeJS.ErrnoException).code === code
}
