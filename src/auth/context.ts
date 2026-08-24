import type { ResolvedRuntimeContext } from '../config/resolve.js'
import type { OAuthTokenCredential } from './oauth.js'
import { createHash } from 'node:crypto'
import { CliCommandError } from '../commands/errors.js'

export interface AuthenticationContext {
  readonly server: string
  readonly source: ResolvedRuntimeContext['sources']['credential']
  readonly credential?:
    | {
      readonly type: 'access_token'
      readonly tokenFingerprint: string
      readonly createdAt?: string
      readonly userId?: string
    }
    | {
      readonly type: 'oauth'
      readonly accessTokenFingerprint: string
      readonly refreshTokenFingerprint?: string
      readonly createdAt?: string
      readonly userId?: string
    }
}

export function authenticationContext(
  runtime: ResolvedRuntimeContext,
): AuthenticationContext {
  const credential = runtime.credential
  return {
    server: runtime.server,
    source: runtime.sources.credential,
    ...(credential?.type === 'oauth'
      ? {
          credential: {
            type: 'oauth' as const,
            accessTokenFingerprint: tokenFingerprint(credential.accessToken),
            ...(credential.refreshToken
              ? { refreshTokenFingerprint: tokenFingerprint(credential.refreshToken) }
              : {}),
            ...(credential.createdAt ? { createdAt: credential.createdAt } : {}),
            ...(credential.user?.id ? { userId: credential.user.id } : {}),
          },
        }
      : credential?.type === 'access_token'
        ? {
            credential: {
              type: 'access_token' as const,
              tokenFingerprint: tokenFingerprint(credential.token),
              ...(credential.createdAt ? { createdAt: credential.createdAt } : {}),
              ...(credential.user?.id ? { userId: credential.user.id } : {}),
            },
          }
        : {}),
  }
}

export function sameAuthenticationContext(
  left: AuthenticationContext,
  right: AuthenticationContext,
): boolean {
  if (left.server !== right.server || left.source !== right.source)
    return false
  if (!left.credential || !right.credential)
    return left.credential === right.credential
  if (left.credential.type !== right.credential.type)
    return false
  if (left.credential.type === 'access_token') {
    return right.credential.type === 'access_token'
      && left.credential.tokenFingerprint === right.credential.tokenFingerprint
      && left.credential.createdAt === right.credential.createdAt
      && left.credential.userId === right.credential.userId
  }
  return right.credential.type === 'oauth'
    && left.credential.accessTokenFingerprint === right.credential.accessTokenFingerprint
    && left.credential.refreshTokenFingerprint === right.credential.refreshTokenFingerprint
    && left.credential.createdAt === right.credential.createdAt
    && left.credential.userId === right.credential.userId
}

export function assertAuthenticationTransition(
  initial: AuthenticationContext,
  current: AuthenticationContext,
  issuedCredential: OAuthTokenCredential | undefined,
  details: {
    readonly stage: string
    readonly requestId?: string
    readonly refreshOutcome: string
  },
): void {
  if (
    sameAuthenticationContext(initial, current)
    || isIssuedOAuthTransition(initial, current, issuedCredential)
    || (
      details.refreshOutcome === 'coalesced'
      && isSameOAuthLineage(initial, current)
    )
  ) {
    return
  }
  throw authenticationContextChanged(details)
}

export function authenticationContextChanged(
  details: Readonly<Record<string, unknown>>,
): CliCommandError {
  return new CliCommandError(
    'auth_context_changed',
    'Authentication context changed while the command was in progress.',
    {
      status: 409,
      retryable: true,
      details: {
        ...details,
        remediation: 'Review the active server and login, then run the command again.',
      },
    },
  )
}

function isIssuedOAuthTransition(
  initial: AuthenticationContext,
  current: AuthenticationContext,
  issuedCredential: OAuthTokenCredential | undefined,
): boolean {
  if (
    !issuedCredential
    || initial.server !== current.server
    || initial.source !== 'config'
    || current.source !== 'config'
    || initial.credential?.type !== 'oauth'
    || current.credential?.type !== 'oauth'
  ) {
    return false
  }
  const accessToken = issuedCredential.accessToken.trim()
  const refreshToken = issuedCredential.refreshToken?.trim()
  const refreshTokenFingerprint = refreshToken
    ? tokenFingerprint(refreshToken)
    : initial.credential.refreshTokenFingerprint
  return Boolean(accessToken)
    && current.credential.accessTokenFingerprint === tokenFingerprint(accessToken)
    && current.credential.refreshTokenFingerprint === refreshTokenFingerprint
    && current.credential.createdAt === initial.credential.createdAt
    && current.credential.userId === initial.credential.userId
}

function tokenFingerprint(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function isSameOAuthLineage(
  initial: AuthenticationContext,
  current: AuthenticationContext,
): boolean {
  return initial.server === current.server
    && initial.source === 'config'
    && current.source === 'config'
    && initial.credential?.type === 'oauth'
    && current.credential?.type === 'oauth'
    && initial.credential.createdAt !== undefined
    && initial.credential.createdAt === current.credential.createdAt
    && initial.credential.userId === current.credential.userId
}
