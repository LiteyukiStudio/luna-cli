import type { LunaConfigDocument } from '../commands/types.js'

import { z } from 'zod'

export const OUTPUT_FORMATS = [
  'table',
  'json',
  'raw-json',
  'yaml',
  'jsonl',
  'name',
] as const

export const DEFAULT_LUNA_SERVER = 'https://devops.liteyuki.org'

const userSnapshotSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
  })
  .passthrough()

const credentialBaseSchema = z.object({
  user: userSnapshotSchema.optional(),
  expiresAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime().optional(),
})

const oauthRefreshStateSchema = z.discriminatedUnion('state', [
  z.object({
    code: z.literal('oauth_refresh_in_progress'),
    state: z.literal('in_progress'),
    updatedAt: z.iso.datetime(),
  }),
  z.object({
    code: z.enum([
      'oauth_refresh_outcome_unknown',
      'oauth_refresh_rejected',
    ]),
    state: z.literal('reauthentication_required'),
    updatedAt: z.iso.datetime(),
  }),
])

export const oauthCredentialSchema = credentialBaseSchema
  .extend({
    type: z.literal('oauth'),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1).optional(),
    refreshState: oauthRefreshStateSchema.optional(),
    tokenType: z.string().min(1).optional(),
  })

export const accessTokenCredentialSchema = credentialBaseSchema
  .extend({
    type: z.literal('access_token'),
    token: z.string().min(1),
  })

const credentialValueSchema = z.discriminatedUnion('type', [
  oauthCredentialSchema,
  accessTokenCredentialSchema,
])

export const credentialSchema = credentialValueSchema

export const projectSnapshotSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    identifier: z.string().min(1).optional(),
  })
  .passthrough()

export const configDocumentSchema = z
  .object({
    version: z.literal(2),
    server: z.string().min(1).default(DEFAULT_LUNA_SERVER),
    credential: credentialSchema.nullish(),
    project: projectSnapshotSchema.nullish(),
    language: z.string().default(''),
    output: z.union([z.enum(OUTPUT_FORMATS), z.literal('')]).default(''),
  })
  .passthrough()

export type LunaCredential = z.infer<typeof credentialSchema>
export type OAuthCredential = z.infer<typeof oauthCredentialSchema>
export type AccessTokenCredential = z.infer<typeof accessTokenCredentialSchema>
export type StoredLunaConfig = z.infer<typeof configDocumentSchema>

export function emptyConfigDocument(): StoredLunaConfig {
  return {
    version: 2,
    server: DEFAULT_LUNA_SERVER,
    credential: null,
    project: null,
    language: '',
    output: '',
  }
}

export function parseConfigDocument(value: unknown): StoredLunaConfig {
  const current = configDocumentSchema.safeParse(value)
  if (current.success)
    return current.data

  if (isRecord(value) && value.version === 1)
    return emptyConfigDocument()
  return configDocumentSchema.parse(value)
}

export function cloneConfigDocument(config: LunaConfigDocument): StoredLunaConfig {
  return parseConfigDocument(structuredClone(config))
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
