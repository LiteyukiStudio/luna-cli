import type { ConfigPort } from '../commands/types.js'
import type { LunaCredential } from '../config/schema.js'
import type { AuthStatusEntry } from './types.js'
import { resolveRuntimeContext } from '../config/resolve.js'
import { parseConfigDocument } from '../config/schema.js'

export interface AuthStatusOptions {
  readonly now?: Date
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly server?: string
}

export async function getAuthStatus(
  store: ConfigPort,
  options: AuthStatusOptions = {},
): Promise<AuthStatusEntry> {
  const config = parseConfigDocument(await store.read())
  const runtime = resolveRuntimeContext(config, {
    env: options.env,
    server: options.server,
  })
  const credential = runtime.credential
  const source = runtime.sources.credential === 'environment'
    ? 'environment' as const
    : runtime.sources.credential === 'config'
      ? 'stored' as const
      : 'none' as const
  const expired = credential ? isExpired(credential, options.now) : false
  const refreshState = credential?.type === 'oauth'
    ? credential.refreshState?.state
    : undefined
  const reauthenticationRequired = refreshState === 'reauthentication_required'
  return {
    server: runtime.server,
    authenticated: credential !== undefined && !expired && !reauthenticationRequired,
    authType: credential?.type,
    expiresAt: credential?.expiresAt,
    expired,
    reauthenticationRequired,
    refreshInProgress: refreshState === 'in_progress',
    refreshable: source === 'stored'
      && credential?.type === 'oauth'
      && Boolean(credential.refreshToken)
      && !reauthenticationRequired,
    source,
    scopes: credential ? [...credential.scopes] : [],
    user: credential?.user,
    credential: credential
      ? {
          type: credential.type,
          scopes: [...credential.scopes],
          user: credential.user,
          expiresAt: credential.expiresAt,
          expired,
          source: source === 'environment' ? 'environment' : 'stored',
        }
      : undefined,
  }
}

function isExpired(credential: LunaCredential, now = new Date()): boolean {
  return credential.expiresAt !== undefined
    && Date.parse(credential.expiresAt) <= now.getTime()
}
