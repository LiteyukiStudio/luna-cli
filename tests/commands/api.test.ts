import type { ApiExecutionRequest, CommandExecutionGlobals } from '../../src/commands/index.js'
import type { StoredLunaConfig } from '../../src/config/schema.js'
import { describe, expect, it, vi } from 'vitest'
import {
  CliCommandError,
  LunaApiAdapter,
  normalizeMetadata,
  planOpenApiRequest,
} from '../../src/commands/index.js'
import { MemoryConfigStore } from '../config/memory-store.js'

const globals: CommandExecutionGlobals = {
  project: 'project alpha',
  output: 'json',
  color: false,
  interactive: false,
  yes: false,
  quiet: true,
  agent: true,
  timeoutMs: 30_000,
  debug: false,
  insecureSkipTlsVerify: false,
}

describe('openAPI request planning', () => {
  it('reports the effective project from explicit command parameters', async () => {
    const adapter = new LunaApiAdapter({
      config: {
        read: async () => ({
          version: 2,
          server: 'https://devops.liteyuki.org',
          credential: null,
          project: null,
          language: '',
          output: '',
        }),
        write: async () => {},
      },
      clientFactory: () => ({
        request: async () => ({
          ok: true,
          status: 200,
          data: { items: [] },
          requestId: 'request-1',
        }),
      }) as never,
    })
    const metadata = normalizeMetadata({
      category: 'application',
      tool: 'list',
      source: 'openapi',
      operationId: 'listApplications',
      method: 'get',
      path: '/api/v1/projects/{projectId}/applications',
      parameters: [{ name: 'projectId', location: 'path', required: true }],
    })

    const result = await adapter.execute({
      operationId: 'listApplications',
      globals: { ...globals, server: 'https://luna.example.test' },
      params: { projectId: 'project explicit' },
      metadata,
    })

    expect(result.meta).toMatchObject({
      projectId: 'project explicit',
      requestId: 'request-1',
      status: 200,
    })
  })

  it('maps path, query, headers, body and server dry-run', () => {
    const request: ApiExecutionRequest = {
      operationId: 'updateApplication',
      globals: { ...globals, dryRun: 'server' },
      params: {
        applicationId: 'app/one',
        trace: 'trace-1',
        body: { name: 'demo' },
      },
      metadata: normalizeMetadata({
        category: 'application',
        tool: 'update',
        source: 'openapi',
        operationId: 'updateApplication',
        method: 'patch',
        path: '/api/v1/projects/{projectId}/applications/{applicationId}',
        parameters: [
          { name: 'projectId', location: 'path', required: true },
          { name: 'applicationId', location: 'path', required: true },
          { name: 'trace', location: 'header' },
          { name: 'body', location: 'body' },
        ],
      }),
    }

    expect(planOpenApiRequest(request)).toEqual({
      method: 'PATCH',
      path: '/api/v1/projects/project%20alpha/applications/app%2Fone',
      query: { dryRun: true },
      headers: { trace: 'trace-1' },
      body: { name: 'demo' },
    })
  })

  it('rejects header injection', () => {
    const request: ApiExecutionRequest = {
      operationId: 'inspect',
      globals,
      params: { trace: 'ok\r\nx-unsafe: yes' },
      metadata: normalizeMetadata({
        category: 'api',
        tool: 'inspect',
        source: 'openapi',
        operationId: 'inspect',
        method: 'get',
        path: '/api/v1/inspect',
        parameters: [{ name: 'trace', location: 'header' }],
      }),
    }

    expect(() => planOpenApiRequest(request)).toThrowError(CliCommandError)
  })

  it('does not inject the project context into optional parameters', () => {
    const request: ApiExecutionRequest = {
      operationId: 'listGlobalBuildTemplates',
      globals,
      params: {
        scope: 'global',
      },
      metadata: normalizeMetadata({
        category: 'build-template',
        tool: 'list',
        source: 'openapi',
        operationId: 'listGlobalBuildTemplates',
        method: 'get',
        path: '/api/v1/build-templates',
        parameters: [
          { name: 'projectId', location: 'query' },
          { name: 'scope', location: 'query' },
        ],
      }),
    }

    expect(planOpenApiRequest(request)).toEqual({
      method: 'GET',
      path: '/api/v1/build-templates',
      query: { scope: 'global' },
    })
  })
})

describe('automatic server compatibility negotiation', () => {
  it('validates metadata once before canonical remote commands', async () => {
    const paths: string[] = []
    const adapter = compatibleAdapter(paths)
    const request = listApplicationsRequest()

    await adapter.execute(request)
    await adapter.execute(request)

    expect(paths).toEqual([
      '/api/v1/meta',
      '/api/v1/projects/project%20explicit/applications',
      '/api/v1/projects/project%20explicit/applications',
    ])
  })

  it('allows additive contract changes within the supported API generation', async () => {
    const paths: string[] = []
    const adapter = compatibleAdapter(paths, 'sha256:different')

    await adapter.execute(listApplicationsRequest())

    expect(paths).toEqual([
      '/api/v1/meta',
      '/api/v1/projects/project%20explicit/applications',
    ])
  })

  it('keeps the generic diagnostic request available as an escape hatch', async () => {
    const paths: string[] = []
    const adapter = compatibleAdapter(paths, 'sha256:different')

    await adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals: { ...globals, server: 'https://luna.example.test' },
    })

    expect(paths).toEqual(['/api/v1/health'])
  })
})

describe('oAuth credential refresh', () => {
  it('refreshes an expiring credential before sending the API request', async () => {
    const store = new MemoryConfigStore(oauthConfig())
    const refreshedTokens: string[] = []
    const requestTokens: Array<string | undefined> = []
    const adapter = new LunaApiAdapter({
      config: store,
      now: () => Date.parse('2026-07-27T10:00:00.000Z'),
      oauthClient: {
        beginOAuthLogin: async () => {
          throw new Error('not used')
        },
        refreshOAuthCredential: async ({ refreshToken }) => {
          refreshedTokens.push(refreshToken)
          return {
            accessToken: 'access-refreshed',
            refreshToken: 'refresh-rotated',
            tokenType: 'Bearer',
            expiresAt: '2026-07-27T11:00:00.000Z',
          }
        },
        revokeOAuthCredential: async () => {},
      },
      clientFactory: options => ({
        request: async () => {
          requestTokens.push(await options.tokenProvider?.getAccessToken())
          return {
            ok: true,
            status: 200,
            data: { ok: true },
            requestId: 'request-refreshed',
          }
        },
      }) as never,
    })

    await adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })

    expect(refreshedTokens).toEqual(['refresh-original'])
    expect(requestTokens).toEqual(['access-refreshed'])
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-rotated',
      expiresAt: '2026-07-27T11:00:00.000Z',
    })
  })

  it('refreshes once and retries a safe request after a server 401', async () => {
    const store = new MemoryConfigStore(activeOauthConfig())
    const refreshedTokens: string[] = []
    const requestTokens: Array<string | undefined> = []
    let attempts = 0
    const adapter = new LunaApiAdapter({
      config: store,
      oauthClient: oauthClient(async ({ refreshToken }) => {
        refreshedTokens.push(refreshToken)
        return refreshedCredential()
      }),
      clientFactory: options => ({
        request: async () => {
          attempts += 1
          requestTokens.push(await options.tokenProvider?.getAccessToken())
          return attempts === 1
            ? unauthorizedResult('request-unauthorized')
            : {
                ok: true,
                status: 200,
                data: { ok: true },
                requestId: 'request-retried',
              }
        },
      }) as never,
    })

    await adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })

    expect(refreshedTokens).toEqual(['refresh-original'])
    expect(requestTokens).toEqual(['access-expiring', 'access-refreshed'])
    expect(attempts).toBe(2)
  })

  it('allows coalesced 401 recovery for the same OAuth credential generation', async () => {
    const store = new MemoryConfigStore(activeOauthConfig())
    const unauthorizedGate = deferred<void>()
    const refreshGate = deferred<ReturnType<typeof refreshedCredential>>()
    const refresh = vi.fn(async () => refreshGate.promise)
    const requestTokens: Array<string | undefined> = []
    let oldTokenAttempts = 0
    const adapter = new LunaApiAdapter({
      config: store,
      oauthClient: oauthClient(refresh),
      clientFactory: options => ({
        request: async () => {
          const token = await options.tokenProvider?.getAccessToken()
          requestTokens.push(token)
          if (token === 'access-expiring') {
            oldTokenAttempts += 1
            await unauthorizedGate.promise
            return unauthorizedResult(`request-old-${oldTokenAttempts}`)
          }
          return {
            ok: true,
            status: 200,
            data: { ok: true },
            requestId: `request-new-${requestTokens.length}`,
          }
        },
      }) as never,
    })

    const first = adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })
    const second = adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })
    await vi.waitFor(() => expect(oldTokenAttempts).toBe(2))
    unauthorizedGate.resolve(undefined)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    refreshGate.resolve(refreshedCredential())

    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(refresh).toHaveBeenCalledOnce()
    expect(requestTokens.filter(token => token === 'access-expiring')).toHaveLength(2)
    expect(requestTokens.filter(token => token === 'access-refreshed')).toHaveLength(2)
  })

  it('does not replay a 401 response after the server and credential change', async () => {
    const store = new MemoryConfigStore(activeOauthConfig())
    const refresh = vi.fn(async () => refreshedCredential())
    const baseUrls: string[] = []
    let attempts = 0
    const adapter = new LunaApiAdapter({
      config: store,
      oauthClient: oauthClient(refresh),
      clientFactory: (options) => {
        baseUrls.push(String(options.baseUrl))
        return {
          request: async () => {
            attempts += 1
            await store.write(switchedOauthConfig())
            return unauthorizedResult('request-context-switched')
          },
        } as never
      },
    })

    await expect(adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })).rejects.toMatchObject({
      code: 'auth_context_changed',
      status: 409,
      retryable: true,
      details: expect.objectContaining({
        stage: 'oauth_refresh',
        requestId: 'request-context-switched',
      }),
    })

    expect(refresh).not.toHaveBeenCalled()
    expect(attempts).toBe(1)
    expect(baseUrls).toEqual(['https://luna.example.test'])
  })

  it('rejects an authentication switch while preflight refresh is in flight', async () => {
    const store = new MemoryConfigStore(oauthConfig())
    const pending = deferred<ReturnType<typeof refreshedCredential>>()
    const refresh = vi.fn(async () => pending.promise)
    const clientFactory = vi.fn(() => ({ request: vi.fn() }) as never)
    const adapter = new LunaApiAdapter({
      config: store,
      now: () => Date.parse('2026-07-27T10:00:00.000Z'),
      oauthClient: oauthClient(refresh),
      clientFactory,
    })

    const request = adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    await store.write(switchedOauthConfig())
    pending.resolve(refreshedCredential())

    await expect(request).rejects.toMatchObject({
      code: 'auth_context_changed',
      status: 409,
      details: expect.objectContaining({ stage: 'oauth_preflight' }),
    })
    expect(clientFactory).not.toHaveBeenCalled()
  })

  it('checks the fixed authentication context again immediately before replay', async () => {
    const store = new MemoryConfigStore(activeOauthConfig())
    let factoryCalls = 0
    let attempts = 0
    const adapter = new LunaApiAdapter({
      config: store,
      oauthClient: oauthClient(async () => refreshedCredential()),
      clientFactory: () => {
        factoryCalls += 1
        if (factoryCalls === 2)
          store.value = switchedOauthConfig('https://luna.example.test')
        return {
          request: async () => {
            attempts += 1
            return attempts === 1
              ? unauthorizedResult('request-before-replay')
              : {
                  ok: true,
                  status: 200,
                  data: { ok: true },
                  requestId: 'request-should-not-run',
                }
          },
        } as never
      },
    })

    await expect(adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })).rejects.toMatchObject({
      code: 'auth_context_changed',
      status: 409,
      details: expect.objectContaining({
        stage: 'oauth_retry',
        requestId: 'request-before-replay',
      }),
    })

    expect(factoryCalls).toBe(2)
    expect(attempts).toBe(1)
  })

  it('does not refresh an environment token after a server 401', async () => {
    const refresh = vi.fn()
    let attempts = 0
    const adapter = new LunaApiAdapter({
      config: new MemoryConfigStore(activeOauthConfig()),
      env: { LUNA_TOKEN: 'environment-token' },
      oauthClient: oauthClient(refresh),
      clientFactory: () => ({
        request: async () => {
          attempts += 1
          return unauthorizedResult('request-environment')
        },
      }) as never,
    })

    await expect(adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })).rejects.toMatchObject({ status: 401 })

    expect(refresh).not.toHaveBeenCalled()
    expect(attempts).toBe(1)
  })

  it('does not refresh for a business-specific 401 response', async () => {
    const refresh = vi.fn()
    let attempts = 0
    const adapter = new LunaApiAdapter({
      config: new MemoryConfigStore(activeOauthConfig()),
      oauthClient: oauthClient(refresh),
      clientFactory: () => ({
        request: async () => {
          attempts += 1
          return unauthorizedResult('request-password', 'password.current_invalid')
        },
      }) as never,
    })

    await expect(adapter.request({
      method: 'POST',
      path: '/api/v1/account/password',
      params: { body: { currentPassword: 'invalid' } },
      globals,
    })).rejects.toMatchObject({
      code: 'password.current_invalid',
      status: 401,
    })

    expect(refresh).not.toHaveBeenCalled()
    expect(attempts).toBe(1)
  })

  it('refreshes but does not replay an unsafe request after a server 401', async () => {
    const store = new MemoryConfigStore(activeOauthConfig())
    let attempts = 0
    const adapter = new LunaApiAdapter({
      config: store,
      oauthClient: oauthClient(async () => refreshedCredential()),
      clientFactory: () => ({
        request: async () => {
          attempts += 1
          return unauthorizedResult('request-write')
        },
      }) as never,
    })

    await expect(adapter.request({
      method: 'POST',
      path: '/api/v1/example',
      params: { body: { name: 'example' } },
      globals,
    })).rejects.toMatchObject({
      code: 'oauth_request_replay_required',
      status: 409,
      details: expect.objectContaining({ requestId: 'request-write' }),
    })

    expect(attempts).toBe(1)
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-refreshed',
    })
  })

  it('limits a repeated safe-request 401 to one refresh and one replay', async () => {
    let attempts = 0
    const refresh = vi.fn(async () => refreshedCredential())
    const adapter = new LunaApiAdapter({
      config: new MemoryConfigStore(activeOauthConfig()),
      oauthClient: oauthClient(refresh),
      clientFactory: () => ({
        request: async () => {
          attempts += 1
          return unauthorizedResult(`request-${attempts}`)
        },
      }) as never,
    })

    await expect(adapter.request({
      method: 'GET',
      path: '/api/v1/health',
      params: {},
      globals,
    })).rejects.toMatchObject({ status: 401 })

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(attempts).toBe(2)
  })
})

describe('server-authoritative authorization', () => {
  it('sends a canonical command without preflighting copied scope metadata', async () => {
    const request = vi.fn(async () => ({
      ok: true as const,
      status: 200,
      data: { id: 'project alpha' },
      requestId: 'request-update',
    }))
    const adapter = new LunaApiAdapter({
      config: new MemoryConfigStore(activeOauthConfig()),
      clientFactory: () => ({ request }) as never,
    })

    await expect(adapter.execute({
      operationId: 'updateProject',
      globals,
      params: {
        projectId: 'project alpha',
        body: { name: 'Renamed project' },
      },
      metadata: normalizeMetadata({
        category: 'project',
        tool: 'update',
        source: 'openapi',
        operationId: 'updateProject',
        method: 'patch',
        path: '/api/v1/projects/{projectId}',
        scopes: ['project:write'],
        parameters: [
          { name: 'projectId', location: 'path', required: true },
          { name: 'body', location: 'body', required: true },
        ],
      }),
    })).resolves.toMatchObject({ data: { id: 'project alpha' } })
    expect(request).toHaveBeenCalledOnce()
  })

  it('preserves a server authorization failure without generating login guidance', async () => {
    const adapter = new LunaApiAdapter({
      config: new MemoryConfigStore(activeOauthConfig()),
      clientFactory: () => ({
        request: async () => ({
          ok: false,
          error: {
            code: 'auth.token.scope_insufficient',
            message: 'Insufficient scope.',
            status: 403,
            retryable: false,
            requestId: 'request-scope',
            details: { requiredScope: 'application:update' },
          },
        }),
      }) as never,
    })

    await expect(adapter.execute({
      operationId: 'updateApplication',
      globals,
      params: {
        projectId: 'project alpha',
        applicationId: 'application-one',
        body: { name: 'Renamed application' },
      },
      metadata: normalizeMetadata({
        category: 'application',
        tool: 'update',
        source: 'openapi',
        operationId: 'updateApplication',
        method: 'patch',
        path: '/api/v1/projects/{projectId}/applications/{applicationId}',
        parameters: [
          { name: 'projectId', location: 'path', required: true },
          { name: 'applicationId', location: 'path', required: true },
          { name: 'body', location: 'body', required: true },
        ],
      }),
    })).rejects.toMatchObject({
      code: 'auth.token.scope_insufficient',
      message: 'Insufficient scope.',
      details: expect.objectContaining({
        requiredScope: 'application:update',
      }),
    })
  })
})

function compatibleAdapter(paths: string[], serverDigest = 'sha256:contract') {
  return new LunaApiAdapter({
    config: {
      read: async () => ({
        version: 2,
        server: 'https://devops.liteyuki.org',
        credential: null,
        project: null,
        language: '',
        output: '',
      }),
      write: async () => {},
    },
    compatibility: {
      cliVersion: '0.0.7',
      openapiDigest: 'sha256:contract',
    },
    clientFactory: () => ({
      request: async ({ path }: { path: string }) => {
        paths.push(path)
        return {
          ok: true,
          status: 200,
          data: path === '/api/v1/meta'
            ? {
                apiVersion: 'v1',
                serverVersion: '0.1.0',
                openapiDigest: serverDigest,
                minimumCliVersion: '0.0.7',
                features: {},
              }
            : { items: [] },
          requestId: `request-${paths.length}`,
        }
      },
    }) as never,
  })
}

function listApplicationsRequest(): ApiExecutionRequest {
  return {
    operationId: 'listApplications',
    globals: { ...globals, server: 'https://luna.example.test' },
    params: { projectId: 'project explicit' },
    metadata: normalizeMetadata({
      category: 'application',
      tool: 'list',
      source: 'openapi',
      operationId: 'listApplications',
      method: 'get',
      path: '/api/v1/projects/{projectId}/applications',
      parameters: [{ name: 'projectId', location: 'path', required: true }],
    }),
  }
}

function oauthConfig(): StoredLunaConfig {
  return {
    version: 2,
    server: 'https://luna.example.test',
    credential: {
      type: 'oauth',
      accessToken: 'access-expiring',
      refreshToken: 'refresh-original',
      tokenType: 'Bearer',
      expiresAt: '2026-07-27T10:00:10.000Z',
      createdAt: '2026-07-27T09:00:00.000Z',
    },
    project: null,
    language: '',
    output: '',
  }
}

function activeOauthConfig(): StoredLunaConfig {
  const config = oauthConfig()
  if (config.credential?.type === 'oauth') {
    config.credential.expiresAt = '2999-07-27T10:00:00.000Z'
  }
  return config
}

function switchedOauthConfig(
  server = 'https://other-luna.example.test',
): StoredLunaConfig {
  return {
    ...activeOauthConfig(),
    server,
    credential: {
      type: 'oauth',
      accessToken: 'access-other-login',
      refreshToken: 'refresh-other-login',
      tokenType: 'Bearer',
      expiresAt: '2999-08-01T00:00:00.000Z',
      createdAt: '2999-07-31T23:00:00.000Z',
    },
  }
}

function oauthClient(
  refreshOAuthCredential: NonNullable<ConstructorParameters<typeof LunaApiAdapter>[0]['oauthClient']>['refreshOAuthCredential'],
) {
  return {
    beginOAuthLogin: async () => {
      throw new Error('not used')
    },
    refreshOAuthCredential,
    revokeOAuthCredential: async () => {},
  }
}

function refreshedCredential() {
  return {
    accessToken: 'access-refreshed',
    refreshToken: 'refresh-rotated',
    tokenType: 'Bearer',
    expiresAt: '2999-07-27T11:00:00.000Z',
  }
}

function unauthorizedResult(requestId: string, code = 'unauthenticated') {
  return {
    ok: false as const,
    status: 401,
    requestId,
    error: {
      code,
      message: 'Authentication is required.',
      status: 401,
      retryable: false,
      requestId,
      details: {},
    },
  }
}

function deferred<T>(): {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}
