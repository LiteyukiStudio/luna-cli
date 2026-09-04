import * as apiContract from '@luna-devops/api-contract'
import { describe, expect, it } from 'vitest'
import {
  createRegistryFromContract,
  extractCatalog,
} from '../../src/commands/index.js'

const catalog = extractCatalog(apiContract)

describe('openAPI command catalog normalization', () => {
  it('reads the canonical package exports and command metadata', () => {
    const entry = catalog.entries.find(item => item.operationId === 'updateApplication')

    expect(catalog.metadata).toEqual({
      catalogVersion: apiContract.OPERATION_CATALOG_METADATA.catalogVersion,
      openapiDigest: apiContract.OPERATION_CATALOG_METADATA.openapiDigest,
      schemaDigest: apiContract.OPERATION_CATALOG_METADATA.catalogDigest,
    })
    expect(entry).toMatchObject({
      source: 'openapi',
      operationId: 'updateApplication',
      projectContext: 'required',
      risk: 'high',
    })
    expect(entry?.parameters).toContainEqual(expect.objectContaining({
      name: 'body',
      location: 'body',
      required: true,
      valueSources: ['file', 'stdin'],
    }))
  })

  it('does not disable inline input when value sources are unspecified', () => {
    const entry = catalog.entries.find(item => item.operationId === 'listProjects')
    const page = entry?.parameters?.find(parameter => parameter.name === 'page')

    expect(page?.valueSources).toBeUndefined()
  })

  it('maps Idempotency-Key to the existing global option', () => {
    const entry = catalog.entries.find(item => item.operationId === 'createProjectVolume')

    expect(entry?.parameters).not.toContainEqual(
      expect.objectContaining({ name: 'Idempotency-Key' }),
    )
    expect(entry?.inputSchema).toMatchObject({
      properties: expect.not.objectContaining({ 'Idempotency-Key': expect.anything() }),
    })
    expect(entry?.inputSchema?.required).not.toContain('Idempotency-Key')
  })

  it('does not register hidden OpenAPI operations as canonical raw commands', () => {
    const registry = createRegistryFromContract(apiContract)

    expect(registry.get('build.job-logs-follow')).toMatchObject({
      metadata: {
        source: 'protocol',
        transport: 'sse',
      },
    })
    expect(registry.list({ includeHidden: true })).not.toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          operationId: 'streamBuildJobLogs',
        }),
      }),
    )
  })

  it('lets a typed protocol wrapper consume a colliding raw operation', () => {
    const registry = createRegistryFromContract(apiContract)

    expect(registry.require('volume.update').metadata).toMatchObject({
      source: 'protocol',
      consumedOperations: ['updateProjectVolume'],
    })
    expect(registry.require('volume.create').metadata).toMatchObject({
      source: 'openapi',
      operationId: 'createProjectVolume',
    })
  })
})
