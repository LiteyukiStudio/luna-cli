import { describe, expect, it } from 'vitest'
import {
  createRegistryFromContract,
  extractCatalog,
} from '../../src/commands/index.js'

describe('openAPI command catalog normalization', () => {
  it('reads nested canonical metadata and infers required project context', () => {
    const catalog = extractCatalog({
      OPERATION_CATALOG_METADATA: {
        catalogVersion: 'v1',
        openapiDigest: 'openapi',
        catalogDigest: 'catalog',
      },
      OPERATION_CATALOG: [{
        operationId: 'updateApplication',
        method: 'patch',
        path: '/api/v1/projects/{projectId}/applications/{applicationId}',
        command: {
          category: 'application',
          tool: 'update',
          categoryAliases: ['app'],
          aliases: ['edit'],
          risk: 'high',
          requiredScopes: ['applications:write'],
          mfaPurpose: 'application_update',
          projectContext: 'required',
          streaming: true,
          agentAllowed: false,
          examples: ['luna application update applicationId=app_example body=@update.json'],
        },
        parameters: [
          { name: 'projectId', in: 'path', required: true },
          { name: 'applicationId', in: 'path', required: true },
        ],
        requestBody: {
          required: true,
          contentTypes: ['application/json'],
        },
      }],
    })

    expect(catalog.metadata.schemaDigest).toBe('catalog')
    expect(catalog.entries[0]).toMatchObject({
      category: 'application',
      tool: 'update',
      source: 'openapi',
      projectContext: 'required',
      risk: 'high',
      scopes: ['applications:write'],
      categoryAliases: ['app'],
      aliases: ['edit'],
      mfaPurpose: 'application_update',
      streaming: true,
      agentAllowed: false,
      examples: ['luna application update applicationId=app_example body=@update.json'],
    })
    expect(catalog.entries[0]?.parameters).toContainEqual(expect.objectContaining({
      name: 'body',
      location: 'body',
      required: true,
      valueSources: ['file', 'stdin'],
    }))
  })

  it('does not disable inline input when value sources are unspecified', () => {
    const catalog = extractCatalog({
      OPERATION_CATALOG: [{
        operationId: 'listProjects',
        method: 'get',
        path: '/api/v1/projects',
        command: { category: 'project', tool: 'list' },
        parameters: [{ name: 'page', in: 'query' }],
      }],
    })

    expect(catalog.entries[0]?.parameters?.[0]?.valueSources).toBeUndefined()
  })

  it('maps Idempotency-Key to the existing global option', () => {
    const catalog = extractCatalog({
      OPERATION_CATALOG: [{
        operationId: 'createProjectVolume',
        method: 'post',
        path: '/api/v1/projects/{projectId}/volumes',
        command: { category: 'volume', tool: 'create' },
        parameters: [
          { name: 'projectId', in: 'path', required: true },
          { name: 'Idempotency-Key', in: 'header', required: true },
        ],
        inputSchema: {
          type: 'object',
          properties: {
            'projectId': { type: 'string' },
            'Idempotency-Key': { type: 'string' },
          },
          required: ['projectId', 'Idempotency-Key'],
          additionalProperties: false,
        },
      }],
    })

    expect(catalog.entries[0]?.parameters).toEqual([
      expect.objectContaining({ name: 'projectId', location: 'path' }),
    ])
    expect(catalog.entries[0]?.inputSchema).toMatchObject({
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    })
  })

  it('does not register hidden OpenAPI operations as canonical raw commands', () => {
    const registry = createRegistryFromContract({
      OPERATION_CATALOG: [
        {
          operationId: 'listProjects',
          command: { category: 'project', tool: 'list' },
        },
        {
          operationId: 'streamBuildLogs',
          command: {
            category: 'build',
            tool: 'stream-logs-raw',
            hidden: true,
          },
        },
      ],
    })

    expect(registry.get('project.list')).toBeDefined()
    expect(registry.get('build.stream-logs-raw')).toBeUndefined()
    expect(registry.get('build.job-logs-follow')).toMatchObject({
      metadata: {
        source: 'protocol',
        transport: 'sse',
      },
    })
    expect(registry.list({ includeHidden: true })).not.toContainEqual(
      expect.objectContaining({
        metadata: expect.objectContaining({
          operationId: 'streamBuildLogs',
        }),
      }),
    )
  })

  it('lets a typed protocol wrapper consume a colliding raw operation', () => {
    const registry = createRegistryFromContract({
      OPERATION_CATALOG: [
        {
          operationId: 'updateProjectVolume',
          method: 'patch',
          path: '/api/v1/projects/{projectId}/volumes/{volumeId}',
          command: { category: 'volume', tool: 'update' },
        },
        {
          operationId: 'createProjectVolume',
          method: 'post',
          path: '/api/v1/projects/{projectId}/volumes',
          command: { category: 'volume', tool: 'create' },
        },
      ],
    })

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
