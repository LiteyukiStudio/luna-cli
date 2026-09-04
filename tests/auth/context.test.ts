import { describe, expect, it } from 'vitest'
import { authenticationContext } from '../../src/auth/context.js'
import { resolveRuntimeContext } from '../../src/config/resolve.js'
import { redactValue } from '../../src/errors/sanitize.js'

describe('authentication context', () => {
  it('captures token fingerprints without propagating credential values', () => {
    const context = authenticationContext(resolveRuntimeContext({
      version: 2,
      server: 'https://luna.example.test',
      credential: {
        type: 'oauth',
        accessToken: 'access-secret-value',
        refreshToken: 'refresh-secret-value',
        createdAt: '2030-01-01T00:00:00.000Z',
      },
      project: null,
      language: '',
      output: '',
    }, { env: {} }))

    expect(context).toMatchObject({
      server: 'https://luna.example.test',
      source: 'config',
      credential: {
        type: 'oauth',
        createdAt: '2030-01-01T00:00:00.000Z',
      },
    })
    expect(JSON.stringify(context)).not.toContain('access-secret-value')
    expect(JSON.stringify(context)).not.toContain('refresh-secret-value')
    expect(JSON.stringify(redactValue({ authentication: context }))).not.toContain('secret-value')
  })
})
