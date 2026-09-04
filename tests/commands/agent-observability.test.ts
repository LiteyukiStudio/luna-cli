import * as apiContract from '@luna-devops/api-contract'
import { describe, expect, it } from 'vitest'
import {
  catalogResult,
  commandHelpResult,
  createRegistryFromContract,
} from '../../src/commands/index.js'

const registry = createRegistryFromContract(apiContract)

describe('agent observability machine help', () => {
  it('discovers the stable category with compact summaries', () => {
    const result = catalogResult(registry, { query: 'observability', limit: 20 })
    const data = result.data as { items: Array<Record<string, unknown>> }
    const paths = data.items.map(item => item.path)

    expect(paths).toEqual(expect.arrayContaining([
      'agent-observability.overview',
      'agent-observability.turns',
      'agent-observability.tools',
      'agent-observability.tool-calls',
      'agent-observability.trace',
      'agent-observability.source-test',
    ]))
    for (const item of data.items) {
      expect(item).toHaveProperty('summary')
      expect(item).toHaveProperty('risk')
      expect(item).toHaveProperty('agentAllowed')
      expect(item).toHaveProperty('mainParameters')
      expect(item).not.toHaveProperty('inputSchema')
      expect(item).not.toHaveProperty('outputSchema')
    }
  })

  it('loads bounded list and trace schemas only through help command', () => {
    const turns = commandHelpResult(registry, { path: 'agent-observability.turns' }).data as {
      command: {
        parameters: Array<{ name: string, schema?: Record<string, unknown> }>
        outputSchema: Record<string, unknown>
        errorSchema: Record<string, unknown>
      }
    }
    const pageSize = turns.command.parameters.find(parameter => parameter.name === 'pageSize')
    const range = turns.command.parameters.find(parameter => parameter.name === 'range')
    expect(pageSize?.schema).toMatchObject({ default: 20, maximum: 100, minimum: 1 })
    expect(range?.schema).toMatchObject({ default: '1h', enum: ['1h', '6h', '24h', '7d', '30d', '1y'] })
    expect(turns.command.outputSchema).toMatchObject({
      type: 'object',
      required: expect.arrayContaining(['items', 'page', 'pageSize', 'total', 'totalPages']),
    })
    expect(turns.command.errorSchema).toBeDefined()

    const trace = commandHelpResult(registry, { path: 'agent-observability.trace' }).data as {
      command: { parameters: Array<{ name: string, schema?: Record<string, unknown> }> }
    }
    expect(trace.command.parameters.find(parameter => parameter.name === 'traceId')?.schema)
      .toMatchObject({ pattern: '^[0-9a-fA-F]{32}$' })
  })
})
