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

First-party `luna-cli` Device Code login does not accept, display, or persist
user-selectable scopes. The server authorizes each CLI request from the user's
current platform role, project membership, and resource policy; the CLI does not
preflight a copied grant or generate a broader login command. Personal access
tokens, third-party OAuth apps, and Agent service identities remain restricted by
the endpoint scopes declared in OpenAPI, which are still shown in machine Help.

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

## Interactive release exec

After signing in with OAuth, connect the local TTY directly to a running
release container:

```bash
luna release exec projectId=prj_example releaseId=rel_example
luna release exec projectId=prj_example releaseId=rel_example container=api
```

The command keeps the interactive shell attached until `exit` or `Ctrl-D`, then
restores the local terminal. Terminal payloads remain binary so UTF-8 text, ANSI
control bytes, and window resize events are not reinterpreted by the CLI.
`release terminal` is a human-facing alias. This command requires an interactive
TTY, the `deployment:exec` scope, and the platform runtime-terminal authorization;
it is unavailable in `agent=true` mode.

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

## Project volumes

Volume CRUD, adoption, and transfer history use server-side pagination,
authorization, and stable error codes:

```bash
luna volume list page=1 pageSize=20
luna volume get volumeId=pvol_example
luna volume create body=@volume.json idempotencyKey=volume-create-001
luna volume adopt displayName=shared clusterId=cluster_example claimName=shared-pvc ownershipMode=referenced idempotencyKey=volume-adopt-001
luna volume update volumeId=pvol_example revision=3 capacity=20Gi
luna volume delete volumeId=pvol_example revision=3 dataAction=delete --yes
luna volume-transfer list page=1 pageSize=20
luna volume-transfer get transferId=vtx_example
luna volume-transfer retry transferId=vtx_example idempotencyKey=volume-retry-001 --yes
luna volume-transfer cancel transferId=vtx_example --yes
```

Local archive imports first create and verify an immutable private staging copy,
wait for the transfer to become `ready`, and then upload the complete archive
with one `PUT`. Exports wait for `ready`, exchange a one-time ticket, and download
the complete archive with one `GET`. Neither flow supports resuming an interrupted
stream:

```bash
luna volume import file=backup.tar.gz displayName=data clusterId=cluster_example capacity=10Gi storageClassName=standard idempotencyKey=volume-import-001
luna volume export volumeId=pvol_example destination=backup.tar.gz consistency=auto idempotencyKey=volume-export-001
luna volume export volumeId=pvol_block destination=block.raw.zst format=raw_zst consistency=snapshot idempotencyKey=volume-export-block-001
luna volume export transferId=vtx_example destination=backup.tar.gz
```

Import staging needs additional local free space roughly equal to the archive
size. After verification, the copy is detached from the filesystem namespace
before any remote transfer is created and retained only through a read-only file
handle; closing that handle releases the space on both success and failure. If
the local filesystem cannot detach the staging file safely, the CLI stops before
creating the remote resource. When the same idempotency key replays a
`succeeded` transfer, the CLI converges only if its direction, lengths, and
SHA-256 exactly match the current staging copy. It never replays the one-shot
`PUT` for a `streaming` transfer.

The CLI does not persist transfer state or one-time tickets. Exports stage the
complete archive in a randomly named private transaction directory beside the
destination. On systems that support POSIX modes, the directory and files use
`0700` and `0600`, respectively. The CLI atomically commits only after verifying
length, SHA-256, and file identity. If authoritative readback, the Block manifest,
or commit fails, `recoveryPath` / `recoveryPaths` list only reverified private
recovery files; identity conflicts that cannot be verified are reported as
`preservedUnknownPaths`. The CLI never creates a public `<destination>.part`, but
reserves that name and the Block sidecar's `.part` name as conflict guards. Any
file already there or appearing during transfer is preserved, including with
`overwrite=true`. Export stops before requesting a one-time ticket when the
filesystem cannot provide reliable file identities or safe hard links.
Safe recovery also assumes that the same operating-system account does not move
or replace the destination's parent directory while the command runs. If that
happens, the CLI stops and reports paths it cannot reverify as unknown rather
than claiming that they are usable recovery files.

Progress is emitted only for human table output, so JSON and Agent output remain
stable. A Block-volume `raw_zst` export obtains a separate one-time ticket for the
manifest, verifies it, and commits the archive together with the matching
`<archive>.manifest.json` sidecar. Filesystem exports do not request a sidecar.
Import and export require local-file access and are not available in Agent mode.
