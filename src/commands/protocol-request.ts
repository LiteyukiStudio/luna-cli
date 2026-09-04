import type { QueryInput } from '@luna-devops/api-client'
import type { OAuthTokenCredential } from '../auth/oauth.js'
import type {
  CommandInvocation,
  NormalizedCommandMetadata,
  RuntimePorts,
} from './types.js'
import {
  assertAuthenticationTransition,
  authenticationContext,
  refreshStoredOAuthCredential,
} from '../auth/index.js'
import { resolveRuntimeContext } from '../config/resolve.js'
import { planOpenApiRequest } from './api.js'
import { CliCommandError } from './errors.js'

const LOCAL_PROTOCOL_PARAMETERS = new Set([
  'checksum',
  'consistency',
  'destination',
  'file',
  'format',
  'maxBytes',
  'maxEvents',
  'overwrite',
  'pollIntervalMs',
  'waitTimeoutMs',
])

export interface ProtocolRequest {
  readonly response: Response
  readonly requestId?: string
  readonly server: string
}

export interface ProtocolRequestOptions {
  readonly accept: string
  readonly body?: BodyInit | null
  readonly contentLength?: number
  readonly duplex?: true
  readonly headers?: HeadersInit
  readonly signal?: AbortSignal
  readonly streaming?: boolean
}

export async function openProtocolRequest(
  invocation: CommandInvocation,
  ports: RuntimePorts,
  options: string | ProtocolRequestOptions,
): Promise<ProtocolRequest> {
  const requestOptions = typeof options === 'string' ? { accept: options } : options
  if (invocation.globals.insecureSkipTlsVerify) {
    throw new CliCommandError(
      'insecure_tls_unsupported',
      'This runtime cannot safely isolate insecure TLS verification for one request.',
      {
        status: 501,
        details: { remediation: 'Configure a trusted CA for the selected instance.' },
      },
    )
  }

  const observedConfig = await ports.config.read()
  const observedRuntime = resolveInvocationRuntime(observedConfig, invocation, ports)
  const observedAuthentication = authenticationContext(observedRuntime)
  if (invocation.authentication) {
    assertAuthenticationTransition(
      invocation.authentication,
      observedAuthentication,
      undefined,
      {
        stage: 'protocol_command_start',
        refreshOutcome: 'coalesced',
      },
    )
  }

  let issuedCredential: OAuthTokenCredential | undefined
  const refresh = await refreshStoredOAuthCredential(ports.config, {
    env: ports.env,
    server: invocation.globals.server,
    ...(observedRuntime.sources.credential === 'config'
      && observedRuntime.credential?.type === 'oauth'
      ? { expectedAccessToken: observedRuntime.credential.accessToken }
      : {}),
    timeoutMs: invocation.globals.timeoutMs,
    refresh: ports.api.refreshOAuthCredential
      ? async (request) => {
        issuedCredential = await ports.api.refreshOAuthCredential!(request)
        return issuedCredential
      }
      : undefined,
  })
  const config = await ports.config.read()
  const runtime = resolveInvocationRuntime(config, invocation, ports)
  const currentAuthentication = authenticationContext(runtime)
  assertAuthenticationTransition(
    observedAuthentication,
    currentAuthentication,
    issuedCredential,
    {
      stage: 'protocol_oauth_preflight',
      refreshOutcome: refresh.outcome,
    },
  )
  const token = runtime.credential?.type === 'oauth'
    ? runtime.credential.accessToken
    : runtime.credential?.type === 'access_token'
      ? runtime.credential.token
      : undefined
  if (!token) {
    throw new CliCommandError(
      'authentication_required',
      'Sign in before using this protocol command.',
      { status: 401 },
    )
  }

  const metadata = requestMetadata(invocation.metadata)
  const planned = planOpenApiRequest({
    operationId: metadata.operationId ?? metadata.canonicalPath,
    metadata,
    params: requestParams(invocation.params),
    globals: invocation.globals,
  })
  const url = new URL(planned.path, `${runtime.server}/`)
  appendQuery(url, planned.query)
  const headers = new Headers(planned.headers)
  for (const [name, value] of new Headers(requestOptions.headers))
    headers.set(name, value)
  headers.set('accept', requestOptions.accept)
  headers.set('authorization', `Bearer ${token}`)
  if (invocation.globals.requestId)
    headers.set('x-request-id', invocation.globals.requestId)
  if (invocation.globals.idempotencyKey)
    headers.set('idempotency-key', invocation.globals.idempotencyKey)
  if (requestOptions.contentLength !== undefined) {
    if (!Number.isSafeInteger(requestOptions.contentLength) || requestOptions.contentLength < 0) {
      throw new CliCommandError(
        'invalid_arguments',
        'The protocol request content length is invalid.',
        { status: 400, exitCode: 2, details: { field: 'contentLength' } },
      )
    }
    headers.set('content-length', String(requestOptions.contentLength))
  }

  const timeoutController = new AbortController()
  const signal = requestOptions.signal
    ? AbortSignal.any([timeoutController.signal, requestOptions.signal])
    : timeoutController.signal
  const connectionTimeout = requestOptions.streaming
    ? undefined
    : setTimeout(
        () => timeoutController.abort('timeout'),
        invocation.globals.timeoutMs,
      )
  let response: Response
  const latestRuntime = resolveInvocationRuntime(
    await ports.config.read(),
    invocation,
    ports,
  )
  assertAuthenticationTransition(
    currentAuthentication,
    authenticationContext(latestRuntime),
    undefined,
    {
      stage: 'protocol_send',
      refreshOutcome: 'unchanged',
    },
  )
  try {
    const requestInit: RequestInit & { duplex?: 'half' } = {
      method: planned.method,
      headers,
      ...(requestOptions.body !== undefined ? { body: requestOptions.body } : {}),
      ...(requestOptions.duplex ? { duplex: 'half' as const } : {}),
      redirect: 'manual',
      signal,
    }
    response = await (ports.protocol?.fetch ?? globalThis.fetch)(url, requestInit)
  }
  catch (error) {
    if (requestOptions.signal?.aborted) {
      throw new CliCommandError('request_cancelled', 'The protocol request was cancelled.', {
        status: 499,
        exitCode: 130,
        cause: error,
      })
    }
    if (timeoutController.signal.aborted) {
      throw new CliCommandError('request_timeout', 'The protocol request timed out.', {
        status: 504,
        retryable: true,
        details: { timeoutMs: invocation.globals.timeoutMs },
        cause: error,
      })
    }
    throw new CliCommandError('network_error', 'The protocol request could not be sent.', {
      status: 503,
      retryable: true,
      cause: error,
    })
  }
  finally {
    // --timeout bounds connection establishment and response headers only.
    // Long-lived streams and downloads enforce their own read limits.
    if (connectionTimeout !== undefined)
      clearTimeout(connectionTimeout)
  }

  if (response.status >= 300 && response.status < 400) {
    await cancelBody(response)
    throw new CliCommandError(
      'protocol_redirect_refused',
      'The protocol endpoint returned a redirect. Refusing to forward credentials.',
      {
        status: 502,
        details: {
          location: response.headers.get('location') ?? '',
          requestUrl: url.origin + url.pathname,
        },
      },
    )
  }
  if (!response.ok)
    throw await responseError(response)

  const requestId = response.headers.get('x-request-id') ?? undefined
  return {
    response,
    server: runtime.server,
    ...(requestId ? { requestId } : {}),
  }
}

function resolveInvocationRuntime(
  config: unknown,
  invocation: CommandInvocation,
  ports: RuntimePorts,
) {
  return resolveRuntimeContext(config, {
    server: invocation.globals.server,
    project: invocation.globals.project,
    output: invocation.globals.output,
    language: invocation.globals.lang,
    env: ports.env,
  })
}

function requestMetadata(metadata: NormalizedCommandMetadata): NormalizedCommandMetadata {
  return {
    ...metadata,
    parameters: metadata.parameters.filter(parameter =>
      !LOCAL_PROTOCOL_PARAMETERS.has(parameter.name)),
  }
}

function requestParams(
  params: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.fromEntries(
    Object.entries(params).filter(([name]) => !LOCAL_PROTOCOL_PARAMETERS.has(name)),
  )
}

function appendQuery(url: URL, query: QueryInput | undefined): void {
  if (!query)
    return
  if (query instanceof URLSearchParams) {
    for (const [name, value] of query)
      url.searchParams.append(name, value)
    return
  }
  for (const [name, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value)
        appendQueryValue(url, name, item)
    }
    else {
      appendQueryValue(url, name, value)
    }
  }
}

function appendQueryValue(url: URL, name: string, value: unknown): void {
  if (value === undefined || value === null)
    return
  url.searchParams.append(name, value instanceof Date ? value.toISOString() : String(value))
}

async function responseError(response: Response): Promise<CliCommandError> {
  const requestId = response.headers.get('x-request-id') ?? ''
  const contentType = response.headers.get('content-type') ?? ''
  let payload: unknown
  try {
    payload = contentType.includes('json')
      ? await response.json()
      : { message: (await response.text()).slice(0, 4096) }
  }
  catch {
    payload = {}
  }
  const root = asRecord(payload)
  const nested = asRecord(root.error)
  const code = stringValue(nested.code) ?? stringValue(root.code)
    ?? `http_${response.status}`
  const message = stringValue(nested.message) ?? stringValue(root.message)
    ?? `Protocol request failed with HTTP ${response.status}.`
  const purpose = stringValue(nested.purpose) ?? stringValue(root.purpose)
    ?? stringValue(asRecord(nested.details).purpose)
    ?? stringValue(asRecord(root.details).purpose)
  const retryAfterSeconds = boundedRetryAfterSeconds(response.headers.get('retry-after'))
  return new CliCommandError(code, message, {
    status: response.status,
    retryable: response.status === 429 || response.status >= 500,
    details: {
      ...asRecord(nested.details),
      ...asRecord(root.details),
      ...(requestId ? { requestId } : {}),
      ...(purpose ? { purpose } : {}),
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    },
  })
}

function boundedRetryAfterSeconds(value: string | null): number | undefined {
  const seconds = Number(value)
  if (!Number.isSafeInteger(seconds) || seconds < 0)
    return undefined
  return Math.min(5, Math.max(1, seconds))
}

async function cancelBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel()
  }
  catch {
    // The response is already being torn down.
  }
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : {}
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}
