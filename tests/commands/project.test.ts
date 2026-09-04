import type { RuntimePorts } from '../../src/commands/types.js'
import { describe, expect, it } from 'vitest'
import {
  CommandRegistry,
  createCliProgram,
  DefaultInputPort,
  registerLocalCommands,
  runCli,
} from '../../src/commands/index.js'
import { MemoryConfigStore } from '../config/memory-store.js'

describe('project credential context', () => {
  it('does not write a project resolved under an older login', async () => {
    const store = new MemoryConfigStore(oauthConfig('old', 'project-old'))
    const errors: unknown[] = []
    const ports = runtimePorts(store, errors, {
      resolveProject: async () => {
        await store.write(oauthConfig('new', null))
        return { id: 'project-resolved', name: 'Resolved Project' }
      },
    })
    const registry = new CommandRegistry()
    registerLocalCommands(registry)

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'project',
      'use',
      'project=project-resolved',
    ], ports.output)

    expect(result.exitCode).toBe(6)
    expect(errors[0]).toMatchObject({
      code: 'auth_context_changed',
      details: expect.objectContaining({ stage: 'project_update' }),
    })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-new',
    })
    expect(store.value.project).toBeNull()
  })

  it('does not unset the project of a newer login', async () => {
    const store = new MemoryConfigStore(oauthConfig('old', 'project-old'))
    const errors: unknown[] = []
    const parser = new DefaultInputPort()
    const ports = runtimePorts(store, errors, {
      input: {
        parse: async (tokens, metadata) => {
          const parsed = await parser.parse(tokens, metadata)
          await store.write(oauthConfig('new', 'project-new'))
          return parsed
        },
      },
    })
    const registry = new CommandRegistry()
    registerLocalCommands(registry)

    const result = await runCli(createCliProgram({ registry, ports }), [
      'node',
      'luna',
      'project',
      'unset',
    ], ports.output)

    expect(result.exitCode).toBe(6)
    expect(errors[0]).toMatchObject({ code: 'auth_context_changed' })
    expect(store.value.credential).toMatchObject({
      type: 'oauth',
      accessToken: 'access-new',
    })
    expect(store.value.project).toMatchObject({ id: 'project-new' })
  })
})

function runtimePorts(
  store: MemoryConfigStore,
  errors: unknown[],
  options: {
    readonly input?: RuntimePorts['input']
    readonly resolveProject?: NonNullable<RuntimePorts['api']['resolveProject']>
  } = {},
): RuntimePorts {
  return {
    config: store,
    input: options.input ?? new DefaultInputPort(),
    output: {
      writeSuccess: () => undefined,
      writeError(error) {
        errors.push(error)
      },
    },
    api: {
      execute: async () => ({}),
      request: async () => ({}),
      resolveProject: options.resolveProject,
    },
    env: {},
    isTTY: false,
  }
}

function oauthConfig(
  generation: 'new' | 'old',
  projectId: string | null,
) {
  return {
    version: 2 as const,
    server: 'https://luna.example.test',
    credential: {
      type: 'oauth' as const,
      accessToken: `access-${generation}`,
      refreshToken: `refresh-${generation}`,
      createdAt: generation === 'old'
        ? '2026-01-01T00:00:00.000Z'
        : '2026-02-01T00:00:00.000Z',
      expiresAt: '2999-01-01T00:00:00.000Z',
    },
    project: projectId ? { id: projectId } : null,
    language: '',
    output: '' as const,
  }
}
