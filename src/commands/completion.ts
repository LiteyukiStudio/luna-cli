import type { CommandRegistry } from './registry.js'
import type { CommandParameter, NormalizedCommandMetadata } from './types.js'
import { GLOBAL_CONTROL_KEYS, OUTPUT_FORMATS } from '../input/globals.js'
import { ROOT_COMMAND_SHORTCUTS } from './shortcuts.js'

export type CompletionShell = 'bash' | 'zsh' | 'fish' | 'powershell'

interface CompletionCommand {
  readonly category: string
  readonly tool: string
  readonly paths: readonly string[]
  readonly candidates: readonly string[]
}

interface CompletionSpec {
  readonly categories: readonly string[]
  readonly shortcuts: readonly string[]
  readonly tools: Readonly<Record<string, readonly string[]>>
  readonly commands: readonly CompletionCommand[]
}

const STATIC_VALUE_CANDIDATE = /^\w[\w.:/-]*$/
const BOOLEAN_VALUES = Object.freeze(['false', 'true'])
const GLOBAL_VALUE_OPTIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  agent: BOOLEAN_VALUES,
  color: BOOLEAN_VALUES,
  debug: BOOLEAN_VALUES,
  dryRun: ['client', 'server'],
  insecureSkipTlsVerify: BOOLEAN_VALUES,
  interactive: BOOLEAN_VALUES,
  lang: ['en-US', 'zh-CN'],
  output: OUTPUT_FORMATS,
  quiet: BOOLEAN_VALUES,
  yes: BOOLEAN_VALUES,
})
const GLOBAL_FLAGS = Object.freeze([
  '--agent',
  '--debug',
  '--dry-run=',
  '--help',
  '--idempotency-key=',
  '--insecure-skip-tls-verify',
  '--lang=',
  '--no-color',
  '--no-interactive',
  '--output=',
  '--project=',
  '--quiet',
  '--request-id=',
  '--server=',
  '--timeout=',
  '--version',
  '--yes',
  '-V',
  '-h',
  '-o=',
  '-y',
])
const GLOBAL_CANDIDATES = Object.freeze([
  ...GLOBAL_CONTROL_KEYS.flatMap((key) => {
    const values = GLOBAL_VALUE_OPTIONS[key]
    return values ? values.map(value => `${key}=${value}`) : [`${key}=`]
  }),
  ...GLOBAL_FLAGS,
].sort((left, right) => left.localeCompare(right)))

export function generateCompletion(shell: CompletionShell, registry: CommandRegistry): string {
  const spec = completionSpec(registry)
  switch (shell) {
    case 'bash':
      return bashCompletion(spec)
    case 'zsh':
      return zshCompletion(spec)
    case 'fish':
      return fishCompletion(spec)
    case 'powershell':
      return powershellCompletion(spec)
  }
}

function completionSpec(registry: CommandRegistry): CompletionSpec {
  const commands = registry.list({ includeHidden: false })
  const categories = registry.categories().filter(category =>
    commands.some(command => command.metadata.category === category),
  )
  const tools: Record<string, string[]> = {}
  const completionCommands: CompletionCommand[] = []

  for (const category of categories) {
    const categoryCommands = commands.filter(command => command.metadata.category === category)
    const categoryNames = [category, ...registry.categoryAliases(category)]
    const categoryTools = sortedUnique(categoryCommands.flatMap(command => [
      command.metadata.tool,
      ...command.metadata.aliases.filter(alias =>
        registry.get(`${category}.${alias}`, true) === command),
    ]))
    for (const categoryName of categoryNames)
      tools[categoryName] = categoryTools
    for (const command of categoryCommands) {
      const toolNames = [
        command.metadata.tool,
        ...command.metadata.aliases.filter(alias =>
          registry.get(`${category}.${alias}`, true) === command),
      ]
      completionCommands.push({
        category,
        tool: command.metadata.tool,
        paths: sortedUnique(categoryNames.flatMap(categoryName =>
          toolNames.map(toolName => `${categoryName}.${toolName}`))),
        candidates: commandCandidates(command.metadata),
      })
    }
  }

  for (const shortcut of ROOT_COMMAND_SHORTCUTS) {
    const command = registry.get(shortcut.target)
    if (!command)
      continue
    completionCommands.push({
      category: '',
      tool: shortcut.name,
      paths: [shortcut.name],
      candidates: commandCandidates(command.metadata),
    })
  }

  return {
    categories: sortedUnique(categories.flatMap(category => [
      category,
      ...registry.categoryAliases(category),
    ])),
    shortcuts: ROOT_COMMAND_SHORTCUTS
      .filter(shortcut => registry.get(shortcut.target))
      .map(shortcut => shortcut.name),
    tools,
    commands: completionCommands,
  }
}

function commandCandidates(metadata: NormalizedCommandMetadata): readonly string[] {
  return sortedUnique(metadata.parameters.flatMap(parameterCandidates))
}

function parameterCandidates(parameter: CommandParameter): readonly string[] {
  if (!STATIC_VALUE_CANDIDATE.test(parameter.name))
    return []
  if (parameter.sensitive)
    return [`${parameter.name}=`]
  const values = schemaValues(parameter.schema)
  return values.length > 0
    ? values.map(value => `${parameter.name}=${value}`)
    : [`${parameter.name}=`]
}

function schemaValues(schema: CommandParameter['schema']): readonly string[] {
  if (!schema)
    return []
  const enumValues = Array.isArray(schema.enum)
    ? schema.enum.filter((value): value is string | number | boolean =>
        (typeof value === 'string' && STATIC_VALUE_CANDIDATE.test(value))
        || typeof value === 'number'
        || typeof value === 'boolean')
    : []
  if (enumValues.length > 0)
    return enumValues.map(String)
  return schema.type === 'boolean' ? BOOLEAN_VALUES : []
}

function bashCompletion(spec: CompletionSpec): string {
  const toolCases = Object.entries(spec.tools)
    .map(([category, tools]) => `      ${category}) candidates="${tools.join(' ')}" ;;`)
    .join('\n')
  const commandCases = spec.commands
    .map(command => `      ${command.paths.join('|')}) candidates="${command.candidates.join(' ')}" ;;`)
    .join('\n')
  return `# Luna CLI completion (generated from the command registry)
_luna_completion() {
  local cur category tool path candidates
  cur="\${COMP_WORDS[COMP_CWORD]}"
  category="\${COMP_WORDS[1]}"
  tool="\${COMP_WORDS[2]}"

  if [[ \${COMP_CWORD} -eq 1 ]]; then
    candidates="${[...spec.categories, ...spec.shortcuts, ...GLOBAL_FLAGS].join(' ')}"
  elif [[ \${COMP_CWORD} -eq 2 && ! " ${spec.shortcuts.join(' ')} " =~ " \${category} " ]]; then
    case "$category" in
${toolCases}
      *) candidates="${GLOBAL_FLAGS.join(' ')}" ;;
    esac
  else
    if [[ " ${spec.shortcuts.join(' ')} " =~ " \${category} " ]]; then
      path="$category"
    else
      path="$category.$tool"
    fi
    case "$path" in
${commandCases}
      *) candidates="" ;;
    esac
    candidates="$candidates ${GLOBAL_CANDIDATES.join(' ')}"
  fi

  COMPREPLY=( $(compgen -W "$candidates" -- "$cur") )
  if [[ \${#COMPREPLY[@]} -eq 1 && "\${COMPREPLY[0]}" == *= ]]; then
    compopt -o nospace 2>/dev/null || true
  fi
}
complete -o nosort -F _luna_completion luna
`
}

function zshCompletion(spec: CompletionSpec): string {
  const toolCases = Object.entries(spec.tools)
    .map(([category, tools]) => `      ${category}) candidates=(${tools.join(' ')}) ;;`)
    .join('\n')
  const commandCases = spec.commands
    .map(command => `      ${command.paths.join('|')}) candidates=(${command.candidates.join(' ')}) ;;`)
    .join('\n')
  return `#compdef luna
# Luna CLI completion (generated from the command registry)
_luna() {
  local category tool path
  local -a candidates
  category="$words[2]"
  tool="$words[3]"

  if (( CURRENT == 2 )); then
    candidates=(${[...spec.categories, ...spec.shortcuts, ...GLOBAL_FLAGS].join(' ')})
  elif (( CURRENT == 3 )) && [[ " ${spec.shortcuts.join(' ')} " != *" $category "* ]]; then
    case "$category" in
${toolCases}
      *) candidates=(${GLOBAL_FLAGS.join(' ')}) ;;
    esac
  else
    if [[ " ${spec.shortcuts.join(' ')} " == *" $category "* ]]; then
      path="$category"
    else
      path="$category.$tool"
    fi
    case "$path" in
${commandCases}
      *) candidates=() ;;
    esac
    candidates+=(${GLOBAL_CANDIDATES.join(' ')})
  fi

  local candidate
  for candidate in $candidates; do
    if [[ "$candidate" == *= ]]; then
      compadd -Q -S '' -- "$candidate"
    else
      compadd -Q -- "$candidate"
    fi
  done
}
_luna "$@"
`
}

function fishCompletion(spec: CompletionSpec): string {
  const categoryLines = spec.categories
    .map(category => `complete -c luna -f -n '__luna_at_root' -a '${category}'`)
  const shortcutLines = spec.shortcuts
    .map(shortcut => `complete -c luna -f -n '__luna_at_root' -a '${shortcut}'`)
  const toolLines = Object.entries(spec.tools).flatMap(([category, tools]) =>
    tools.map(tool => `complete -c luna -f -n '__luna_needs_tool ${category}' -a '${tool}'`),
  )
  const commandLines = spec.commands.map((command) => {
    const paths = command.paths.join(' ')
    return `complete -c luna -f -n '__luna_uses_command ${paths}' -a '${command.candidates.join(' ')}'`
  })
  return `# Luna CLI completion (generated from the command registry)
function __luna_at_root
  test (count (commandline -opc)) -eq 1
end

function __luna_needs_tool
  set -l tokens (commandline -opc)
  test (count $tokens) -eq 2; and test "$tokens[2]" = "$argv[1]"
end

function __luna_uses_command
  set -l tokens (commandline -opc)
  if test (count $tokens) -eq 2
    contains -- "$tokens[2]" $argv
  else if test (count $tokens) -ge 3
    contains -- "$tokens[2].$tokens[3]" $argv
  else
    return 1
  end
end

function __luna_has_command
  set -l tokens (commandline -opc)
  test (count $tokens) -ge 3; or contains -- "$tokens[2]" ${spec.shortcuts.join(' ')}
end

${[...categoryLines, ...shortcutLines, ...toolLines, `complete -c luna -f -n '__luna_has_command' -a '${GLOBAL_CANDIDATES.join(' ')}'`, ...commandLines].join('\n')}
`
}

function powershellCompletion(spec: CompletionSpec): string {
  const serialized = psSingleQuoted(JSON.stringify(spec))
  return `# Luna CLI completion (generated from the command registry)
Register-ArgumentCompleter -Native -CommandName luna -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $spec = ConvertFrom-Json '${serialized}' -AsHashtable
  $elements = @($commandAst.CommandElements | ForEach-Object { $_.Value })
  $category = if ($elements.Count -gt 1) { $elements[1] } else { '' }
  $tool = if ($elements.Count -gt 2) { $elements[2] } else { '' }
  $globalFlags = @(${GLOBAL_FLAGS.map(value => `'${value}'`).join(', ')})

  if ($elements.Count -le 2) {
    $candidates = @($spec.categories) + @($spec.shortcuts) + $globalFlags
  } elseif ($elements.Count -eq 3 -and -not @($spec.shortcuts).Contains($category)) {
    $candidates = if ($spec.tools.ContainsKey($category)) { @($spec.tools[$category]) } else { $globalFlags }
  } else {
    $path = if (@($spec.shortcuts).Contains($category)) { $category } else { "$category.$tool" }
    $command = @($spec.commands) | Where-Object { @($_.paths).Contains($path) } | Select-Object -First 1
    $candidates = if ($null -ne $command) { @($command.candidates) + @(${GLOBAL_CANDIDATES.map(value => `'${value}'`).join(', ')}) } else { $globalFlags }
  }

  $candidates | Where-Object { $_ -like "$wordToComplete*" } | Sort-Object -Unique |
    ForEach-Object { [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_) }
}
`
}

function psSingleQuoted(value: string): string {
  return value.replaceAll('\'', '\'\'')
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}
