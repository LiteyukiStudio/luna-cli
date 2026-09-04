import type { ConfigPort } from '../commands/types.js'
import type { OAuthCredential } from '../config/schema.js'
import type {
  OAuthRefreshRequest,
  OAuthTokenCredential,
} from './oauth.js'
import { CliCommandError, toCliCommandError } from '../commands/errors.js'
import { resolveRuntimeContext } from '../config/resolve.js'
import { parseConfigDocument } from '../config/schema.js'
import {
  updateConfig,
  withCredentialRefreshLock,
} from '../config/store.js'
import { assertIsoDate } from './validation.js'

export const OAUTH_REFRESH_SKEW_MS = 30_000
export const DEFAULT_OAUTH_REFRESH_TIMEOUT_MS = 30_000

export type OAuthRefreshOutcome
  = | 'unchanged'
    | 'refreshed'
    | 'coalesced'
    | 'superseded'
    | 'unavailable'

export interface RefreshStoredOAuthOptions {
  readonly refresh?: (
    request: OAuthRefreshRequest,
  ) => Promise<OAuthTokenCredential>
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly server?: string
  readonly force?: boolean
  readonly required?: boolean
  readonly expectedAccessToken?: string
  readonly timeoutMs?: number
  readonly now?: () => number
}

export interface RefreshStoredOAuthResult {
  readonly outcome: OAuthRefreshOutcome
  readonly refreshed: boolean
  readonly coalesced: boolean
  readonly refreshable: boolean
  readonly server: string
  readonly expiresAt?: string
}

export async function refreshStoredOAuthCredential(
  store: ConfigPort,
  options: RefreshStoredOAuthOptions = {},
): Promise<RefreshStoredOAuthResult> {
  const observedConfig = parseConfigDocument(await store.read())
  const observed = activeStoredOAuth(observedConfig, options)
  if (!observed)
    return unavailableResult(options, observedConfig)
  assertRefreshAllowed(observed)
  const refreshWasInProgress = isRefreshInProgress(observed)

  if (
    !refreshWasInProgress
    && options.expectedAccessToken
    && observed.credential.accessToken !== options.expectedAccessToken
  ) {
    return resultFor('coalesced', observed)
  }
  if (
    !options.force
    && !refreshWasInProgress
    && !oauthCredentialNeedsRefresh(
      observed.credential.expiresAt,
      options.now?.() ?? Date.now(),
    )
  ) {
    return resultFor('unchanged', observed)
  }

  return withCredentialRefreshLock(store, async () => {
    const current = activeStoredOAuth(
      parseConfigDocument(await store.read()),
      options,
    )
    if (!current)
      return resultFor('superseded', observed, false)
    assertRefreshAllowed(current)
    if (isRefreshInProgress(current)) {
      const updatedAt = current.credential.refreshState!.updatedAt
      const blocked = await transitionRefreshState(
        store,
        options,
        current,
        { state: 'in_progress', updatedAt },
        {
          code: 'oauth_refresh_outcome_unknown',
          state: 'reauthentication_required',
          updatedAt,
        },
      )
      if (!blocked)
        return supersededResult(store, options, current)
      throw refreshReauthenticationRequired(
        'oauth_refresh_outcome_unknown',
        updatedAt,
        undefined,
        'ambiguous',
      )
    }
    if (
      options.expectedAccessToken
      && current.credential.accessToken !== options.expectedAccessToken
    ) {
      return resultFor('coalesced', current)
    }
    if (!sameGeneration(current, observed))
      return resultFor('coalesced', current)
    if (
      !options.force
      && !oauthCredentialNeedsRefresh(
        current.credential.expiresAt,
        options.now?.() ?? Date.now(),
      )
    ) {
      return resultFor('coalesced', current)
    }
    if (!current.credential.refreshToken) {
      throw new CliCommandError(
        'oauth_refresh_token_required',
        'The stored OAuth credential cannot be refreshed because it has no refresh token.',
        { status: 401 },
      )
    }
    if (!options.refresh) {
      throw new CliCommandError(
        'oauth_refresh_unsupported',
        'The current CLI runtime cannot refresh OAuth credentials.',
        { status: 501 },
      )
    }

    const attemptAt = new Date(options.now?.() ?? Date.now()).toISOString()
    const prepared = await transitionRefreshState(
      store,
      options,
      current,
      undefined,
      {
        code: 'oauth_refresh_in_progress',
        state: 'in_progress',
        updatedAt: attemptAt,
      },
    )
    if (!prepared)
      return supersededResult(store, options, current)

    let nextCredential: OAuthCredential
    try {
      const refreshed = await options.refresh({
        server: current.server,
        refreshToken: current.credential.refreshToken,
        timeoutMs: options.timeoutMs ?? DEFAULT_OAUTH_REFRESH_TIMEOUT_MS,
      })
      nextCredential = refreshedCredential(current.credential, refreshed)
    }
    catch (error) {
      const normalized = toCliCommandError(error)
      const disposition = refreshFailureDisposition(normalized)
      const causeCode = safeErrorCode(normalized.code)
      if (disposition === 'retryable') {
        let cleared: boolean
        try {
          cleared = await transitionRefreshState(
            store,
            options,
            current,
            { state: 'in_progress', updatedAt: attemptAt },
            undefined,
          )
        }
        catch (clearError) {
          throw refreshReauthenticationRequired(
            'oauth_refresh_state_persist_failed',
            attemptAt,
            clearError,
            'ambiguous',
          )
        }
        if (!cleared)
          return supersededResult(store, options, current)
        throw error
      }

      const markerCode = disposition === 'reauthenticate'
        ? 'oauth_refresh_rejected'
        : 'oauth_refresh_outcome_unknown'
      let blocked: boolean
      try {
        blocked = await transitionRefreshState(
          store,
          options,
          current,
          { state: 'in_progress', updatedAt: attemptAt },
          {
            code: markerCode,
            state: 'reauthentication_required',
            updatedAt: attemptAt,
          },
        )
      }
      catch (persistError) {
        throw refreshReauthenticationRequired(
          'oauth_refresh_state_persist_failed',
          attemptAt,
          persistError,
          'ambiguous',
        )
      }
      if (!blocked)
        return supersededResult(store, options, current)
      throw refreshReauthenticationRequired(
        causeCode,
        attemptAt,
        error,
        disposition,
      )
    }
    let committed = false
    try {
      await updateConfig(store, (latest) => {
        const latestActive = activeStoredOAuth(latest, options)
        if (
          !latestActive
          || !sameGeneration(latestActive, current)
          || !refreshStateMatches(
            latestActive.credential,
            { state: 'in_progress', updatedAt: attemptAt },
          )
        ) {
          return
        }
        latest.credential = nextCredential
        committed = true
      })
    }
    catch (error) {
      const latest = await readActiveStoredOAuth(store, options)
      if (latest && sameCredential(latest.credential, nextCredential)) {
        return resultFor('refreshed', latest)
      }
      if (latest && !sameGeneration(latest, current))
        return resultFor('superseded', latest)
      throw refreshReauthenticationRequired(
        'oauth_refresh_persist_failed',
        attemptAt,
        error,
        'ambiguous',
      )
    }

    if (!committed)
      return supersededResult(store, options, current)
    return resultFor('refreshed', {
      server: current.server,
      credential: nextCredential,
    })
  })
}

export function oauthCredentialNeedsRefresh(
  expiresAt: string | undefined,
  now: number,
): boolean {
  if (!expiresAt)
    return false
  const expiresAtMs = Date.parse(expiresAt)
  return Number.isFinite(expiresAtMs)
    && expiresAtMs <= now + OAUTH_REFRESH_SKEW_MS
}

function refreshedCredential(
  current: OAuthCredential,
  refreshed: OAuthTokenCredential,
): OAuthCredential {
  const accessToken = refreshed.accessToken.trim()
  if (!accessToken) {
    throw new CliCommandError(
      'oauth_access_token_required',
      'The OAuth refresh response did not contain an access token.',
      { status: 502 },
    )
  }
  assertIsoDate(refreshed.expiresAt)
  return {
    ...current,
    accessToken,
    refreshToken: refreshed.refreshToken?.trim() || current.refreshToken,
    tokenType: refreshed.tokenType?.trim() || current.tokenType,
    expiresAt: refreshed.expiresAt,
    refreshState: undefined,
  }
}

interface ActiveStoredOAuth {
  readonly server: string
  readonly credential: OAuthCredential
}

type OAuthRefreshState = NonNullable<OAuthCredential['refreshState']>
type RefreshFailureDisposition = 'ambiguous' | 'reauthenticate' | 'retryable'

const RETRYABLE_OAUTH_ERROR_CODES = new Set([
  'oauth_server_error',
  'oauth_temporarily_unavailable',
])
const REAUTHENTICATION_OAUTH_ERROR_CODES = new Set([
  'oauth_access_denied',
  'oauth_expired_token',
  'oauth_invalid_client',
  'oauth_invalid_grant',
  'oauth_invalid_request',
  'oauth_invalid_scope',
  'oauth_invalid_token',
  'oauth_unauthorized_client',
  'oauth_unsupported_grant_type',
])
const PRECONNECT_NETWORK_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
])
const SAFE_ERROR_CODE_PATTERN = /^[\w.-]{1,64}$/u

function activeStoredOAuth(
  config: unknown,
  options: Pick<RefreshStoredOAuthOptions, 'env' | 'server'>,
): ActiveStoredOAuth | undefined {
  const runtime = resolveRuntimeContext(config, {
    server: options.server,
    env: options.env,
  })
  if (
    runtime.sources.credential !== 'config'
    || runtime.credential?.type !== 'oauth'
  ) {
    return undefined
  }
  return {
    server: runtime.server,
    credential: runtime.credential,
  }
}

function sameGeneration(
  left: ActiveStoredOAuth,
  right: ActiveStoredOAuth,
): boolean {
  return left.server === right.server
    && left.credential.accessToken === right.credential.accessToken
    && left.credential.refreshToken === right.credential.refreshToken
}

function sameCredential(left: OAuthCredential, right: OAuthCredential): boolean {
  return left.accessToken === right.accessToken
    && left.refreshToken === right.refreshToken
}

function isRefreshInProgress(active: ActiveStoredOAuth): boolean {
  return active.credential.refreshState?.state === 'in_progress'
}

async function readActiveStoredOAuth(
  store: ConfigPort,
  options: Pick<RefreshStoredOAuthOptions, 'env' | 'server'>,
): Promise<ActiveStoredOAuth | undefined> {
  return activeStoredOAuth(parseConfigDocument(await store.read()), options)
}

async function transitionRefreshState(
  store: ConfigPort,
  options: Pick<RefreshStoredOAuthOptions, 'env' | 'server'>,
  current: ActiveStoredOAuth,
  expected: Pick<OAuthRefreshState, 'state' | 'updatedAt'> | undefined,
  next: OAuthRefreshState | undefined,
): Promise<boolean> {
  let transitioned = false
  await updateConfig(store, (latest) => {
    const latestActive = activeStoredOAuth(latest, options)
    if (
      !latestActive
      || !sameGeneration(latestActive, current)
      || !refreshStateMatches(latestActive.credential, expected)
    ) {
      return
    }
    latest.credential = {
      ...latestActive.credential,
      refreshState: next,
    }
    transitioned = true
  })
  return transitioned
}

function refreshStateMatches(
  credential: OAuthCredential,
  expected: Pick<OAuthRefreshState, 'state' | 'updatedAt'> | undefined,
): boolean {
  if (!expected)
    return credential.refreshState === undefined
  return credential.refreshState?.state === expected.state
    && credential.refreshState.updatedAt === expected.updatedAt
}

async function supersededResult(
  store: ConfigPort,
  options: Pick<RefreshStoredOAuthOptions, 'env' | 'server'>,
  previous: ActiveStoredOAuth,
): Promise<RefreshStoredOAuthResult> {
  const latest = await readActiveStoredOAuth(store, options)
  if (!latest)
    return resultFor('superseded', previous, false)
  assertRefreshAllowed(latest)
  if (sameGeneration(latest, previous)) {
    const updatedAt = latest.credential.refreshState?.updatedAt
      ?? new Date().toISOString()
    throw refreshReauthenticationRequired(
      'oauth_refresh_outcome_unknown',
      updatedAt,
      undefined,
      'ambiguous',
    )
  }
  return resultFor('superseded', latest)
}

function refreshFailureDisposition(error: CliCommandError): RefreshFailureDisposition {
  if (RETRYABLE_OAUTH_ERROR_CODES.has(error.code))
    return 'retryable'
  if (REAUTHENTICATION_OAUTH_ERROR_CODES.has(error.code))
    return 'reauthenticate'
  if (error.code === 'oauth_network_error') {
    const networkCode = nestedErrorCode(error.cause)
    return networkCode && PRECONNECT_NETWORK_ERROR_CODES.has(networkCode)
      ? 'retryable'
      : 'ambiguous'
  }
  return 'ambiguous'
}

function nestedErrorCode(value: unknown, depth = 0): string | undefined {
  if (depth > 3 || typeof value !== 'object' || value === null)
    return undefined
  const record = value as Readonly<Record<string, unknown>>
  if (typeof record.code === 'string')
    return record.code
  return nestedErrorCode(record.cause, depth + 1)
}

function safeErrorCode(code: string): string {
  return SAFE_ERROR_CODE_PATTERN.test(code) ? code : 'oauth_request_failed'
}

function assertRefreshAllowed(active: ActiveStoredOAuth): void {
  const state = active.credential.refreshState
  if (state?.state !== 'reauthentication_required')
    return
  throw refreshReauthenticationRequired(
    state.code,
    state.updatedAt,
    undefined,
    state.code === 'oauth_refresh_rejected' ? 'reauthenticate' : 'ambiguous',
  )
}

function refreshReauthenticationRequired(
  causeCode: string,
  failedAt: string,
  cause?: unknown,
  disposition: Exclude<RefreshFailureDisposition, 'retryable'> = 'ambiguous',
): CliCommandError {
  return new CliCommandError(
    'oauth_refresh_reauthentication_required',
    'The previous OAuth refresh did not complete safely. Sign in again before continuing.',
    {
      status: 401,
      retryable: false,
      details: {
        causeCode,
        failedAt,
        refreshDisposition: disposition,
        remediation: 'luna login',
      },
      cause,
    },
  )
}

function resultFor(
  outcome: OAuthRefreshOutcome,
  active: ActiveStoredOAuth,
  refreshable = Boolean(active.credential.refreshToken),
): RefreshStoredOAuthResult {
  return {
    outcome,
    refreshed: outcome === 'refreshed',
    coalesced: outcome === 'coalesced',
    refreshable: refreshable
      && active.credential.refreshState?.state !== 'reauthentication_required',
    server: active.server,
    expiresAt: active.credential.expiresAt,
  }
}

function unavailableResult(
  options: RefreshStoredOAuthOptions,
  config: unknown,
): RefreshStoredOAuthResult {
  const runtime = resolveRuntimeContext(config, {
    server: options.server,
    env: options.env,
  })
  if (options.required) {
    throw new CliCommandError(
      'oauth_refresh_unavailable',
      'The active credential is not a refreshable OAuth credential.',
      { status: 401 },
    )
  }
  return {
    outcome: 'unavailable',
    refreshed: false,
    coalesced: false,
    refreshable: false,
    server: runtime.server,
  }
}
