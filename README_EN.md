# Luna CLI

[中文](./README.md)

Luna CLI is the command-line client for Luna DevOps. It is designed for both
interactive terminal use and automation agents:

```text
luna <category> <command> key=value
```

## Install

```bash
npm install --global @liteyuki/luna-cli
pnpm add --global @liteyuki/luna-cli
```

Prereleases use the `beta` npm dist-tag. Linux and macOS release assets are
available from [GitHub Releases](https://github.com/LiteyukiStudio/luna-cli/releases).
Windows and Alpine users should use the npm distribution with Node.js 22.14 or
later.

## Quick start

```bash
luna login
luna whoami
luna project get-projects
luna help catalog query=deployment limit=20 output=json
```

`luna login` uses OAuth Device Code authentication against
`https://devops.liteyuki.org` by default. Pass
`server=https://your-instance.example.com` to use another Luna DevOps instance.
For agents, use canonical two-level commands together with
`output=json interactive=false agent=true`.

Stored OAuth credentials are refreshed automatically by `auth status` and remote
commands when the access token is within 30 seconds of expiry or already expired.
Concurrent CLI processes coalesce the refresh so the refresh token is rotated only
once. `luna auth refresh` remains available for forced refresh and diagnostics;
routine use does not require it. `LUNA_TOKEN` and personal access tokens do not
participate in OAuth refresh. If the grant is invalid or a refresh outcome cannot
be confirmed safely, the CLI returns `oauth_refresh_reauthentication_required`,
blocks reuse of the old refresh token, and requires `luna login`. The safe
underlying classification is available only as `details.causeCode`.

The paired `luna-devops-<version>.skill` is published in the same GitHub Release
and must use the exact CLI version. The CLI remains fully usable without the
Skill.

## Agent observability diagnostics

Platform administrators can inspect cross-user Agent operations through the
stable `agent-observability` category. Discover the commands supported by both
the installed CLI and the server before loading a command's complete schema:

```bash
luna help catalog category=agent-observability limit=20 output=json interactive=false agent=true
luna help command path=agent-observability.overview output=json interactive=false agent=true
```

Start with `overview`, narrow anomalies through `turns` or `tools`, and inspect
specific evidence through `tool-calls` or `trace`. Lists require explicit bounded
pagination. Supported periods are `1h`, `6h`, `24h`, `7d`, `30d`, and `1y`.
These reads require a platform administrator and the
`agent-observability:read` scope. Source testing remains a human administrator
command and is unavailable in strict Agent mode.

JSON results use the common envelope with pagination, request IDs, and
correlation IDs. Before output, the CLI removes raw trace blobs, system prompts,
and controlled GenAI content. Raw conversations are not currently a stable CLI
capability.

## Tab completion

Luna CLI generates static shell completion from the same command registry used
for execution. Pressing Tab does not start Luna CLI or call the Luna API. The
script completes categories, canonical commands and aliases, `key=value`
parameters, enum values, and global options. Sensitive parameters are exposed
only as empty keys and never read credentials.

Zsh (the macOS default shell):

```bash
mkdir -p ~/.zfunc
luna completion zsh output=table > ~/.zfunc/_luna
# Ensure ~/.zshrc contains fpath=(~/.zfunc $fpath) before compinit.
exec zsh
```

Bash:

```bash
mkdir -p ~/.local/share/bash-completion/completions
luna completion bash output=table > ~/.local/share/bash-completion/completions/luna
```

Fish:

```fish
mkdir -p ~/.config/fish/completions
luna completion fish output=table > ~/.config/fish/completions/luna.fish
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force (Split-Path $PROFILE) | Out-Null
$completionFile = Join-Path (Split-Path $PROFILE) 'luna-completion.ps1'
luna completion powershell output=table | Set-Content -Encoding utf8 $completionFile
# Add this to $PROFILE once: . $completionFile
```

Regenerate the script after upgrading Luna CLI. Automation can keep using
`output=json` to receive structured `{ shell, script }` data.

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm check:contract
pnpm check:skills
LUNA_PLATFORM_ROOT=/path/to/luna-devops pnpm check:platform-coverage
```

To develop both repositories side by side, clone this repository into the
ignored `cli/` directory of a Luna DevOps checkout:

```bash
cd /path/to/luna-devops
git clone git@github.com:LiteyukiStudio/luna-cli.git cli
cd cli
pnpm install
pnpm sync:openapi
LUNA_PLATFORM_ROOT=.. pnpm check:platform-coverage
```

See the [CLI specification](./docs/cli-spec.md) and the
[documentation site](https://luna-devops.liteyuki.org/en/guide/cli/).
