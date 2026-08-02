import { describe, expect, it } from 'vitest'
import {
  assertOAuthScopes,
  scopeAllows,
  withOAuthScopeRemediation,
} from '../../src/auth/scope-preflight.js'
import { CliCommandError } from '../../src/commands/errors.js'

describe('oauth scope preflight', () => {
  it('supports exact, global, and resource wildcard scopes', () => {
    expect(scopeAllows('project:read', 'project:read')).toBe(true)
    expect(scopeAllows('project:*', 'project:write')).toBe(true)
    expect(scopeAllows('*', 'deployment:data_export')).toBe(true)
    expect(scopeAllows('project:read', 'project:write')).toBe(false)
  })

  it('reports missing scopes and a reauthorization command', () => {
    expect(() => assertOAuthScopes({
      type: 'oauth',
      accessToken: 'access-token',
      scopes: ['project:read'],
    }, 'config', ['project:write', 'project:read'])).toThrowError(
      expect.objectContaining({
        code: 'oauth_scope_required',
        status: 403,
        details: expect.objectContaining({
          missingScopes: ['project:write'],
          remediation: 'luna login scope=project:read scope=project:write',
        }),
      }),
    )
  })

  it('defers to the server when the credential scopes are unknown', () => {
    expect(() => assertOAuthScopes({
      type: 'oauth',
      accessToken: 'legacy-access-token',
      scopes: [],
    }, 'config', ['project:write'])).not.toThrow()
    expect(() => assertOAuthScopes({
      type: 'access_token',
      token: 'personal-access-token',
      scopes: [],
    }, 'config', ['project:write'])).not.toThrow()
  })

  it('turns a stable server scope error into OAuth reauthorization guidance', () => {
    const result = withOAuthScopeRemediation(
      new CliCommandError(
        'auth.token.scope_insufficient',
        'Insufficient scope.',
        {
          status: 403,
          details: { requiredScope: 'deployment:data_export' },
        },
      ),
      {
        type: 'oauth',
        accessToken: 'access-token',
        scopes: ['project:read'],
      },
      'config',
    )

    expect(result).toMatchObject({
      code: 'oauth_scope_required',
      status: 403,
      details: {
        missingScopes: ['deployment:data_export'],
        grantedScopes: ['project:read'],
        remediation: 'luna login scope=deployment:data_export scope=project:read',
      },
    })
  })

  it('keeps personal access token scope errors unchanged', () => {
    const error = new CliCommandError(
      'auth.token.scope_insufficient',
      'Insufficient scope.',
      {
        status: 403,
        details: { requiredScope: 'deployment:data_export' },
      },
    )

    expect(withOAuthScopeRemediation(
      error,
      {
        type: 'access_token',
        token: 'personal-access-token',
        scopes: ['project:read'],
      },
      'config',
    )).toBe(error)
  })
})
