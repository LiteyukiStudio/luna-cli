import type {
  ApiExecutionRequest,
  CommandExecutionGlobals,
  CommandResult,
  LunaConfigDocument,
  NormalizedCommandMetadata,
  RuntimePorts,
} from '../../src/commands/index.js'
import { lstat, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CommandOutput,
  CommandRegistry,
  createCliProgram,
  DefaultInputPort,
  LunaApiAdapter,
  memoryOutputStreams,
  runCli,
} from '../../src/commands/index.js'

describe('kubeconfig commands', () => {
  const directories: string[] = []

  afterEach(async () => {
    await Promise.all(directories.splice(0).map(path => rm(path, {
      recursive: true,
      force: true,
    })))
  })

  it('registers human-only protocol adapters for the sensitive create operation', () => {
    const registry = new CommandRegistry()
    expect(registry.get('kubeconfig.write')?.metadata).toMatchObject({
      source: 'protocol',
      agentAllowed: false,
      consumedOperations: ['createKubeCredential'],
      scopes: ['token:manage'],
    })
    expect(registry.get('kubeconfig.merge')?.metadata).toMatchObject({
      source: 'protocol',
      agentAllowed: false,
      consumedOperations: ['createKubeCredential'],
    })
  })

  it('creates a credential and writes only safe result metadata to stdout', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'luna.yaml')
    const harness = createHarness()

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'write',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=write',
      'scope=connect',
      `destination=${destination}`,
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(0)
    expect(harness.requests).toHaveLength(1)
    expect(harness.requests[0]).toMatchObject({
      operationId: 'createKubeCredential',
      params: {
        body: {
          name: 'development',
          expiresInDays: 7,
          scopes: ['kube:write', 'kube:connect'],
          contexts: [{
            projectId: 'prj_one',
            runtimeClusterId: 'clu_one',
          }],
        },
      },
    })
    expect(harness.successes[0]?.result.data).toEqual({
      path: destination,
      credentialId: 'tok_one',
      contexts: ['luna/prj_one/clu_one/all'],
      mode: 'write',
      replacedConflicts: 0,
    })
    expect(JSON.stringify(harness.successes)).not.toContain('one-time-secret')
    await expect(readFile(destination, 'utf8')).resolves.toContain('one-time-secret')
    if (process.platform !== 'win32')
      expect((await lstat(destination)).mode & 0o777).toBe(0o600)
  })

  it('never renders the one-time material through the real JSON output port', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'luna.yaml')
    const output = memoryOutputStreams()
    const harness = createHarness({
      output: new CommandOutput({ streams: output.streams, version: 'test' }),
    })

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'write',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=read',
      `destination=${destination}`,
      'output=json',
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(0)
    expect(output.stdout()).toContain('tok_one')
    expect(output.stdout()).toContain(destination)
    expect(output.stdout()).not.toContain('one-time-secret')
    expect(output.stdout()).not.toContain('kubeconfig:')
    expect(output.stderr()).toBe('')
  })

  it('rejects strict Agent mode before issuing a credential', async () => {
    const directory = await temporaryDirectory()
    const harness = createHarness()
    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'write',
      `destination=${join(directory, 'config')}`,
      'agent=true',
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(4)
    expect(harness.errors[0]).toMatchObject({ code: 'agent_command_forbidden' })
    expect(harness.requests).toEqual([])
  })

  it('detects predictable merge conflicts before issuing a credential', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'config')
    await writeFile(destination, generatedKubeconfig('old-secret', 'kbd_old'))
    const harness = createHarness()

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'merge',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=read',
      `destination=${destination}`,
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(6)
    expect(harness.errors[0]).toMatchObject({ code: 'kubeconfig_conflict' })
    expect(harness.requests).toEqual([])
    await expect(readFile(destination, 'utf8')).resolves.toContain('old-secret')
  })

  it('replaces same-name entries only when replaceConflicts is explicit', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'config')
    await writeFile(destination, generatedKubeconfig('old-secret', 'kbd_old'))
    const harness = createHarness()

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'merge',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=read',
      `destination=${destination}`,
      'replaceConflicts=true',
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(0)
    await expect(readFile(destination, 'utf8')).resolves.toContain('one-time-secret')
    await expect(readFile(destination, 'utf8')).resolves.not.toContain('old-secret')
  })

  it('revokes the credential if a race prevents the atomic write', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'config')
    const harness = createHarness({
      async afterCreate() {
        await writeFile(destination, 'created by another process\n')
      },
    })

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'write',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=read',
      `destination=${destination}`,
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(6)
    expect(harness.requests.map(request => request.operationId)).toEqual([
      'createKubeCredential',
      'revokeKubeCredential',
    ])
    expect(harness.errors[0]).toMatchObject({
      code: 'kubeconfig_target_exists',
      details: expect.objectContaining({
        credentialId: 'tok_one',
        credentialRevoked: true,
      }),
    })
    expect(JSON.stringify(harness.errors)).not.toContain('one-time-secret')
    await expect(readFile(destination, 'utf8')).resolves.toBe('created by another process\n')
  })

  it('reports only an opaque credential ID if automatic revocation also fails', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'config')
    const harness = createHarness({
      async afterCreate() {
        await writeFile(destination, 'created by another process\n')
      },
      revokeError: new Error('Authorization: Bearer revocation-secret'),
    })

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'write',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=read',
      `destination=${destination}`,
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(8)
    expect(harness.errors[0]).toMatchObject({
      code: 'kubeconfig_write_failed_revoke_failed',
      details: {
        credentialId: 'tok_one',
        causeCode: 'kubeconfig_target_exists',
        manualRevokeCommand:
          'luna kubectl-access revoke-kube-credential credentialId=tok_one',
      },
    })
    const serialized = JSON.stringify(harness.errors)
    expect(serialized).not.toContain('one-time-secret')
    expect(serialized).not.toContain('revocation-secret')
  })

  it('revokes a credential when the one-time kubeconfig is missing', async () => {
    const directory = await temporaryDirectory()
    const harness = createHarness({
      createResponse: {
        credential: { id: 'tok_one' },
        bindings: [],
      },
    })

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'write',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=read',
      `destination=${join(directory, 'config')}`,
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(8)
    expect(harness.requests.map(request => request.operationId)).toEqual([
      'createKubeCredential',
      'revokeKubeCredential',
    ])
    expect(harness.errors[0]).toMatchObject({
      code: 'kubeconfig_response_invalid',
      details: expect.objectContaining({
        credentialId: 'tok_one',
        credentialRevoked: true,
      }),
    })
  })

  it('fails OAuth scope preflight without sending the credential request', async () => {
    const directory = await temporaryDirectory()
    const destination = join(directory, 'config')
    const config: LunaConfigDocument = {
      version: 2,
      server: 'https://luna.example.test',
      credential: {
        type: 'oauth',
        accessToken: 'oauth-access',
        refreshToken: 'oauth-refresh',
        scopes: ['project:read'],
        expiresAt: '2999-01-01T00:00:00.000Z',
      },
      project: null,
      language: '',
      output: '',
    }
    const clientFactory = vi.fn()
    const harness = createHarness({
      config,
      apiFactory(configPort) {
        return new LunaApiAdapter({ config: configPort, clientFactory })
      },
    })

    const result = await runCli(harness.program, [
      'node',
      'luna',
      'kubeconfig',
      'write',
      'credentialName=development',
      'context=prj_one:clu_one',
      'scope=read',
      `destination=${destination}`,
      'yes=true',
    ], harness.ports.output)

    expect(result.exitCode).toBe(4)
    expect(harness.errors[0]).toMatchObject({ code: 'oauth_scope_required' })
    expect(clientFactory).not.toHaveBeenCalled()
  })

  async function temporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), 'luna-kubeconfig-command-'))
    directories.push(directory)
    return directory
  }
})

function createHarness(options: {
  readonly afterCreate?: () => Promise<void>
  readonly createResponse?: unknown
  readonly revokeError?: Error
  readonly config?: LunaConfigDocument
  readonly apiFactory?: (config: RuntimePorts['config']) => RuntimePorts['api']
  readonly output?: RuntimePorts['output']
} = {}) {
  let config = structuredClone(options.config ?? defaultConfig())
  const requests: ApiExecutionRequest[] = []
  const successes: Array<{
    metadata: NormalizedCommandMetadata
    result: CommandResult
    globals: CommandExecutionGlobals
  }> = []
  const errors: unknown[] = []
  const configPort: RuntimePorts['config'] = {
    read: async () => config,
    write: async (next) => {
      config = structuredClone(next)
    },
  }
  const api: RuntimePorts['api'] = options.apiFactory?.(configPort) ?? {
    async execute(request) {
      requests.push(request)
      if (request.operationId === 'revokeKubeCredential') {
        if (options.revokeError)
          throw options.revokeError
        return { data: null }
      }
      await options.afterCreate?.()
      return {
        data: options.createResponse ?? {
          credential: { id: 'tok_one' },
          bindings: [{ contextName: 'luna/prj_one/clu_one/all' }],
          kubeconfig: generatedKubeconfig(),
        },
        meta: { requestId: 'req_one' },
      }
    },
    request: async () => ({ data: {} }),
  }
  const ports: RuntimePorts = {
    config: configPort,
    input: new DefaultInputPort(),
    output: options.output ?? {
      writeSuccess(metadata, result, globals) {
        successes.push({ metadata, result, globals })
      },
      writeError(error) {
        errors.push(error)
      },
    },
    api,
    env: {},
    isTTY: false,
    version: 'test',
    distribution: 'source',
  }
  const registry = new CommandRegistry()
  return {
    ports,
    program: createCliProgram({ registry, ports }),
    requests,
    successes,
    errors,
  }
}

function defaultConfig(): LunaConfigDocument {
  return {
    version: 2,
    server: 'https://luna.example.test',
    credential: {
      type: 'access_token',
      token: 'platform-token',
      scopes: ['token:manage'],
    },
    project: null,
    language: '',
    output: '',
  }
}

function generatedKubeconfig(token = 'one-time-secret', binding = 'kbd_one'): string {
  return `apiVersion: v1
kind: Config
clusters:
  - name: luna/prj_one/clu_one/all
    cluster:
      server: https://luna.example.test/kube/v1/bindings/${binding}
contexts:
  - name: luna/prj_one/clu_one/all
    context:
      cluster: luna/prj_one/clu_one/all
      user: luna/tok_one
      namespace: project-one
users:
  - name: luna/tok_one
    user:
      token: ${token}
current-context: luna/prj_one/clu_one/all
`
}
