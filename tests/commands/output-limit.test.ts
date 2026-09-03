import type { CommandExecutionGlobals, NormalizedCommandMetadata } from '../../src/commands/index.js'
import { describe, expect, it } from 'vitest'
import { CommandOutput, memoryOutputStreams } from '../../src/commands/index.js'

const globals: CommandExecutionGlobals = {
  output: 'json',
  color: false,
  interactive: false,
  yes: false,
  quiet: true,
  agent: true,
  timeoutMs: 30_000,
  debug: false,
  insecureSkipTlsVerify: false,
}

const metadata = {
  category: 'agent-observability',
  tool: 'trace',
  canonicalPath: 'agent-observability.trace',
  source: 'openapi',
  operationId: 'getAgentObservabilityTrace',
} as NormalizedCommandMetadata

describe('structured output limits', () => {
  it('rejects results larger than the fixed 16 MiB boundary', () => {
    const capture = memoryOutputStreams()
    const output = new CommandOutput({ streams: capture.streams, version: 'test' })

    expect(() => output.writeSuccess(
      metadata,
      { data: { payload: 'x'.repeat(17 * 1024 * 1024) } },
      globals,
    )).toThrow(expect.objectContaining({ code: 'output_too_large', status: 413 }))
    expect(capture.stdout()).toBe('')
  })

  it('never appends a session summary to interactive terminal bytes', () => {
    const capture = memoryOutputStreams()
    const output = new CommandOutput({ streams: capture.streams, version: 'test' })
    const terminalMetadata = {
      ...metadata,
      category: 'release',
      tool: 'exec',
      canonicalPath: 'release.exec',
      source: 'protocol',
      transport: 'websocket',
    } as NormalizedCommandMetadata

    for (const format of ['table', 'json', 'raw-json', 'yaml', 'jsonl', 'name'] as const) {
      output.writeSuccess(
        terminalMetadata,
        { data: { exitCode: 0, bytesSent: 10, bytesReceived: 20 } },
        { ...globals, output: format, interactive: true, agent: false },
      )
    }

    expect(capture.stdout()).toBe('')
  })
})
