import type { OAuthTokenCredential } from '../../src/auth/oauth.js'
import { describe, expect, it, vi } from 'vitest'

import {
  authenticationContext,
  logoutLocal,
  refreshStoredOAuthCredential,
  storeValidatedAccessToken,
  storeValidatedOAuthCredential,
} from '../../src/auth/index.js'
import { resolveRuntimeContext } from '../../src/config/resolve.js'
import { MemoryConfigStore } from '../config/memory-store.js'

describe('logoutLocal', () => {
  it('removes the active credential and project while preserving the server', async () => {
    const store = new MemoryConfigStore()
    await storeValidatedAccessToken(store, {
      server: 'https://devops.example.com',
      token: 'secret',
      project: { id: 'prj_example' },
    })

    const result = await logoutLocal(store)

    expect(result).toEqual({
      server: 'https://devops.example.com',
      loggedOut: true,
      remoteRevocation: 'not_applicable',
    })
    expect(store.value.credential).toBeNull()
    expect(store.value.project).toBeNull()
    expect(store.value.server).toBe('https://devops.example.com')
  })

  it('attempts to revoke every OAuth token and always clears local credentials', async () => {
    const store = new MemoryConfigStore()
    await storeValidatedOAuthCredential(store, {
      server: 'https://devops.example.com',
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    })
    const revoked: string[] = []

    const result = await logoutLocal(store, {
      revoke: async ({ token }) => {
        revoked.push(token)
        if (token === 'refresh-secret')
          throw new Error('remote unavailable')
      },
    })

    expect(revoked).toEqual(['refresh-secret', 'access-secret'])
    expect(result).toEqual({
      server: 'https://devops.example.com',
      loggedOut: true,
      remoteRevocation: 'failed',
    })
    expect(store.value.credential).toBeNull()
    expect(store.value.project).toBeNull()
  })

  it('waits for an in-flight refresh and revokes the latest token generation', async () => {
    const store = new MemoryConfigStore()
    await storeValidatedOAuthCredential(store, {
      server: 'https://devops.example.com',
      accessToken: 'access-v1',
      refreshToken: 'refresh-v1',
      expiresAt: '2029-01-01T00:00:00.000Z',
    })
    const pending = deferred<OAuthTokenCredential>()
    const refresh = vi.fn(async () => pending.promise)
    const refreshOperation = refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => Date.parse('2030-01-01T00:00:00.000Z'),
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())

    const revoked: string[] = []
    const logoutOperation = logoutLocal(store, {
      revoke: async ({ token }) => {
        revoked.push(token)
      },
    })
    pending.resolve({
      accessToken: 'access-v2',
      refreshToken: 'refresh-v2',
      scopes: [],
      expiresAt: '2030-01-02T00:00:00.000Z',
    })

    await expect(refreshOperation).resolves.toMatchObject({ outcome: 'refreshed' })
    await expect(logoutOperation).resolves.toMatchObject({
      loggedOut: true,
      remoteRevocation: 'succeeded',
    })
    expect(revoked).toEqual(['refresh-v2', 'access-v2'])
    expect(store.value.credential).toBeNull()
  })

  it('does not let an older logout delete a newer login', async () => {
    const store = new MemoryConfigStore({
      version: 2,
      server: 'https://devops.example.com',
      credential: {
        type: 'oauth',
        accessToken: 'access-v1',
        refreshToken: 'refresh-v1',
        scopes: [],
        createdAt: '2029-01-01T00:00:00.000Z',
        expiresAt: '2029-01-01T00:00:00.000Z',
      },
      project: null,
      language: '',
      output: '',
    })
    const expectedAuthentication = authenticationContext(resolveRuntimeContext(
      await store.read(),
      { env: {} },
    ))
    const pending = deferred<OAuthTokenCredential>()
    const refresh = vi.fn(async () => pending.promise)
    const refreshOperation = refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => Date.parse('2030-01-01T00:00:00.000Z'),
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())

    const loginOperation = storeValidatedOAuthCredential(store, {
      server: 'https://devops.example.com',
      accessToken: 'access-new-login',
      refreshToken: 'refresh-new-login',
      expiresAt: '2031-01-01T00:00:00.000Z',
    })
    const revoked: string[] = []
    const logoutOperation = logoutLocal(store, {
      expectedStoredAuthentication: expectedAuthentication,
      revoke: async ({ token }) => {
        revoked.push(token)
      },
    })
    pending.resolve({
      accessToken: 'access-v2',
      refreshToken: 'refresh-v2',
      scopes: [],
      expiresAt: '2030-01-02T00:00:00.000Z',
    })

    await expect(refreshOperation).resolves.toMatchObject({ outcome: 'refreshed' })
    await expect(loginOperation).resolves.toMatchObject({
      credential: { accessToken: 'access-new-login' },
    })
    await expect(logoutOperation).rejects.toMatchObject({
      code: 'auth_context_changed',
      details: expect.objectContaining({ stage: 'logout' }),
    })
    expect(revoked).toEqual([])
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-new-login',
      refreshToken: 'refresh-new-login',
    })
  })
})

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
