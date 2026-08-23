import { describe, expect, it } from 'vitest'
import { generateCompletion } from '../../src/commands/completion.js'
import { createLunaCli } from '../../src/entry.js'

describe('shell completion', () => {
  const registry = createLunaCli().registry

  it.each(['bash', 'zsh', 'fish', 'powershell'] as const)(
    'generates %s completion from the canonical command registry',
    (shell) => {
      const script = generateCompletion(shell, registry)

      expect(script).toContain('generated from the command registry')
      expect(script).toContain('project')
      expect(script).toContain('get-projects')
      expect(script).toContain('list-projects')
      expect(script).toContain('sortOrder=asc')
      expect(script).toContain('sortOrder=desc')
      expect(script).toContain('output=json')
      expect(script).toContain('mode=device-code')
      expect(script).toContain('mode=access-token')
      expect(script).toContain('--output=')
      expect(script).toContain('login')
      expect(script).not.toContain('token=[REDACTED]')
    },
  )

  it('completes sensitive parameters only as empty keys', () => {
    const script = generateCompletion('bash', registry)

    expect(script).toContain('token=')
    expect(script).not.toMatch(/token=[^\s"']+/)
  })

  it('emits shell scripts without invoking remote APIs at completion time', () => {
    for (const shell of ['bash', 'zsh', 'fish', 'powershell'] as const) {
      const script = generateCompletion(shell, registry)
      expect(script).not.toMatch(/\bluna\s+(?:help|completion)\b/)
      expect(script).not.toContain('/api/v1')
    }
  })
})
