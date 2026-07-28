import type { LunaApiMeta } from './types.js'
import { CliCommandError } from './errors.js'

export const SUPPORTED_SERVER_API_VERSIONS = Object.freeze(['v1'])

export interface ServerCompatibilityRequirements {
  readonly cliVersion: string
  readonly openapiDigest: string
  readonly supportedApiVersions?: readonly string[]
}

export interface ServerCompatibilityResult {
  readonly openapiDigestMatches: boolean
}

export function assertServerCompatibility(
  meta: LunaApiMeta,
  requirements: ServerCompatibilityRequirements,
): ServerCompatibilityResult {
  const supportedApiVersions
    = requirements.supportedApiVersions ?? SUPPORTED_SERVER_API_VERSIONS
  if (!supportedApiVersions.includes(meta.apiVersion)) {
    throw new CliCommandError(
      'server_api_version_unsupported',
      `Server API version "${meta.apiVersion}" is not supported by this CLI.`,
      {
        status: 412,
        details: {
          serverApiVersion: meta.apiVersion,
          supportedApiVersions,
        },
      },
    )
  }

  if (!isDevelopmentVersion(requirements.cliVersion)) {
    const supported = isVersionAtLeast(
      requirements.cliVersion,
      meta.minimumCliVersion,
    )
    if (supported === undefined) {
      throw new CliCommandError(
        'cli_version_invalid',
        'The CLI or server minimum CLI version is not valid SemVer.',
        {
          status: 412,
          details: {
            current: requirements.cliVersion,
            minimum: meta.minimumCliVersion,
          },
        },
      )
    }
    if (!supported) {
      throw new CliCommandError(
        'cli_version_too_old',
        `Luna CLI ${meta.minimumCliVersion} or newer is required by this server.`,
        {
          status: 412,
          details: {
            current: requirements.cliVersion,
            minimum: meta.minimumCliVersion,
          },
        },
      )
    }
  }

  return {
    openapiDigestMatches:
      isOpenApiDigest(requirements.openapiDigest)
      && isOpenApiDigest(meta.openapiDigest)
      && requirements.openapiDigest === meta.openapiDigest,
  }
}

export function isVersionAtLeast(
  current: string,
  minimum: string,
): boolean | undefined {
  const currentVersion = semverCore(current)
  const minimumVersion = semverCore(minimum)
  if (!currentVersion || !minimumVersion)
    return undefined
  for (let index = 0; index < currentVersion.length; index += 1) {
    if (currentVersion[index]! > minimumVersion[index]!)
      return true
    if (currentVersion[index]! < minimumVersion[index]!)
      return false
  }
  return true
}

function semverCore(value: string): readonly [number, number, number] | undefined {
  const match = value.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.-]+)?$/)
  if (!match)
    return undefined
  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function isDevelopmentVersion(value: string): boolean {
  return value === '0.0.0-development'
}

function isOpenApiDigest(value: string): boolean {
  return /^sha256:[0-9a-f]{64}$/i.test(value)
}
