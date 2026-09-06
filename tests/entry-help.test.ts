import { describe, expect, it } from 'vitest'
import { commandHelpText, rootHelpText } from '../src/commands/human-help.js'
import { runCli } from '../src/commands/index.js'
import { createLunaCli, startupOptionValue } from '../src/entry.js'
import { createCliI18n, normalizeLocale } from '../src/i18n/index.js'

describe('cli startup and human help', () => {
  it('reads startup options before Commander renders help', () => {
    expect(startupOptionValue(['node', 'luna', '--lang', 'zh-CN'], 'lang')).toBe('zh-CN')
    expect(startupOptionValue(['node', 'luna', '--lang=zh-CN'], 'lang')).toBe('zh-CN')
    expect(startupOptionValue(['node', 'luna', 'version', 'show', 'lang=zh-CN'], 'lang')).toBe('zh-CN')
  })

  it('renders localized, actionable root and command help', async () => {
    const i18n = await createCliI18n({ env: { LUNA_LANG: 'zh-CN' } })
    const cli = createLunaCli({
      ports: {
        translate(key, fallback, locale) {
          return i18n.getFixedT(normalizeLocale(locale) ?? i18n.language)(key, {
            defaultValue: fallback,
          })
        },
      },
    })

    const rootHelp = [
      cli.program.helpInformation(),
      rootHelpText(cli.registry, cli.ports),
    ].join('\n')
    expect(rootHelp).toContain('快速开始：')
    expect(rootHelp).toContain('业务参数统一使用 key=value')
    expect(rootHelp).toMatch(/当前共有 \d+ 个分类、\d+ 条命令/)
    expect(rootHelp).toContain('login')
    expect(rootHelp).toContain('doctor')

    const helpCategory = cli.program.commands.find(command => command.name() === 'help')
    const command = helpCategory?.commands.find(item => item.name() === 'command')
    const metadata = cli.registry.get('help.command')?.metadata
    const commandHelp = [
      command?.helpInformation() ?? '',
      metadata ? commandHelpText(metadata, cli.ports) : '',
    ].join('\n')
    expect(commandHelp).toContain('业务参数：')
    expect(commandHelp).toContain('path=<value>  [必填, string')
    expect(commandHelp).toContain('luna help command path=project.list output=json')

    const login = cli.registry.get('auth.login')?.metadata
    const loginHelp = login ? commandHelpText(login, cli.ports) : ''
    expect(loginHelp).toContain('luna login')
    expect(loginHelp).toContain(
      'printf \'%s\' "$LUNA_TOKEN" | luna auth login mode=access-token token=@-',
    )
    expect(loginHelp).not.toContain('luna printf')

    const oauthApplication = cli.registry.list().find(command =>
      command.metadata.operationId === 'deleteOAuthApplication')?.metadata
    const oauthApplicationHelp = oauthApplication
      ? commandHelpText(oauthApplication, cli.ports)
      : ''
    expect(oauthApplicationHelp).toContain('applicationId=oapp_example')
    expect(oauthApplicationHelp).toContain('OAuth 应用 ID。')
    expect(oauthApplicationHelp).not.toContain('项目空间内唯一标识符')
    expect(oauthApplicationHelp).not.toContain('applicationId=app_222222222222222222222222')
  })

  it('shows localized root help when invoked without a command', async () => {
    const output: string[] = []
    const i18n = await createCliI18n({ env: { LUNA_LANG: 'zh-CN' } })
    const cli = createLunaCli({
      ports: {
        translate(key, fallback, locale) {
          return i18n.getFixedT(normalizeLocale(locale) ?? i18n.language)(key, {
            defaultValue: fallback,
          })
        },
      },
    })
    cli.program.configureOutput({
      writeOut: chunk => output.push(chunk),
      writeErr: chunk => output.push(chunk),
    })

    const result = await runCli(cli.program, ['node', 'luna'], cli.ports.output)

    expect(result.exitCode).toBe(0)
    expect(output.join('')).toContain('用法：')
    expect(output.join('')).toContain('快速开始：')
  })

  it.each([
    ['--version'],
    ['-V'],
    ['--lang', 'zh-CN', '--version'],
  ])('keeps version flags available to release smoke tests: %s', async (...args) => {
    const output: string[] = []
    const cli = createLunaCli({ version: '0.0.3-beta.1' })
    cli.program.configureOutput({
      writeOut: chunk => output.push(chunk),
      writeErr: chunk => output.push(chunk),
    })

    const result = await runCli(
      cli.program,
      ['node', 'luna', ...args],
      cli.ports.output,
    )

    expect(result.exitCode).toBe(0)
    expect(output.join('').trim()).toBe('0.0.3-beta.1')
  })
})
