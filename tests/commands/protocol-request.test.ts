import type {
  CommandExecutionGlobals,
  CommandInvocation,
  RuntimePorts,
} from '../../src/commands/types.js'
import type { StoredLunaConfig } from '../../src/config/schema.js'
import { describe, expect, it, vi } from 'vitest'
import { authenticationContext } from '../../src/auth/context.js'
import { openProtocolRequest } from '../../src/commands/protocol-request.js'
import { normalizeMetadata } from '../../src/commands/registry.js'
import { resolveRuntimeContext } from '../../src/config/resolve.js'
import { MemoryConfigStore } from '../config/memory-store.js'

describe('protocol request OAuth refresh', () => {
  it('uses the shared automatic refresh before opening a protocol response', async () => {
    const store = new MemoryConfigStore({
      version: 2,
      server: 'https://luna.example.test',
      credential: {
        type: 'oauth',
        accessToken: 'access-expired',
        refreshToken: 'refresh-original',
        expiresAt: '2020-01-01T00:00:00.000Z',
      },
      project: null,
      language: '',
      output: '',
    })
    const refresh = vi.fn(async () => ({
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-rotated',
      expiresAt: '2999-01-01T00:00:00.000Z',
    }))
    const authorizations: string[] = []
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      authorizations.push(new Headers(init?.headers).get('authorization') ?? '')
      return new Response('{}', {
        headers: { 'content-type': 'application/json' },
      })
    })
    const ports: RuntimePorts = {
      config: store,
      input: { parse: async () => ({}) },
      output: {
        writeSuccess: () => undefined,
        writeError: () => undefined,
      },
      api: {
        execute: async () => ({}),
        request: async () => ({}),
        refreshOAuthCredential: refresh,
      },
      protocol: { fetch: fetch as typeof globalThis.fetch },
      env: {},
    }

    const result = await openProtocolRequest(invocation(), ports, 'application/json')

    expect(result.response.status).toBe(200)
    expect(refresh).toHaveBeenCalledOnce()
    expect(authorizations).toEqual(['Bearer access-refreshed'])
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-rotated',
    })
  })

  it('rejects a server or login switch captured before protocol execution', async () => {
    const initial = oauthConfig('access-original', 'refresh-original', '2026-01-01T00:00:00.000Z')
    const switched = {
      ...oauthConfig('access-other', 'refresh-other', '2026-02-01T00:00:00.000Z'),
      server: 'https://other.example.test',
    }
    const store = new MemoryConfigStore(switched)
    const refresh = vi.fn()
    const fetch = vi.fn()
    const ports = protocolPorts(store, refresh, fetch)

    await expect(openProtocolRequest(
      invocation(authenticationContext(resolveRuntimeContext(initial, { env: {} }))),
      ports,
      'application/json',
    )).rejects.toMatchObject({
      code: 'auth_context_changed',
      status: 409,
      details: expect.objectContaining({ stage: 'protocol_command_start' }),
    })
    expect(refresh).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('coalesces concurrent protocol refreshes for the same OAuth lineage', async () => {
    const initial = oauthConfig(
      'access-expired',
      'refresh-original',
      '2026-01-01T00:00:00.000Z',
      '2020-01-01T00:00:00.000Z',
    )
    const store = new MemoryConfigStore(initial)
    const pending = deferred<{
      accessToken: string
      refreshToken: string
      expiresAt: string
    }>()
    const refresh = vi.fn(async () => pending.promise)
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }))
    const ports = protocolPorts(store, refresh, fetch)
    const authentication = authenticationContext(resolveRuntimeContext(initial, { env: {} }))

    const first = openProtocolRequest(invocation(authentication), ports, 'application/json')
    const second = openProtocolRequest(invocation(authentication), ports, 'application/json')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    pending.resolve({
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-rotated',
      expiresAt: '2999-01-01T00:00:00.000Z',
    })

    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(refresh).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

const GLOBALS: CommandExecutionGlobals = {
  output: 'json',
  color: false,
  interactive: false,
  yes: true,
  quiet: false,
  agent: true,
  timeoutMs: 30_000,
  debug: false,
  insecureSkipTlsVerify: false,
}

function invocation(
  authentication?: CommandInvocation['authentication'],
): CommandInvocation {
  return {
    metadata: normalizeMetadata({
      category: 'build',
      tool: 'logs-follow',
      source: 'openapi',
      operationId: 'followBuildLogs',
      method: 'get',
      path: '/api/v1/builds/logs',
      transport: 'sse',
      scopes: ['build:read'],
    }),
    params: {},
    globals: { ...GLOBALS, server: 'https://luna.example.test' },
    explicitGlobalKeys: new Set(),
    canonicalGlobalValues: {},
    authentication,
  }
}

function oauthConfig(
  accessToken: string,
  refreshToken: string,
  createdAt: string,
  expiresAt = '2999-01-01T00:00:00.000Z',
): StoredLunaConfig {
  return {
    version: 2,
    server: 'https://luna.example.test',
    credential: {
      type: 'oauth',
      accessToken,
      refreshToken,
      createdAt,
      expiresAt,
    },
    project: null,
    language: '',
    output: '',
  }
}

function protocolPorts(
  store: MemoryConfigStore,
  refresh: NonNullable<RuntimePorts['api']['refreshOAuthCredential']>,
  fetch: typeof globalThis.fetch,
): RuntimePorts {
  return {
    config: store,
    input: { parse: async () => ({}) },
    output: {
      writeSuccess: () => undefined,
      writeError: () => undefined,
    },
    api: {
      execute: async () => ({}),
      request: async () => ({}),
      refreshOAuthCredential: refresh,
    },
    protocol: { fetch },
    env: {},
  }
}

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}
