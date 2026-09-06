import type {
  CommandExecutionGlobals,
  ResourceReferenceRequest,
  RuntimePorts,
} from '../../src/commands/types.js'
import * as apiContract from '@luna-devops/api-contract'
import { describe, expect, it, vi } from 'vitest'
import {
  CommandRegistry,
  createCliProgram,
  createRegistryFromContract,
  DefaultInputPort,
  LunaApiAdapter,
  resourceReferenceForParameter,
  runCli,
} from '../../src/commands/index.js'

const PROJECT_ID = 'prj_111111111111111111111111'
const APPLICATION_ID = 'app_222222222222222222222222'
const TARGET_ID = 'dplt_333333333333333333333333'

describe('resource reference resolution', () => {
  it('keeps previous canonical core paths available to existing agents', async () => {
    const errors: unknown[] = []
    const ports = testPorts(errors)
    const registry = createRegistryFromContract(apiContract)

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'project',
      'get-projects',
      'agent=true',
      'output=json',
      'interactive=false',
    ], ports.output)

    expect(result.exitCode).toBe(0)
    expect(errors).toEqual([])
  })

  it('resolves scoped human references before the risk confirmation', async () => {
    const events: string[] = []
    const resolved: ResourceReferenceRequest[] = []
    const errors: unknown[] = []
    const registry = new CommandRegistry()
    registry.register(deploymentUpdateMetadata(), async (invocation) => {
      events.push('execute')
      return { data: invocation.params }
    })
    const ports = testPorts(errors, {
      confirm: async () => {
        events.push('confirm')
        return true
      },
      resolveResource: async (request) => {
        events.push(`resolve:${request.kind}`)
        resolved.push(request)
        switch (request.kind) {
          case 'project': return { id: PROJECT_ID, identifier: 'xnn-api' }
          case 'application': return { id: APPLICATION_ID, identifier: 'postgres-w8kt4h' }
          case 'deployment-target': return { id: TARGET_ID, stage: 'prod' }
          case 'release': return { id: 'rel_444444444444444444444444' }
        }
      },
    })

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'deployment',
      'update',
      'projectId=xnn-api',
      'applicationId=postgres-w8kt4h',
      'targetId=prod',
    ], ports.output)

    expect(result.exitCode).toBe(0)
    expect(events).toEqual([
      'resolve:project',
      'resolve:application',
      'resolve:deployment-target',
      'confirm',
      'execute',
    ])
    expect(resolved).toEqual([
      expect.objectContaining({ kind: 'project', scope: {} }),
      expect.objectContaining({
        kind: 'application',
        scope: { projectId: PROJECT_ID },
      }),
      expect.objectContaining({
        kind: 'deployment-target',
        scope: { projectId: PROJECT_ID, applicationId: APPLICATION_ID },
      }),
    ])
  })

  it('requires stable IDs in agent mode, including read-only commands', async () => {
    const errors: unknown[] = []
    const resolveResource = vi.fn()
    const registry = new CommandRegistry()
    registry.register({ ...deploymentUpdateMetadata(), risk: 'low' }, async () => ({ data: {} }))
    const ports = testPorts(errors, { resolveResource })

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'deployment',
      'update',
      'projectId=xnn-api',
      `applicationId=${APPLICATION_ID}`,
      `targetId=${TARGET_ID}`,
      'agent=true',
      'yes=true',
    ], ports.output)

    expect(result.exitCode).toBe(2)
    expect(errors[0]).toMatchObject({
      code: 'stable_resource_id_required',
      details: { parameter: 'projectId', expectedPrefix: 'prj_' },
    })
    expect(resolveResource).not.toHaveBeenCalled()
  })

  it('keeps client dry-run local by requiring stable IDs for readable references', async () => {
    const errors: unknown[] = []
    const resolveResource = vi.fn()
    const registry = new CommandRegistry()
    registry.register({ ...deploymentUpdateMetadata(), risk: 'low' }, async () => ({ data: {} }))
    const ports = testPorts(errors, { resolveResource })

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'deployment',
      'update',
      'projectId=xnn-api',
      `applicationId=${APPLICATION_ID}`,
      `targetId=${TARGET_ID}`,
      'dryRun=client',
    ], ports.output)

    expect(result.exitCode).toBe(2)
    expect(errors[0]).toMatchObject({
      code: 'client_dry_run_resource_id_required',
      details: { parameter: 'projectId', expectedPrefix: 'prj_' },
    })
    expect(resolveResource).not.toHaveBeenCalled()
  })

  it('rejects IDs for the wrong resource type without a lookup', async () => {
    const errors: unknown[] = []
    const resolveResource = vi.fn()
    const registry = new CommandRegistry()
    registry.register(deploymentUpdateMetadata(), async () => ({ data: {} }))
    const ports = testPorts(errors, { resolveResource })

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'deployment',
      'update',
      `projectId=${APPLICATION_ID}`,
      `applicationId=${APPLICATION_ID}`,
      `targetId=${TARGET_ID}`,
    ], ports.output)

    expect(result.exitCode).toBe(2)
    expect(errors[0]).toMatchObject({
      code: 'resource_reference_type_mismatch',
      details: { parameter: 'projectId', actualPrefix: 'app_' },
    })
    expect(resolveResource).not.toHaveBeenCalled()
  })

  it('rejects a Kubernetes workload name used as a release ID locally', async () => {
    const errors: unknown[] = []
    const resolveResource = vi.fn()
    const registry = new CommandRegistry()
    const ports = testPorts(errors, { resolveResource })

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'release',
      'exec',
      `projectId=${PROJECT_ID}`,
      'releaseId=luna-postgres-w8kt4h-prod',
    ], ports.output)

    expect(result.exitCode).toBe(2)
    expect(errors[0]).toMatchObject({
      code: 'resource_id_required',
      details: {
        parameter: 'releaseId',
        resource: 'release',
        expectedPrefix: 'rel_',
      },
    })
    expect(resolveResource).not.toHaveBeenCalled()
  })
})

describe('resource lookup requests', () => {
  it('uses unique-key filters instead of a fuzzy first-page search', async () => {
    const requests: Array<{ path: string, query?: unknown }> = []
    const adapter = new LunaApiAdapter({
      config: {
        read: async () => ({
          version: 2,
          server: 'https://luna.example.test',
          credential: null,
          project: null,
          language: '',
          output: '',
        }),
        write: async () => {},
      },
      clientFactory: () => ({
        request: async (request: { path: string, query?: unknown }) => {
          requests.push(request)
          if (request.path === '/api/v1/projects') {
            return success({
              items: [{ id: PROJECT_ID, identifier: 'xnn-api', name: 'XNN API' }],
            })
          }
          if (request.path.endsWith('/applications')) {
            return success({
              items: [{ id: APPLICATION_ID, identifier: 'postgres-w8kt4h' }],
            })
          }
          return success({ items: [{ id: TARGET_ID, stage: 'prod' }] })
        },
      }) as never,
    })
    const globals = testGlobals()

    await adapter.resolveProject('xnn-api', globals)
    await adapter.resolveResource({
      kind: 'application',
      parameter: 'applicationId',
      value: 'postgres-w8kt4h',
      scope: { projectId: PROJECT_ID },
    }, globals)
    await adapter.resolveResource({
      kind: 'deployment-target',
      parameter: 'targetId',
      value: 'prod',
      scope: { projectId: PROJECT_ID, applicationId: APPLICATION_ID },
    }, globals)

    expect(requests).toEqual([
      {
        path: '/api/v1/projects',
        query: { page: 1, pageSize: 2, identifier: 'xnn-api' },
        method: 'GET',
        headers: expect.any(Headers),
        requestId: undefined,
        body: undefined,
        timeoutMs: 30_000,
      },
      expect.objectContaining({
        path: `/api/v1/projects/${PROJECT_ID}/applications`,
        query: { page: 1, pageSize: 2, identifier: 'postgres-w8kt4h' },
      }),
      expect.objectContaining({
        path: `/api/v1/projects/${PROJECT_ID}/applications/${APPLICATION_ID}/deployment-targets`,
        query: { page: 1, pageSize: 2, stage: 'prod' },
      }),
    ])
  })

  it('retries an exact project lookup with administrator visibility', async () => {
    const requests: Array<{ path: string, query?: unknown }> = []
    const adapter = new LunaApiAdapter({
      config: {
        read: async () => ({
          version: 2,
          server: 'https://luna.example.test',
          credential: null,
          project: null,
          language: '',
          output: '',
        }),
        write: async () => {},
      },
      clientFactory: () => ({
        request: async (request: { path: string, query?: unknown }) => {
          requests.push(request)
          if ((request.query as { visibility?: string }).visibility === 'all') {
            return success({
              items: [{ id: PROJECT_ID, identifier: 'platform-project' }],
            })
          }
          return success({ items: [] })
        },
      }) as never,
    })

    await expect(
      adapter.resolveProject('platform-project', testGlobals()),
    )
      .resolves
      .toMatchObject({ id: PROJECT_ID, identifier: 'platform-project' })
    expect(requests.map(request => request.query)).toEqual([
      { page: 1, pageSize: 2, identifier: 'platform-project' },
      { page: 1, pageSize: 2, identifier: 'platform-project', visibility: 'all' },
    ])
  })
})

function deploymentUpdateMetadata() {
  return {
    category: 'deployment',
    tool: 'update',
    source: 'openapi' as const,
    operationId: 'updateDeploymentTarget',
    risk: 'high' as const,
    projectContext: 'required' as const,
    parameters: [
      referenceParameter('projectId'),
      referenceParameter('applicationId'),
      referenceParameter('targetId'),
    ],
  }
}

function referenceParameter(name: 'applicationId' | 'projectId' | 'targetId') {
  return {
    name,
    location: 'path' as const,
    required: true,
    schema: { type: 'string' },
    resourceReference: resourceReferenceForParameter(name),
  }
}

function testPorts(
  errors: unknown[],
  options: {
    readonly confirm?: RuntimePorts['input']['confirm']
    readonly resolveResource?: RuntimePorts['api']['resolveResource']
  } = {},
): RuntimePorts {
  const parser = new DefaultInputPort()
  return {
    config: {
      read: async () => ({
        version: 2,
        server: 'https://luna.example.test',
        credential: null,
        project: null,
        language: '',
        output: '',
      }),
      write: async () => {},
    },
    input: {
      parse: (tokens, metadata) => parser.parse(tokens, metadata),
      confirm: options.confirm,
    },
    output: {
      writeSuccess: () => undefined,
      writeError(error) {
        errors.push(error)
      },
    },
    api: {
      execute: async () => ({}),
      request: async () => ({}),
      resolveResource: options.resolveResource,
    },
    env: {},
    isTTY: true,
  }
}

function testGlobals(): CommandExecutionGlobals {
  return {
    server: 'https://luna.example.test',
    output: 'json',
    color: false,
    interactive: false,
    yes: false,
    quiet: true,
    agent: false,
    timeoutMs: 30_000,
    debug: false,
    insecureSkipTlsVerify: false,
  }
}

function success(data: unknown) {
  return {
    ok: true as const,
    status: 200,
    data,
    requestId: 'request-resource',
  }
}
