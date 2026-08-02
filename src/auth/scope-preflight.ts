import type { ResolutionSource } from '../config/resolve.js'
import type { LunaCredential } from '../config/schema.js'
import { CliCommandError } from '../commands/errors.js'

export function scopeAllows(grantedScope: string, requiredScope: string): boolean {
  const granted = grantedScope.trim()
  const required = requiredScope.trim()
  if (!granted || !required)
    return false
  if (granted === '*' || granted === required)
    return true
  if (!granted.endsWith(':*'))
    return false
  return required.startsWith(granted.slice(0, -1))
}

export function assertOAuthScopes(
  credential: LunaCredential | undefined,
  credentialSource: ResolutionSource,
  requiredScopes: readonly string[],
): void {
  if (
    credentialSource !== 'config'
    || credential?.type !== 'oauth'
    || requiredScopes.length === 0
    || credential.scopes.length === 0
  ) {
    return
  }

  const grantedScopes = uniqueScopes(credential.scopes)
  const missingScopes = uniqueScopes(requiredScopes).filter(required =>
    !grantedScopes.some(granted => scopeAllows(granted, required)))
  if (missingScopes.length === 0)
    return

  throw oauthScopeRequiredError(grantedScopes, missingScopes)
}

export function withOAuthScopeRemediation(
  error: CliCommandError,
  credential: LunaCredential | undefined,
  credentialSource: ResolutionSource,
): CliCommandError {
  if (
    error.code !== 'auth.token.scope_insufficient'
    || credentialSource !== 'config'
    || credential?.type !== 'oauth'
  ) {
    return error
  }

  const requiredScope = stringDetail(error.details.requiredScope)
  if (!requiredScope)
    return error

  const grantedScopes = uniqueScopes(credential.scopes)
  if (grantedScopes.some(granted => scopeAllows(granted, requiredScope)))
    return error

  return oauthScopeRequiredError(grantedScopes, [requiredScope])
}

function oauthScopeRequiredError(
  grantedScopes: readonly string[],
  missingScopes: readonly string[],
): CliCommandError {
  const normalizedMissingScopes = uniqueScopes(missingScopes)
  const requestedScopes = uniqueScopes([...grantedScopes, ...normalizedMissingScopes])
  return new CliCommandError(
    'oauth_scope_required',
    `The current OAuth grant is missing required scopes: ${normalizedMissingScopes.join(', ')}.`,
    {
      status: 403,
      details: {
        missingScopes: normalizedMissingScopes,
        grantedScopes,
        remediation: `luna login ${requestedScopes.map(scope => `scope=${scope}`).join(' ')}`,
      },
    },
  )
}

function uniqueScopes(scopes: readonly string[]): string[] {
  return [...new Set(scopes.map(scope => scope.trim()).filter(Boolean))].sort()
}

function stringDetail(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}
