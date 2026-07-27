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

The paired `luna-devops-<version>.skill` is published in the same GitHub Release
and must use the exact CLI version. The CLI remains fully usable without the
Skill.

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
