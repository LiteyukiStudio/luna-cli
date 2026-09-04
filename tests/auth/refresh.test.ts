import type { OAuthTokenCredential } from '../../src/auth/oauth.js'
import type { LunaConfigDocument } from '../../src/commands/types.js'
import type { StoredLunaConfig } from '../../src/config/schema.js'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  refreshStoredOAuthCredential,
  storeValidatedOAuthCredential,
} from '../../src/auth/index.js'
import { CliCommandError } from '../../src/commands/errors.js'
import { FileConfigStore } from '../../src/config/store.js'
import { MemoryConfigStore } from '../config/memory-store.js'

const NOW = Date.parse('2030-01-01T00:00:00.000Z')
const EXPIRED_AT = '2029-12-31T23:59:00.000Z'
const VALID_UNTIL = '2030-01-01T01:00:00.000Z'
const REFRESHED_UNTIL = '2030-01-02T00:00:00.000Z'
const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(directory =>
      rm(directory, { force: true, recursive: true })),
  )
})

describe('stored OAuth refresh', () => {
  it('leaves a valid credential unchanged during automatic refresh', async () => {
    const store = new MemoryConfigStore(oauthConfig(VALID_UNTIL))
    const refresh = vi.fn(async () => refreshedCredential())

    const result = await refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })

    expect(result).toMatchObject({
      outcome: 'unchanged',
      refreshed: false,
      coalesced: false,
      refreshable: true,
    })
    expect(refresh).not.toHaveBeenCalled()
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v1',
      expiresAt: VALID_UNTIL,
    })
  })

  it('refreshes an expired credential automatically', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const refresh = vi.fn(async () => refreshedCredential())

    const result = await refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })

    expect(result).toMatchObject({
      outcome: 'refreshed',
      refreshed: true,
      coalesced: false,
      expiresAt: REFRESHED_UNTIL,
    })
    expect(refresh).toHaveBeenCalledOnce()
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v2',
      refreshToken: 'refresh-v2',
      expiresAt: REFRESHED_UNTIL,
    })
  })

  it('forces a manual refresh while the access token is still valid', async () => {
    const store = new MemoryConfigStore(oauthConfig(VALID_UNTIL))
    const refresh = vi.fn(async () => refreshedCredential())

    const result = await refreshStoredOAuthCredential(store, {
      env: {},
      force: true,
      refresh,
      now: () => NOW,
    })

    expect(result.outcome).toBe('refreshed')
    expect(refresh).toHaveBeenCalledOnce()
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v2',
      expiresAt: REFRESHED_UNTIL,
    })
  })

  it('blocks reuse of a refresh token after an ambiguous refresh failure', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const refresh = vi.fn(async () => {
      throw new CliCommandError(
        'oauth_network_error',
        'The OAuth server could not be reached.',
        { status: 502, retryable: true },
      )
    })

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).rejects.toMatchObject({
      code: 'oauth_refresh_reauthentication_required',
      status: 401,
      retryable: false,
      details: {
        causeCode: 'oauth_network_error',
        failedAt: '2030-01-01T00:00:00.000Z',
        remediation: 'luna login',
      },
    })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v1',
      refreshToken: 'refresh-v1',
      refreshState: {
        code: 'oauth_refresh_outcome_unknown',
        state: 'reauthentication_required',
        updatedAt: '2030-01-01T00:00:00.000Z',
      },
    })

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).rejects.toMatchObject({
      code: 'oauth_refresh_reauthentication_required',
    })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('treats a generic proxy 5xx response as an ambiguous refresh outcome', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const refresh = vi.fn(async () => {
      throw new CliCommandError(
        'oauth_request_failed',
        'The OAuth request failed.',
        { status: 502, retryable: true },
      )
    })

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).rejects.toMatchObject({
      code: 'oauth_refresh_reauthentication_required',
      details: {
        causeCode: 'oauth_request_failed',
        refreshDisposition: 'ambiguous',
      },
    })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      refreshState: {
        code: 'oauth_refresh_outcome_unknown',
        state: 'reauthentication_required',
      },
    })
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('allows a later retry after an explicit temporarily-unavailable response', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const refresh = vi.fn()
      .mockRejectedValueOnce(new CliCommandError(
        'oauth_temporarily_unavailable',
        'The OAuth request failed.',
        { status: 503, retryable: true },
      ))
      .mockResolvedValueOnce(refreshedCredential())

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).rejects.toMatchObject({ code: 'oauth_temporarily_unavailable' })
    expect(store.value.credential?.type === 'oauth'
      ? store.value.credential.refreshState
      : undefined).toBeUndefined()

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).resolves.toMatchObject({ outcome: 'refreshed' })
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('allows a later retry when the request could not connect to the server', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const connectionError = Object.assign(new Error('connection refused'), {
      code: 'ECONNREFUSED',
    })
    const refresh = vi.fn()
      .mockRejectedValueOnce(new CliCommandError(
        'oauth_network_error',
        'The OAuth server could not be reached.',
        { status: 502, retryable: true, cause: connectionError },
      ))
      .mockResolvedValueOnce(refreshedCredential())

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).rejects.toMatchObject({ code: 'oauth_network_error' })
    expect(store.value.credential?.type === 'oauth'
      ? store.value.credential.refreshState
      : undefined).toBeUndefined()

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).resolves.toMatchObject({ outcome: 'refreshed' })
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('does not reuse the old refresh token after the refreshed credential cannot be saved', async () => {
    const store = new FailingCommitConfigStore(oauthConfig(EXPIRED_AT))
    const refresh = vi.fn(async () => refreshedCredential())

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).rejects.toMatchObject({
      code: 'oauth_refresh_reauthentication_required',
      details: {
        causeCode: 'oauth_refresh_persist_failed',
        refreshDisposition: 'ambiguous',
      },
    })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v1',
      refreshToken: 'refresh-v1',
      refreshState: {
        code: 'oauth_refresh_in_progress',
        state: 'in_progress',
      },
    })

    await expect(refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })).rejects.toMatchObject({
      code: 'oauth_refresh_reauthentication_required',
    })
    expect(refresh).toHaveBeenCalledOnce()
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      refreshState: {
        code: 'oauth_refresh_outcome_unknown',
        state: 'reauthentication_required',
      },
    })
  })

  it('does not refresh stored OAuth when LUNA_TOKEN is active', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const refresh = vi.fn(async () => refreshedCredential())

    const result = await refreshStoredOAuthCredential(store, {
      env: { LUNA_TOKEN: 'environment-override' },
      refresh,
      now: () => NOW,
    })

    expect(result).toMatchObject({
      outcome: 'unavailable',
      refreshed: false,
      refreshable: false,
    })
    expect(refresh).not.toHaveBeenCalled()
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v1',
      expiresAt: EXPIRED_AT,
    })
    expect(JSON.stringify(result)).not.toContain('environment-override')
  })

  it('does not forward a stored refresh token to a cross-origin server override', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const refresh = vi.fn(async () => refreshedCredential())

    const result = await refreshStoredOAuthCredential(store, {
      env: {},
      server: 'https://other.example.com',
      refresh,
      now: () => NOW,
    })

    expect(result).toMatchObject({
      outcome: 'unavailable',
      refreshed: false,
      server: 'https://other.example.com',
    })
    expect(refresh).not.toHaveBeenCalled()
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v1',
      refreshToken: 'refresh-v1',
    })
  })

  it('coalesces concurrent refreshes for one in-memory store', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const pending = deferred<OAuthTokenCredential>()
    const refresh = vi.fn(async () => pending.promise)

    const first = refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    const second = refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })
    pending.resolve(refreshedCredential())

    const results = await Promise.all([first, second])

    expect(refresh).toHaveBeenCalledOnce()
    expect(results.map(result => result.outcome).sort()).toEqual([
      'coalesced',
      'refreshed',
    ])
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v2',
      refreshToken: 'refresh-v2',
    })
  })

  it('preserves project and language changes made while refresh is in flight', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const pending = deferred<OAuthTokenCredential>()
    const refresh = vi.fn(async () => pending.promise)
    const operation = refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())

    const latest = await store.read()
    await store.write({
      ...latest,
      language: 'en',
      project: {
        id: 'project-2',
        name: 'Project Two',
        identifier: 'project-two',
      },
    })
    pending.resolve(refreshedCredential())

    await expect(operation).resolves.toMatchObject({ outcome: 'refreshed' })
    expect(store.value.language).toBe('en')
    expect(store.value.project).toEqual({
      id: 'project-2',
      name: 'Project Two',
      identifier: 'project-two',
    })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v2',
    })
  })

  it('does not overwrite a new login with an older in-flight refresh response', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const pending = deferred<OAuthTokenCredential>()
    const refresh = vi.fn(async () => pending.promise)
    const operation = refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())

    await store.write({
      ...await store.read(),
      credential: {
        type: 'oauth',
        accessToken: 'access-from-new-login',
        refreshToken: 'refresh-from-new-login',
        expiresAt: VALID_UNTIL,
      },
    })
    pending.resolve(refreshedCredential())

    await expect(operation).resolves.toMatchObject({
      outcome: 'superseded',
      refreshed: false,
    })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-from-new-login',
      refreshToken: 'refresh-from-new-login',
      expiresAt: VALID_UNTIL,
    })
  })

  it('serializes a new login after an in-flight refresh', async () => {
    const store = new MemoryConfigStore(oauthConfig(EXPIRED_AT))
    const pending = deferred<OAuthTokenCredential>()
    const refresh = vi.fn(async () => pending.promise)
    const refreshOperation = refreshStoredOAuthCredential(store, {
      env: {},
      refresh,
      now: () => NOW,
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())

    const loginOperation = storeValidatedOAuthCredential(store, {
      server: 'https://devops.example.com',
      accessToken: 'access-from-new-login',
      refreshToken: 'refresh-from-new-login',
      expiresAt: VALID_UNTIL,
    })
    pending.resolve(refreshedCredential())

    await expect(refreshOperation).resolves.toMatchObject({ outcome: 'refreshed' })
    await expect(loginOperation).resolves.toMatchObject({
      credential: {
        type: 'oauth',
        accessToken: 'access-from-new-login',
        refreshToken: 'refresh-from-new-login',
      },
    })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-from-new-login',
      refreshToken: 'refresh-from-new-login',
      expiresAt: VALID_UNTIL,
    })
  })

  it('coalesces refreshes across file store instances using the same path', async () => {
    const directory = await temporaryDirectory()
    const configPath = path.join(directory, '.luna', 'auth.json')
    const firstStore = fileStore(configPath)
    const secondStore = fileStore(configPath)
    await firstStore.write(oauthConfig(EXPIRED_AT))
    const pending = deferred<OAuthTokenCredential>()
    const refresh = vi.fn(async () => pending.promise)

    const first = refreshStoredOAuthCredential(firstStore, {
      env: {},
      refresh,
      now: () => NOW,
    })
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    const second = refreshStoredOAuthCredential(secondStore, {
      env: {},
      refresh,
      now: () => NOW,
    })
    pending.resolve(refreshedCredential())

    const results = await Promise.all([first, second])

    expect(refresh).toHaveBeenCalledOnce()
    expect(results.map(result => result.outcome).sort()).toEqual([
      'coalesced',
      'refreshed',
    ])
    expect((await secondStore.read()).credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-v2',
      refreshToken: 'refresh-v2',
      expiresAt: REFRESHED_UNTIL,
    })
  })
})

function oauthConfig(expiresAt: string): StoredLunaConfig {
  return {
    version: 2,
    server: 'https://devops.example.com',
    credential: {
      type: 'oauth',
      accessToken: 'access-v1',
      refreshToken: 'refresh-v1',
      tokenType: 'Bearer',
      expiresAt,
    },
    project: {
      id: 'project-1',
      name: 'Project One',
      identifier: 'project-one',
    },
    language: 'zh-CN',
    output: 'json',
  }
}

function refreshedCredential(): OAuthTokenCredential {
  return {
    accessToken: 'access-v2',
    refreshToken: 'refresh-v2',
    tokenType: 'Bearer',
    expiresAt: REFRESHED_UNTIL,
  }
}

function fileStore(configPath: string): FileConfigStore {
  return new FileConfigStore({
    configPath,
    lockRetryMs: 1,
    lockTimeoutMs: 1_000,
    refreshLockTimeoutMs: 1_000,
  })
}

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'luna-cli-refresh-'))
  temporaryDirectories.push(directory)
  return directory
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

class FailingCommitConfigStore extends MemoryConfigStore {
  #writes = 0

  override async write(config: LunaConfigDocument): Promise<void> {
    this.#writes += 1
    if (this.#writes === 2)
      throw new Error('simulated credential persistence failure')
    await super.write(config)
  }
}
