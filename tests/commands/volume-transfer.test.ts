import type {
  ApiExecutionRequest,
  CommandExecutionGlobals,
  CommandInvocation,
  RuntimePorts,
} from '../../src/commands/types.js'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { planOpenApiRequest } from '../../src/commands/api.js'
import { CliCommandError } from '../../src/commands/errors.js'
import { CommandRegistry } from '../../src/commands/registry.js'
import { emptyConfigDocument } from '../../src/config/schema.js'

const fileSystemFaults = vi.hoisted<{
  failImportDetach?: boolean
  failNextLink?: boolean
  linkDestination?: string
  replaceSourceAfterLink?: {
    readonly destination: string
    readonly content: string
  }
}>(() => ({}))

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  const rm = (async (...args: Parameters<typeof actual.rm>) => {
    const path = String(args[0])
    if (
      fileSystemFaults.failImportDetach
      && path.includes('luna-volume-import-')
      && path.endsWith('/archive')
    ) {
      fileSystemFaults.failImportDetach = false
      throw Object.assign(new Error('open files cannot be detached'), { code: 'EPERM' })
    }
    return await actual.rm(...args)
  }) as typeof actual.rm
  const link: typeof actual.link = async (existingPath, newPath) => {
    if (fileSystemFaults.failNextLink) {
      fileSystemFaults.failNextLink = false
      throw Object.assign(new Error('hard links are unsupported'), { code: 'ENOTSUP' })
    }
    if (String(newPath) === fileSystemFaults.linkDestination) {
      fileSystemFaults.linkDestination = undefined
      throw Object.assign(new Error('injected link failure'), { code: 'EIO' })
    }
    await actual.link(existingPath, newPath)
    if (String(newPath) === fileSystemFaults.replaceSourceAfterLink?.destination) {
      const replacement = fileSystemFaults.replaceSourceAfterLink
      fileSystemFaults.replaceSourceAfterLink = undefined
      await actual.rm(existingPath)
      await actual.writeFile(existingPath, replacement.content, { mode: 0o600 })
    }
  }
  return { ...actual, link, rm }
})

describe('project volume transfer protocol adapters', () => {
  const temporaryDirectories: string[] = []

  afterEach(async () => {
    fileSystemFaults.failImportDetach = false
    fileSystemFaults.failNextLink = false
    fileSystemFaults.linkDestination = undefined
    fileSystemFaults.replaceSourceAfterLink = undefined
    vi.restoreAllMocks()
    await Promise.all(temporaryDirectories.splice(0).map(path =>
      rm(path, { recursive: true, force: true })))
  })

  it('waits for an import to become ready and uploads the complete archive once', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    await writeFile(archive, 'abcdef', { mode: 0o600 })
    const initialInode = (await stat(archive, { bigint: true })).ino
    const apiRequests: string[] = []
    let importBody: Readonly<Record<string, unknown>> = {}
    let observations = 0
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      const bytes = Buffer.from(await new Response(init?.body).arrayBuffer())
      expect(String(input)).toBe('https://luna.example.test/api/v1/projects/project-a/volume-imports/vtx_import/content')
      expect(init?.method).toBe('PUT')
      expect(headers.get('content-type')).toBe('application/octet-stream')
      expect(headers.get('content-length')).toBe('6')
      expect(headers.has('tus-resumable')).toBe(false)
      expect(headers.has('upload-offset')).toBe(false)
      expect(headers.has('upload-checksum')).toBe(false)
      expect(bytes.toString()).toBe('abcdef')
      return Response.json({
        id: 'vtx_import',
        direction: 'import',
        state: 'succeeded',
        format: 'tar_gz',
        transferredBytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      })
    })
    const ports = createPorts(directory, async (request) => {
      apiRequests.push(request.operationId)
      if (request.operationId === 'createVolumeImport') {
        await writeFile(archive, 'ghijkl', { mode: 0o600 })
        importBody = request.params.body as Readonly<Record<string, unknown>>
        return {
          schemaVersion: 'test/v1',
          data: {
            volume: { id: 'pvol_test' },
            transfer: { id: 'vtx_import', direction: 'import', state: 'created' },
          },
        }
      }
      observations += 1
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_import',
          direction: 'import',
          state: observations === 1 ? 'preparing' : 'ready',
          format: 'tar_gz',
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:import', 'volume:read'])
    const command = new CommandRegistry().require('volume.import')

    const result = await command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
      pollIntervalMs: 1,
    }), ports)

    expect(apiRequests).toEqual(['createVolumeImport', 'getVolumeTransfer', 'getVolumeTransfer'])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect((await stat(archive, { bigint: true })).ino).toBe(initialInode)
    await expect(readFile(archive, 'utf8')).resolves.toBe('ghijkl')
    expect(importBody).toMatchObject({ filename: 'backup.tar.gz', contentLength: 6 })
    expect(importBody).not.toHaveProperty('sha256')
    expect(result).toMatchObject({
      schemaVersion: 'cli.luna.devops/volume-import/v1',
      data: {
        volume: { id: 'pvol_test' },
        transfer: { id: 'vtx_import', direction: 'import', state: 'succeeded' },
        file: { path: archive, length: 6 },
      },
    })
    expect(result).not.toHaveProperty('data.resumed')
  })

  it('fails before creating a remote import when an open staging file cannot be detached', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    await writeFile(archive, 'abcdef', { mode: 0o600 })
    const fetch = vi.fn()
    const execute = vi.fn()
    const ports = createPorts(
      directory,
      execute as RuntimePorts['api']['execute'],
      fetch as typeof globalThis.fetch,
      ['volume:import', 'volume:read'],
    )
    const command = new CommandRegistry().require('volume.import')
    fileSystemFaults.failImportDetach = true

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
    }), ports)).rejects.toMatchObject({ code: 'volume_transfer.local_staging_failed' })

    expect(execute).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('uploads a replayed ready import exactly once after an authoritative ready read', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    const bytes = Buffer.from('abcdef')
    await writeFile(archive, bytes, { mode: 0o600 })
    let readbacks = 0
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const uploaded = Buffer.from(await new Response(init?.body).arrayBuffer())
      return Response.json({
        id: 'vtx_ready',
        direction: 'import',
        state: 'succeeded',
        expectedBytes: uploaded.length,
        transferredBytes: uploaded.length,
        sha256: createHash('sha256').update(uploaded).digest('hex'),
      })
    })
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'createVolumeImport') {
        return {
          schemaVersion: 'test/v1',
          data: {
            volume: { id: 'pvol_ready' },
            transfer: { id: 'vtx_ready', direction: 'import', state: 'ready' },
          },
        }
      }
      readbacks += 1
      return {
        schemaVersion: 'test/v1',
        data: { id: 'vtx_ready', direction: 'import', state: 'ready', expectedBytes: bytes.length },
      }
    }, fetch as typeof globalThis.fetch, ['volume:import', 'volume:read'])
    const command = new CommandRegistry().require('volume.import')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
    }), ports)).resolves.toMatchObject({ schemaVersion: 'cli.luna.devops/volume-import/v1' })

    expect(readbacks).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('never replays a PUT for a replayed streaming import', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    await writeFile(archive, 'abcdef', { mode: 0o600 })
    const fetch = vi.fn()
    const ports = createPorts(directory, async (request) => {
      return {
        schemaVersion: 'test/v1',
        data: request.operationId === 'createVolumeImport'
          ? {
              volume: { id: 'pvol_streaming' },
              transfer: { id: 'vtx_streaming', direction: 'import', state: 'streaming' },
            }
          : { id: 'vtx_streaming', direction: 'import', state: 'streaming' },
      }
    }, fetch as typeof globalThis.fetch, ['volume:import', 'volume:read'])
    const command = new CommandRegistry().require('volume.import')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
    }), ports)).rejects.toMatchObject({
      code: 'volume_transfer.upload_replay_blocked',
      details: {
        transferId: 'vtx_streaming',
        volumeId: 'pvol_streaming',
        authoritativeState: 'streaming',
        uploadReplaySafe: false,
      },
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('converges a replayed succeeded import without issuing another PUT', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    const bytes = Buffer.from('abcdef')
    const checksum = createHash('sha256').update(bytes).digest('hex')
    await writeFile(archive, bytes, { mode: 0o600 })
    const fetch = vi.fn()
    const ports = createPorts(directory, async () => ({
      schemaVersion: 'test/v1',
      data: {
        volume: { id: 'pvol_succeeded' },
        transfer: {
          id: 'vtx_succeeded',
          projectVolumeId: 'pvol_succeeded',
          direction: 'import',
          state: 'succeeded',
          expectedBytes: bytes.length,
          transferredBytes: bytes.length,
          sha256: checksum,
        },
      },
    }), fetch as typeof globalThis.fetch, ['volume:import', 'volume:read'])
    const command = new CommandRegistry().require('volume.import')

    const result = await command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
    }), ports)

    expect(result).toMatchObject({
      data: {
        volume: { id: 'pvol_succeeded' },
        transfer: { id: 'vtx_succeeded', state: 'succeeded' },
      },
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('converges on a succeeded replay after a PUT response and readback are lost', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    const bytes = Buffer.from('abcdef')
    const checksum = createHash('sha256').update(bytes).digest('hex')
    await writeFile(archive, bytes, { mode: 0o600 })
    let creates = 0
    let readbacks = 0
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      await new Response(init?.body).arrayBuffer()
      throw new Error('response lost after upload')
    })
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'createVolumeImport') {
        creates += 1
        return {
          schemaVersion: 'test/v1',
          data: {
            volume: { id: 'pvol_replayed' },
            transfer: creates === 1
              ? { id: 'vtx_replayed', direction: 'import', state: 'created' }
              : {
                  id: 'vtx_replayed',
                  projectVolumeId: 'pvol_replayed',
                  direction: 'import',
                  state: 'succeeded',
                  expectedBytes: bytes.length,
                  transferredBytes: bytes.length,
                  sha256: checksum,
                },
          },
        }
      }
      readbacks += 1
      if (readbacks === 1) {
        return {
          schemaVersion: 'test/v1',
          data: { id: 'vtx_replayed', direction: 'import', state: 'ready' },
        }
      }
      throw new CliCommandError('network_error', 'Authoritative readback was lost.', {
        status: 503,
        retryable: true,
      })
    }, fetch as typeof globalThis.fetch, ['volume:import', 'volume:read'])
    const command = new CommandRegistry().require('volume.import')
    const request = invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
    })

    await expect(command.handler(request, ports)).rejects.toMatchObject({
      code: 'network_error',
      details: {
        transferId: 'vtx_replayed',
        volumeId: 'pvol_replayed',
        uploadReplaySafe: false,
      },
    })
    await expect(command.handler(request, ports)).resolves.toMatchObject({
      data: { transfer: { id: 'vtx_replayed', state: 'succeeded' } },
    })

    expect(creates).toBe(2)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not open an import stream when preparation reaches a terminal state', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    await writeFile(archive, 'abcdef', { mode: 0o600 })
    const fetch = vi.fn()
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'createVolumeImport') {
        return {
          schemaVersion: 'test/v1',
          data: { volume: { id: 'pvol_test' }, transfer: { id: 'vtx_import' } },
        }
      }
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_import',
          direction: 'import',
          state: 'failed',
          lastErrorCode: 'volume_transfer.prepare_failed',
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:import', 'volume:read'])
    const command = new CommandRegistry().require('volume.import')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
    }), ports)).rejects.toMatchObject({ code: 'volume_transfer.prepare_failed', status: 409 })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('cancels an in-progress one-shot import without retrying it', async () => {
    const directory = await temporaryDirectory()
    const archive = join(directory, 'backup.tar.gz')
    await writeFile(archive, 'abcdef', { mode: 0o600 })
    let interrupt: (() => void) | undefined
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      setTimeout(() => interrupt?.(), 0)
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      })
    })
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'createVolumeImport') {
        return {
          schemaVersion: 'test/v1',
          data: { volume: { id: 'pvol_test' }, transfer: { id: 'vtx_import' } },
        }
      }
      return {
        schemaVersion: 'test/v1',
        data: { id: 'vtx_import', direction: 'import', state: 'ready', format: 'tar_gz' },
      }
    }, fetch as typeof globalThis.fetch, ['volume:import', 'volume:read'], (listener) => {
      interrupt = listener
      return () => {
        interrupt = undefined
      }
    })
    const command = new CommandRegistry().require('volume.import')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      file: archive,
      displayName: 'Imported data',
      clusterId: 'cluster-a',
      capacity: '1Gi',
      storageClassName: 'standard',
    }), ports)).rejects.toMatchObject({ code: 'request_cancelled', status: 499, exitCode: 130 })

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('uses one ticket for one complete export GET and verifies the completed transfer', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    const unrelatedManifestPartial = `${destination}.manifest.json.part`
    await writeFile(unrelatedManifestPartial, 'unrelated', { mode: 0o600 })
    const archive = Buffer.from('abcdef')
    const checksum = createHash('sha256').update(archive).digest('hex')
    const apiRequests: string[] = []
    let observations = 0
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(init?.method).toBe('GET')
      expect(String(input)).toContain('/volume-transfers/vtx_export/content?ticket=one-time-ticket')
      expect(headers.has('cookie')).toBe(false)
      expect(headers.has('range')).toBe(false)
      return new Response(archive)
    })
    const ports = createPorts(directory, async (request) => {
      apiRequests.push(request.operationId)
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        return {
          schemaVersion: 'test/v1',
          data: { ticket: 'one-time-ticket', expiresAt: '2030-01-01T00:00:00Z' },
        }
      }
      observations += 1
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'tar_gz',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    const result = await command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports)

    expect(apiRequests).toEqual([
      'getVolumeTransfer',
      'authorizeVolumeTransferDownload',
      'getVolumeTransfer',
    ])
    expect(fetch).toHaveBeenCalledTimes(1)
    await expect(readFile(destination, 'utf8')).resolves.toBe('abcdef')
    await expect(readFile(unrelatedManifestPartial, 'utf8')).resolves.toBe('unrelated')
    expect(result).toMatchObject({
      schemaVersion: 'cli.luna.devops/volume-export/v1',
      data: {
        transfer: { id: 'vtx_export', state: 'succeeded' },
        file: { path: destination, length: 6, sha256: checksum },
      },
    })
    expect(result).not.toHaveProperty('data.resumed')
  })

  it('does not retry or reauthorize a rejected one-shot download', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    let authorizations = 0
    const fetch = vi.fn(async () => {
      return Response.json({
        error: {
          code: 'volume_transfer.download_ticket_invalid',
          message: 'The download ticket is invalid.',
        },
      }, { status: 401 })
    })
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return {
          schemaVersion: 'test/v1',
          data: { ticket: `one-time-ticket-${authorizations}` },
        }
      }
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: 'ready',
          format: 'tar_gz',
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
    }), ports)).rejects.toMatchObject({
      code: 'volume_transfer.download_ticket_invalid',
      status: 401,
    })

    expect(authorizations).toBe(1)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('preserves the complete staging archive when authoritative readback fails', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    const archive = Buffer.from('complete-export')
    let observations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        return {
          schemaVersion: 'test/v1',
          data: { ticket: 'one-time-ticket' },
        }
      }
      observations += 1
      if (observations === 1) {
        return {
          schemaVersion: 'test/v1',
          data: {
            id: 'vtx_export',
            direction: 'export',
            state: 'ready',
            format: 'tar_gz',
          },
        }
      }
      throw new CliCommandError('network_error', 'Readback failed.', {
        status: 503,
        retryable: true,
      })
    }, vi.fn(async () => new Response(archive)) as typeof globalThis.fetch, [
      'volume:read',
      'volume:export',
    ])
    const command = new CommandRegistry().require('volume.export')

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
    }), ports))
    expect(error).toMatchObject({
      code: 'network_error',
      details: {
        archiveVerified: false,
      },
    })

    const [recoveryPath] = requiredRecoveryPaths(error)
    expect(recoveryPath).toContain('/.luna-volume-export-transaction-')
    await expect(readFile(recoveryPath!)).resolves.toEqual(archive)
    await expect(readFile(`${destination}.part`)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(destination)).rejects.toMatchObject({ code: 'ENOENT' })
    expect((await stat(recoveryPath!)).mode & 0o777).toBe(0o600)
  })

  it('authorizes raw block content and its manifest with separate one-time tickets', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'block.raw.zst')
    const archive = Buffer.from('compressed-block-bytes')
    const checksum = createHash('sha256').update(archive).digest('hex')
    const dataSHA256 = createHash('sha256').update('logical-block-bytes').digest('hex')
    const apiRequests: string[] = []
    let authorizations = 0
    let observations = 0
    const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const headers = new Headers(init?.headers)
      expect(init?.method).toBe('GET')
      expect(headers.has('cookie')).toBe(false)
      expect(headers.has('range')).toBe(false)
      if (url.includes('/manifest?')) {
        expect(url).toContain('ticket=manifest-ticket')
        return Response.json({
          schemaVersion: 1,
          volumeMode: 'Block',
          format: 'raw_zst',
          exportedAt: '2030-01-01T00:00:00Z',
          logicalBytes: 4096,
          fileCount: 0,
          dataSHA256,
          consistencyMode: 'snapshot',
        })
      }
      expect(url).toContain('/content?ticket=content-ticket')
      return new Response(archive)
    })
    const ports = createPorts(directory, async (request) => {
      apiRequests.push(request.operationId)
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return {
          schemaVersion: 'test/v1',
          data: { ticket: authorizations === 1 ? 'content-ticket' : 'manifest-ticket' },
        }
      }
      observations += 1
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_block',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'raw_zst',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
          logicalBytes: 4096,
          dataSHA256,
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    const result = await command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_block',
      destination,
    }), ports)

    expect(apiRequests).toEqual([
      'getVolumeTransfer',
      'authorizeVolumeTransferDownload',
      'getVolumeTransfer',
      'authorizeVolumeTransferDownload',
    ])
    expect(fetch).toHaveBeenCalledTimes(2)
    await expect(readFile(destination)).resolves.toEqual(archive)
    await expect(readFile(`${destination}.manifest.json`, 'utf8')).resolves.toContain(dataSHA256)
    expect((await stat(`${destination}.manifest.json`)).mode & 0o777).toBe(0o600)
    expect(result).toMatchObject({
      schemaVersion: 'cli.luna.devops/volume-export/v1',
      data: {
        file: {
          path: destination,
          manifest: {
            path: `${destination}.manifest.json`,
            format: 'raw_zst',
            logicalBytes: 4096,
            dataSHA256,
          },
        },
      },
    })
  })

  it('preserves a verified archive when the Block manifest is invalid', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'block.raw.zst')
    const archive = Buffer.from('compressed-block-bytes')
    const checksum = createHash('sha256').update(archive).digest('hex')
    let authorizations = 0
    let observations = 0
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      return String(input).includes('/manifest?')
        ? new Response('{invalid-json')
        : new Response(archive)
    })
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return {
          schemaVersion: 'test/v1',
          data: { ticket: authorizations === 1 ? 'content-ticket' : 'manifest-ticket' },
        }
      }
      observations += 1
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_block',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'raw_zst',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
          logicalBytes: 4096,
          dataSHA256: 'a'.repeat(64),
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_block',
      destination,
    }), ports))
    expect(error).toMatchObject({
      code: 'volume_transfer.manifest_invalid',
      details: {
        archiveVerified: true,
      },
    })

    const [recoveryPath] = requiredRecoveryPaths(error)
    await expect(readFile(recoveryPath!)).resolves.toEqual(archive)
    await expect(readFile(`${destination}.part`)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(`${destination}.manifest.json.part`)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(destination)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('rolls back a partially committed Block export without clobbering a raced sidecar', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'block.raw.zst')
    const manifestPath = `${destination}.manifest.json`
    const archive = Buffer.from('compressed-block-bytes')
    const checksum = createHash('sha256').update(archive).digest('hex')
    const dataSHA256 = createHash('sha256').update('logical-block-bytes').digest('hex')
    let authorizations = 0
    let observations = 0
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/manifest?')) {
        return Response.json({
          schemaVersion: 1,
          volumeMode: 'Block',
          format: 'raw_zst',
          exportedAt: '2030-01-01T00:00:00Z',
          logicalBytes: 4096,
          fileCount: 0,
          dataSHA256,
          consistencyMode: 'snapshot',
        })
      }
      return new Response(archive)
    })
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return {
          schemaVersion: 'test/v1',
          data: { ticket: authorizations === 1 ? 'content-ticket' : 'manifest-ticket' },
        }
      }
      observations += 1
      if (observations === 2)
        await writeFile(manifestPath, 'raced-sidecar', { mode: 0o600 })
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_block',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'raw_zst',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
          logicalBytes: 4096,
          dataSHA256,
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_block',
      destination,
    }), ports))
    expect(error).toMatchObject({ code: 'download_destination_exists' })

    await expect(readFile(destination)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(manifestPath, 'utf8')).resolves.toBe('raced-sidecar')
    const recoveryPaths = requiredRecoveryPaths(error)
    expect(recoveryPaths).toHaveLength(2)
    await expect(readFile(recoveryPaths[0]!)).resolves.toEqual(archive)
    await expect(readFile(recoveryPaths[1]!, 'utf8')).resolves.toContain(dataSHA256)
    await expect(readFile(`${destination}.part`)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(`${manifestPath}.part`)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('restores overwritten files when the second verified file cannot be committed', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'block.raw.zst')
    const manifestPath = `${destination}.manifest.json`
    await writeFile(destination, 'old-archive', { mode: 0o600 })
    await writeFile(manifestPath, 'old-manifest', { mode: 0o600 })
    const archive = Buffer.from('new-archive')
    const checksum = createHash('sha256').update(archive).digest('hex')
    const dataSHA256 = createHash('sha256').update('logical-block-bytes').digest('hex')
    let authorizations = 0
    let observations = 0
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes('/manifest?')) {
        return Response.json({
          schemaVersion: 1,
          volumeMode: 'Block',
          format: 'raw_zst',
          exportedAt: '2030-01-01T00:00:00Z',
          logicalBytes: 4096,
          fileCount: 0,
          dataSHA256,
          consistencyMode: 'snapshot',
        })
      }
      return new Response(archive)
    })
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return {
          schemaVersion: 'test/v1',
          data: { ticket: authorizations === 1 ? 'content-ticket' : 'manifest-ticket' },
        }
      }
      observations += 1
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_block',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'raw_zst',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
          logicalBytes: 4096,
          dataSHA256,
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')
    fileSystemFaults.linkDestination = manifestPath

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_block',
      destination,
      overwrite: true,
    }), ports))
    expect(error).toMatchObject({ code: 'download_commit_failed' })

    await expect(readFile(destination, 'utf8')).resolves.toBe('old-archive')
    await expect(readFile(manifestPath, 'utf8')).resolves.toBe('old-manifest')
    const recoveryPaths = requiredRecoveryPaths(error)
    expect(recoveryPaths).toHaveLength(2)
    await expect(readFile(recoveryPaths[0]!)).resolves.toEqual(archive)
    await expect(readFile(recoveryPaths[1]!, 'utf8')).resolves.toContain(dataSHA256)
    await expect(readFile(`${destination}.part`)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(`${manifestPath}.part`)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readdir(directory)).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/^\.luna-volume-export-backup-/u),
    ]))
  })

  it('rejects a stale partial file instead of resuming it', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    await writeFile(`${destination}.part`, 'stale', { mode: 0o600 })
    const fetch = vi.fn()
    const calls: string[] = []
    const ports = createPorts(directory, async (request) => {
      calls.push(request.operationId)
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: 'ready',
          format: 'tar_gz',
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
    }), ports)).rejects.toMatchObject({ code: 'download_destination_exists', status: 409 })

    expect(calls).toEqual(['getVolumeTransfer'])
    expect(fetch).not.toHaveBeenCalled()
    await expect(readFile(`${destination}.part`, 'utf8')).resolves.toBe('stale')
  })

  it('fails before issuing a download ticket when safe hard links are unavailable', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    const fetch = vi.fn()
    let authorizations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return { schemaVersion: 'test/v1', data: { ticket: 'must-not-be-issued' } }
      }
      return {
        schemaVersion: 'test/v1',
        data: { id: 'vtx_export', direction: 'export', state: 'ready', format: 'tar_gz' },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')
    fileSystemFaults.failNextLink = true

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
    }), ports)).rejects.toMatchObject({ code: 'download_destination_unsafe', status: 422 })

    expect(authorizations).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
    expect((await readdir(directory)).some(name =>
      name.startsWith('.luna-volume-export-transaction-'))).toBe(false)
  })

  it('overwrites an unchanged regular file and removes its private transaction artifacts', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    await writeFile(destination, 'old-archive', { mode: 0o600 })
    const archive = Buffer.from('new-archive')
    const checksum = createHash('sha256').update(archive).digest('hex')
    let observations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload')
        return { schemaVersion: 'test/v1', data: { ticket: 'one-shot-ticket' } }
      observations += 1
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'tar_gz',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
        },
      }
    }, vi.fn(async () => new Response(archive)) as typeof globalThis.fetch, [
      'volume:read',
      'volume:export',
    ])
    const command = new CommandRegistry().require('volume.export')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports)).resolves.toMatchObject({ schemaVersion: 'cli.luna.devops/volume-export/v1' })

    await expect(readFile(destination)).resolves.toEqual(archive)
    expect((await readdir(directory)).some(name =>
      name.startsWith('.luna-volume-export-transaction-'))).toBe(false)
  })

  it('does not overwrite a destination that appeared during the download', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    const archive = Buffer.from('verified-export')
    const checksum = createHash('sha256').update(archive).digest('hex')
    let observations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload')
        return { schemaVersion: 'test/v1', data: { ticket: 'one-shot-ticket' } }
      observations += 1
      if (observations === 2)
        await writeFile(destination, 'appeared-file', { mode: 0o600 })
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'tar_gz',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
        },
      }
    }, vi.fn(async () => new Response(archive)) as typeof globalThis.fetch, [
      'volume:read',
      'volume:export',
    ])
    const command = new CommandRegistry().require('volume.export')

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports))

    expect(error).toMatchObject({
      code: 'download_commit_failed',
      details: { preservedUnknownPaths: [destination] },
    })
    await expect(readFile(destination, 'utf8')).resolves.toBe('appeared-file')
    await expect(readFile(requiredRecoveryPaths(error)[0]!)).resolves.toEqual(archive)
  })

  it('does not overwrite a destination whose inode was replaced during the download', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    await writeFile(destination, 'old-archive', { mode: 0o600 })
    const archive = Buffer.from('verified-export')
    const checksum = createHash('sha256').update(archive).digest('hex')
    let observations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload')
        return { schemaVersion: 'test/v1', data: { ticket: 'one-shot-ticket' } }
      observations += 1
      if (observations === 2) {
        await rm(destination)
        await writeFile(destination, 'raced-target', { mode: 0o600 })
      }
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'tar_gz',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
        },
      }
    }, vi.fn(async () => new Response(archive)) as typeof globalThis.fetch, [
      'volume:read',
      'volume:export',
    ])
    const command = new CommandRegistry().require('volume.export')

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports))

    expect(error).toMatchObject({ code: 'download_commit_failed' })
    await expect(readFile(destination, 'utf8')).resolves.toBe('raced-target')
    await expect(readFile(requiredRecoveryPaths(error)[0]!)).resolves.toEqual(archive)
  })

  it('detects an in-place same-inode overwrite target mutation', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    await writeFile(destination, 'old-archive', { mode: 0o600 })
    const initialInode = (await stat(destination, { bigint: true })).ino
    const archive = Buffer.from('verified-export')
    const checksum = createHash('sha256').update(archive).digest('hex')
    let observations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload')
        return { schemaVersion: 'test/v1', data: { ticket: 'one-shot-ticket' } }
      observations += 1
      if (observations === 2) {
        await new Promise(resolve => setTimeout(resolve, 2))
        await writeFile(destination, 'new-content', { mode: 0o600 })
      }
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'tar_gz',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
        },
      }
    }, vi.fn(async () => new Response(archive)) as typeof globalThis.fetch, [
      'volume:read',
      'volume:export',
    ])
    const command = new CommandRegistry().require('volume.export')

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports))

    expect(error).toMatchObject({ code: 'download_commit_failed' })
    expect((await stat(destination, { bigint: true })).ino).toBe(initialInode)
    await expect(readFile(destination, 'utf8')).resolves.toBe('new-content')
    await expect(readFile(requiredRecoveryPaths(error)[0]!)).resolves.toEqual(archive)
  })

  it('rejects an overwrite when a reserved partial appears before commit', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    const archive = Buffer.from('verified-export')
    const checksum = createHash('sha256').update(archive).digest('hex')
    let observations = 0
    const fetch = vi.fn(async () => new Response(archive))
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        return { schemaVersion: 'test/v1', data: { ticket: 'one-shot-ticket' } }
      }
      observations += 1
      if (observations === 2)
        await writeFile(`${destination}.part`, 'attacker-content', { mode: 0o600 })
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'tar_gz',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports))
    expect(error).toMatchObject({
      code: 'download_destination_exists',
      details: { preservedUnknownPaths: [`${destination}.part`] },
    })

    await expect(readFile(destination)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(`${destination}.part`, 'utf8')).resolves.toBe('attacker-content')
    const [recoveryPath] = requiredRecoveryPaths(error)
    expect(recoveryPath).not.toBe(`${destination}.part`)
    await expect(readFile(recoveryPath!)).resolves.toEqual(archive)
  })

  it('preserves the verified inode when the staging path changes after linking', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    const archive = Buffer.from('verified-export')
    const checksum = createHash('sha256').update(archive).digest('hex')
    let observations = 0
    const fetch = vi.fn(async () => new Response(archive))
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        return { schemaVersion: 'test/v1', data: { ticket: 'one-shot-ticket' } }
      }
      observations += 1
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: observations === 1 ? 'ready' : 'succeeded',
          format: 'tar_gz',
          expectedBytes: archive.length,
          transferredBytes: archive.length,
          sha256: checksum,
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')
    fileSystemFaults.replaceSourceAfterLink = {
      destination,
      content: 'attacker-content',
    }

    const error = await captureCommandError(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
    }), ports))
    expect(error).toMatchObject({ code: 'download_commit_failed' })

    await expect(readFile(destination)).resolves.toEqual(archive)
    await expect(readFile(`${destination}.part`)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(requiredRecoveryPaths(error)).toEqual([destination])
    const transactionName = (await readdir(directory)).find(name =>
      name.startsWith('.luna-volume-export-transaction-'))
    expect(transactionName).toBeDefined()
    await expect(readFile(join(directory, transactionName!, 'archive.part'), 'utf8')).resolves.toBe('attacker-content')
    expect(error.details.recoveryPaths).not.toContain(join(directory, transactionName!, 'archive.part'))
  })

  it('does not delete an existing recovery partial in overwrite mode', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    await writeFile(`${destination}.part`, 'recover-me', { mode: 0o600 })
    const fetch = vi.fn()
    let authorizations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return { schemaVersion: 'test/v1', data: { ticket: 'must-not-be-issued' } }
      }
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: 'ready',
          format: 'tar_gz',
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports)).rejects.toMatchObject({ code: 'download_destination_exists', status: 409 })

    expect(authorizations).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
    await expect(readFile(`${destination}.part`, 'utf8')).resolves.toBe('recover-me')
  })

  it('never replaces or recursively removes a directory in overwrite mode', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'export.tar.gz')
    const nested = join(destination, 'keep.txt')
    await mkdir(destination)
    await writeFile(nested, 'keep-me', { mode: 0o600 })
    const fetch = vi.fn()
    let authorizations = 0
    const ports = createPorts(directory, async (request) => {
      if (request.operationId === 'authorizeVolumeTransferDownload') {
        authorizations += 1
        return { schemaVersion: 'test/v1', data: { ticket: 'must-not-be-issued' } }
      }
      return {
        schemaVersion: 'test/v1',
        data: {
          id: 'vtx_export',
          direction: 'export',
          state: 'ready',
          format: 'tar_gz',
        },
      }
    }, fetch as typeof globalThis.fetch, ['volume:read', 'volume:export'])
    const command = new CommandRegistry().require('volume.export')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_export',
      destination,
      overwrite: true,
    }), ports)).rejects.toMatchObject({ code: 'download_destination_unsafe', status: 409 })

    expect(authorizations).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
    await expect(readFile(nested, 'utf8')).resolves.toBe('keep-me')
  })

  it('maps camelCase revision to the If-Match wire header', async () => {
    const directory = await temporaryDirectory()
    const planned: ReturnType<typeof planOpenApiRequest>[] = []
    const ports = createPorts(directory, async (request) => {
      planned.push(planOpenApiRequest(request))
      if (request.operationId === 'getProjectVolume') {
        return {
          schemaVersion: 'test/v1',
          data: { id: 'pvol_test', pendingOperation: 'expand', revision: 5 },
        }
      }
      return { schemaVersion: 'test/v1', data: { id: 'pvol_test', revision: 4 } }
    }, vi.fn() as typeof globalThis.fetch, ['volume:read', 'volume:write', 'volume:delete'])

    for (const [path, params] of [
      ['volume.update', { revision: 3, capacity: '2Gi' }],
      ['volume.delete', { revision: 4, dataAction: 'delete' }],
      ['volume.retry', { revision: 5 }],
    ] as const) {
      const command = new CommandRegistry().require(path)
      await command.handler(invocation(command.metadata, {
        projectId: 'project-a',
        volumeId: 'pvol_test',
        ...params,
      }), ports)
    }

    expect(planned.map(request => request.headers?.['If-Match'])).toEqual(['3', '4', undefined, '5'])
    expect(planned[1]?.query).toEqual({ dataAction: 'delete' })
    expect(planned[0]?.body).toEqual({ capacity: '2Gi' })
  })

  it.each([
    [{ pendingOperation: 'delete' }, 'volume:delete', 'volume_delete'],
    [{ pendingOperation: 'expand' }, 'volume:write', undefined],
    [{ pendingOperation: 'provision', sourceKind: 'blank', ownershipMode: 'managed' }, 'volume:write', undefined],
    [{ pendingOperation: 'provision', sourceKind: 'existing_claim', ownershipMode: 'managed' }, 'volume:write', 'volume_adopt'],
  ] as const)('dynamically authorizes volume retry for %o', async (volume, scope, mfaPurpose) => {
    const directory = await temporaryDirectory()
    const calls: Array<{
      readonly operationId: string
      readonly scopes: readonly string[]
      readonly mfaPurpose?: string
    }> = []
    const ports = createPorts(directory, async (request) => {
      calls.push({
        operationId: request.operationId,
        scopes: request.metadata.scopes,
        ...(request.metadata.mfaPurpose ? { mfaPurpose: request.metadata.mfaPurpose } : {}),
      })
      return request.operationId === 'getProjectVolume'
        ? { schemaVersion: 'test/v1', data: { id: 'pvol_test', revision: 5, ...volume } }
        : { schemaVersion: 'test/v1', data: { id: 'pvol_test', revision: 6 } }
    }, vi.fn() as typeof globalThis.fetch, ['volume:read', scope])
    const command = new CommandRegistry().require('volume.retry')

    await command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      volumeId: 'pvol_test',
      revision: 5,
    }), ports)

    expect(calls).toEqual([
      { operationId: 'getProjectVolume', scopes: ['volume:read'] },
      {
        operationId: 'retryProjectVolumeOperation',
        scopes: [scope],
        ...(mfaPurpose ? { mfaPurpose } : {}),
      },
    ])
  })

  it.each(['import', 'unexpected', undefined] as const)('fails closed for unsupported generic retry operation %s', async (pendingOperation) => {
    const directory = await temporaryDirectory()
    const calls: string[] = []
    const ports = createPorts(directory, async (request) => {
      calls.push(request.operationId)
      return {
        schemaVersion: 'test/v1',
        data: { id: 'pvol_test', revision: 5, ...(pendingOperation ? { pendingOperation } : {}) },
      }
    }, vi.fn() as typeof globalThis.fetch, ['volume:read'])
    const command = new CommandRegistry().require('volume.retry')

    await expect(command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      volumeId: 'pvol_test',
      revision: 5,
    }), ports)).rejects.toMatchObject({ code: 'volume.state_conflict', status: 409 })
    expect(calls).toEqual(['getProjectVolume'])
  })

  it.each([
    ['import', 'volume:import'],
    ['export', 'volume:export'],
  ] as const)('preflights %s retry with %s', async (direction, expectedScope) => {
    const directory = await temporaryDirectory()
    const calls: Array<{
      readonly operationId: string
      readonly scopes: readonly string[]
      readonly mfaPurpose?: string
    }> = []
    const ports = createPorts(directory, async (request) => {
      calls.push({
        operationId: request.operationId,
        scopes: request.metadata.scopes,
        ...(request.metadata.mfaPurpose
          ? { mfaPurpose: request.metadata.mfaPurpose }
          : {}),
      })
      return request.operationId === 'getVolumeTransfer'
        ? { schemaVersion: 'test/v1', data: { id: 'vtx_retry', direction, state: 'failed' } }
        : { schemaVersion: 'test/v1', data: { id: 'vtx_new', direction, state: 'queued' } }
    }, vi.fn() as typeof globalThis.fetch, ['volume:read', expectedScope])
    const command = new CommandRegistry().require('volume-transfer.retry')
    expect(command.metadata.agentAllowed).toBe(false)

    await command.handler(invocation(command.metadata, {
      projectId: 'project-a',
      transferId: 'vtx_retry',
    }), ports)

    expect(calls).toEqual([
      { operationId: 'getVolumeTransfer', scopes: ['volume:read'] },
      {
        operationId: 'retryVolumeTransfer',
        scopes: [expectedScope],
        mfaPurpose: direction === 'import' ? 'volume_import' : 'volume_export',
      },
    ])
  })

  async function temporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), 'luna-volume-transfer-'))
    temporaryDirectories.push(directory)
    return directory
  }
})

async function captureCommandError(promise: Promise<unknown>): Promise<CliCommandError> {
  try {
    await promise
  }
  catch (error) {
    expect(error).toBeInstanceOf(CliCommandError)
    return error as CliCommandError
  }
  throw new Error('Expected command to fail.')
}

function requiredRecoveryPaths(error: CliCommandError): string[] {
  const paths = error.details.recoveryPaths
  expect(Array.isArray(paths)).toBe(true)
  return (paths as unknown[]).filter((path): path is string => typeof path === 'string')
}

const DEFAULT_GLOBALS: CommandExecutionGlobals = {
  output: 'json',
  color: false,
  interactive: true,
  yes: true,
  quiet: false,
  agent: false,
  timeoutMs: 1_000,
  debug: false,
  idempotencyKey: 'volume-test-001',
  insecureSkipTlsVerify: false,
}

function invocation(
  metadata: CommandInvocation['metadata'],
  params: Readonly<Record<string, unknown>>,
): CommandInvocation {
  return {
    metadata,
    params,
    globals: DEFAULT_GLOBALS,
    explicitGlobalKeys: new Set(),
    canonicalGlobalValues: {},
  }
}

function createPorts(
  lunaHome: string,
  execute: (request: ApiExecutionRequest) => Promise<unknown>,
  fetch: typeof globalThis.fetch,
  scopes: readonly string[],
  onInterrupt?: (listener: () => void) => () => void,
): RuntimePorts {
  return {
    config: {
      read: async () => ({
        ...emptyConfigDocument(),
        server: 'https://luna.example.test',
        credential: {
          type: 'oauth',
          accessToken: 'secret',
          scopes,
          expiresAt: '2030-01-01T00:00:00Z',
        },
      }),
      write: async () => undefined,
    },
    input: { parse: async () => ({}) },
    output: {
      writeSuccess: () => undefined,
      writeError: () => undefined,
    },
    api: {
      execute,
      request: async () => ({}),
    },
    protocol: { fetch, ...(onInterrupt ? { onInterrupt } : {}) },
    env: { LUNA_HOME: lunaHome },
    isTTY: false,
  }
}
