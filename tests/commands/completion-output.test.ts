import { describe, expect, it } from 'vitest'
import { runCli } from '../../src/commands/index.js'
import { CommandOutput, memoryOutputStreams } from '../../src/commands/output.js'
import { createLunaCli } from '../../src/entry.js'

describe('completion command output', () => {
  it('prints a sourceable script for human table output', async () => {
    const capture = memoryOutputStreams()
    const output = new CommandOutput({ streams: capture.streams })
    const cli = createLunaCli({ ports: { output } })

    const result = await runCli(
      cli.program,
      ['node', 'luna', 'completion', 'zsh', 'output=table'],
      output,
    )

    expect(result.exitCode).toBe(0)
    expect(capture.stdout()).toMatch(/^#compdef luna\n/)
    expect(capture.stdout()).not.toContain('shell   zsh')
  })

  it('keeps structured output available for automation', async () => {
    const capture = memoryOutputStreams()
    const output = new CommandOutput({ streams: capture.streams })
    const cli = createLunaCli({ ports: { output } })

    const result = await runCli(
      cli.program,
      ['node', 'luna', 'completion', 'zsh', 'output=json', 'interactive=false'],
      output,
    )

    expect(result.exitCode).toBe(0)
    const document = JSON.parse(capture.stdout())
    expect(document.data.shell).toBe('zsh')
    expect(document.data.script).toMatch(/^#compdef luna\n/)
  })
})
