# Luna CLI

[English](./README_EN.md)

Luna CLI 是 Luna DevOps 的命令行客户端，面向终端用户和自动化 Agent。命令采用固定的两级结构：

```text
luna <工具分类> <具体工具> key=value
```

English documentation follows the Chinese section.

## 当前状态

CLI 目前处于预发布阶段。源码清单使用 `0.0.0-development` 占位版本和 `private: true` 防误发布，实际版本由 `v*` tag 在发布时注入。仓库中已经实现：

- 单一活动实例、账号凭据和默认项目空间的配置模型与本地存储；
- 默认使用 OAuth Device Code 登录、自动刷新与尽力吊销，并支持显式的个人访问令牌备用登录；
- `key=value`、JSON、文件和标准输入参数解析；
- 人类可读输出与稳定 JSON Envelope；
- 本地命令注册、帮助目录、Shell Completion 和 OpenAPI 命令注册器；
- 从 OpenAPI 生成并注册普通业务 HTTP 命令，并为特殊传输提供显式协议命令；
- 面向人类的 `login`、`logout`、`whoami`、`doctor` 顶层短命令；
- 检查当前登录、认证、服务端版本、OpenAPI 契约和能力开关的 `health doctor` 诊断；
- 在每个 OpenAPI 业务命令前自动协商 API 代际和最低 CLI 版本，并记录精确契约摘要供诊断；
- npm 包、Linux/macOS Bun 独立二进制的 CI、打包、安装 smoke 与发布门禁。

`src/entry.ts` 已作为 npm 与 Bun 二进制的统一入口，共享契约和客户端会被安全打包进发布产物。预发布版本已经发布到 npm，且发布产物会经过 npm/pnpm 全局安装、中文帮助、机器 Help 和受支持独立二进制的 smoke。

普通 OpenAPI 业务命令会自动读取 `/api/v1/meta`，在 API 代际不受支持或 CLI
低于服务端最低版本时 fail closed。精确 OpenAPI 摘要不同通常表示服务端新增了接口
或更新了契约，不会阻断同一 API 代际的已有命令；`luna doctor` 会将其作为诊断警告。
标记为 hidden 的浏览器回调、
Webhook、内部接收器和底层协议操作不会注册为 canonical raw command，SSE、
下载和终端等能力只通过对应的专用协议命令提供。`high` 和 `critical` 风险操作
在交互终端中必须逐次明确确认；非交互或 Agent 模式必须显式传入 `--yes`，
否则以稳定的 `confirmation_required` 错误拒绝。CLI 的确认只表示调用意图，
后端权限、Scope 与 Step-up MFA 仍是最终安全裁决。通用 `api request` 仅保留为
人类诊断逃生口，不参与业务能力伪装。终端要求 CLI OAuth 登录与对应 purpose
的有效 Step-up；个人访问令牌不能满足或绕过这一协议授权。
`luna login` 默认只请求当前角色适用的常用 Scope；敏感 Scope 需要用户明确
重新授权。已知命令会在发请求前检查 OAuth Grant，缺少 Scope 时返回
`oauth_scope_required` 和可直接执行的 `luna login scope=...` 提示。
命令元数据尚未声明 Scope 时，CLI 会使用服务端拒绝响应中的 `requiredScope`
生成同样的重新授权提示。
Scope 只表达调用能力，不能替代项目空间角色和后端权限检查。
本地存储的 OAuth 凭据会在 Access Token 到期前 30 秒或已经过期时，
由 `auth status` 和远程命令自动刷新；多个 CLI 进程会合并同一轮刷新，
避免重复旋转 Refresh Token。`luna auth refresh` 仅用于强制手动刷新或
认证诊断，日常使用无需执行。`LUNA_TOKEN` 和个人访问令牌不参与 OAuth
刷新。若 Grant 已失效，或刷新请求已发出但结果无法安全确认，CLI 会返回
`oauth_refresh_reauthentication_required` 并禁止再次使用旧 Refresh Token；
此时需要重新执行 `luna login`。原始分类只作为安全的 `details.causeCode` 诊断信息。
覆盖数量与比例不在本文维护，以 `pnpm check:platform-cli-coverage` 的实时输出为准。

## 安装

可以通过 npm 或 pnpm 安装预发布通道：

```bash
npm install --global @liteyuki/luna-cli@beta
pnpm add --global @liteyuki/luna-cli@beta
```

也可以从 GitHub Release 下载独立二进制。稳定版当前只计划发布经过目标环境 smoke test 的 Linux glibc 制品；macOS 在接入代码签名与公证之前，只会在预发布版本提供名称带 `-unsigned` 的测试制品。Windows 与 Alpine/musl 请使用 npm 或 pnpm 安装，并通过 Node.js `22.14.0` 或更高版本运行。

## 不依赖 Skills 使用

CLI 自带面向人类的分层帮助，不需要先安装 AI Skills：

```bash
luna
luna --help
luna login
luna login server=https://devops.example.com
printf '%s' "$LUNA_TOKEN" | luna login mode=access-token token=@-
luna whoami
luna doctor
luna logout
luna project --help
luna project get-projects --help
```

这些顶层短命令只面向人类交互，分别复用 `auth login`、`auth status`、
`health doctor` 和 `auth logout` 的同一处理器。脚本与 AI 应使用 canonical
两级命令；严格 `agent=true` 模式会拒绝顶层别名，避免审计和机器契约出现两套路径。

直接运行 `luna` 且不传子命令时，会显示同一份本地化根帮助，不会执行远程操作。第一级列出分类和快速开始，第二级列出分类内工具，第三级显示接口、权限、风险、参数来源、必填项和示例。业务参数统一使用 `key=value`；JSON、文件或多行文本使用 `key=@file.json` 或 `key=@-`。

未指定 `server` 时，`luna login` 固定登录官方实例
`https://devops.liteyuki.org`。登录其他实例时必须显式传入
`server=https://...`；再次登录会覆盖本地现有的实例、凭据和默认项目空间。
CLI 不提供 context 切换机制，一个本地配置始终只表示一个活动登录。

语言解析顺序为：`--lang`、`LUNA_LANG`、本地配置的 `language`、系统
`LC_ALL` / `LC_MESSAGES` / `LANG`、运行时语言，最后回退英文。例如：

```bash
LUNA_LANG=zh-CN luna --help
luna --lang zh-CN project get-projects --help
```

## Agent 可观测诊断

平台管理员可以通过稳定的 `agent-observability` 分类读取跨用户 Agent 运营数据。先动态发现当前 CLI 和服务端共同支持的命令，再读取目标命令的完整 Schema：

```bash
luna help catalog category=agent-observability limit=20 output=json interactive=false agent=true
luna help command path=agent-observability.overview output=json interactive=false agent=true
```

建议按 `overview` → `turns` / `tools` → `tool-calls` / `trace` 逐步缩小范围。列表必须显式传入有界分页，时间范围仅支持 `1h`、`6h`、`24h`、`7d`、`30d` 和 `1y`。这些读操作要求平台管理员身份和 `agent-observability:read` Scope；数据源测试是人工管理员命令，严格 Agent 模式不会执行。

JSON 输出保留统一 Envelope、分页元数据、request ID 和 correlation ID。CLI 会在输出前移除原始 Trace blob、System Prompt 和受控 GenAI 内容；原始对话暂不是稳定 CLI 能力。

## Tab 补全

Luna CLI 从同一份命令注册表生成静态 Shell Completion，不会在每次按 Tab 时启动 CLI 或请求 Luna API。补全覆盖分类、命令与别名、`key=value` 参数、枚举值和全局选项；敏感参数只会提示空的 key，不读取凭据。

Zsh（macOS 默认 Shell）：

```bash
mkdir -p ~/.zfunc
luna completion zsh output=table > ~/.zfunc/_luna
# 确保 ~/.zshrc 在 compinit 之前包含：fpath=(~/.zfunc $fpath)
exec zsh
```

Bash：

```bash
mkdir -p ~/.local/share/bash-completion/completions
luna completion bash output=table > ~/.local/share/bash-completion/completions/luna
```

Fish：

```fish
mkdir -p ~/.config/fish/completions
luna completion fish output=table > ~/.config/fish/completions/luna.fish
```

PowerShell：

```powershell
New-Item -ItemType Directory -Force (Split-Path $PROFILE) | Out-Null
$completionFile = Join-Path (Split-Path $PROFILE) 'luna-completion.ps1'
luna completion powershell output=table | Set-Content -Encoding utf8 $completionFile
# 仅需在 $PROFILE 中添加一次：. $completionFile
```

升级 Luna CLI 后重新生成一次脚本，即可同步最新命令契约。`output=json` 仍保留给自动化消费结构化的 `{ shell, script }` 数据。

npm 的 `latest` 与 `beta` 是独立更新通道。测试预发布版本时必须显式安装
`@beta`，普通的全局更新不会从稳定版自动切换到预发布版。

AI Skills 会在此基础上使用
`luna help catalog ... output=json interactive=false agent=true` 和
`luna help command ... output=json interactive=false agent=true`
获取稳定 JSON 契约。Skill 发起的每条命令都固定使用这三个参数，不依赖本地
默认输出或交互状态；CLI 本身不依赖 Skills。
Skills 与 CLI 使用相同版本并由同一个 `v*` GitHub Release 发布，安装时
必须选择与本地 CLI 完全相同版本的
`luna-devops-<version>.skill`。该文件内部按领域拆分 `references/`，由 Agent
根据任务按需加载，不需要分别安装多个 Skill。

详细说明：

- [中文 CLI 文档](https://luna-devops.liteyuki.org/guide/cli/)
- [English CLI documentation](https://luna-devops.liteyuki.org/en/guide/cli/)
- [完整设计规格](./docs/cli-spec.md)

## 开发验证

从仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
node --test scripts/cli/tests/*.test.mjs
node scripts/cli/verify-skills-sync.mjs
```

需要和 Luna DevOps 本地联调时，可以把本仓库克隆到平台仓库中被忽略的
`cli/` 目录：

```bash
cd /path/to/luna-devops
git clone git@github.com:LiteyukiStudio/luna-cli.git cli
cd cli
pnpm install
pnpm sync:openapi
LUNA_PLATFORM_ROOT=.. pnpm check:platform-coverage
```

`v*` tag 只发布 Luna CLI 与同版本 Skill。Luna DevOps 平台在
`LiteyukiStudio/luna-devops` 仓库独立发版。

---

## English

Luna CLI is the command-line client for Luna DevOps, designed for both people and automation agents:

```text
luna <category> <tool> key=value
```

### Current status

The CLI is in prerelease. The source manifest uses the `0.0.0-development` placeholder and `private: true` to prevent accidental publication; release versions are injected from `v*` tags. It includes one active server/account login, OAuth Device Code authentication with refresh and revocation, an explicit personal-access-token fallback, a default project, structured input and output, OpenAPI-generated business commands, dedicated protocol commands, command discovery, and release validation. Live coverage totals and ratios come only from `pnpm check:platform-cli-coverage`.

`src/entry.ts` is the shared npm and Bun entry point, and workspace packages are bundled safely into the distribution. Prereleases are available on npm and pass npm/pnpm global-install, localized Help, machine Help, and supported standalone-binary smoke tests.

Canonical OpenAPI commands automatically negotiate the API generation and
minimum CLI version through `/api/v1/meta`. The exact OpenAPI digest is
diagnostic metadata: `luna doctor` reports a mismatch, while compatible
commands in the same API generation remain available. Hidden browser callbacks,
webhooks, internal receivers,
and low-level protocol operations are not registered as canonical raw commands;
SSE, downloads, and terminals are exposed only through their dedicated protocol
commands. High- and critical-risk operations require an explicit interactive
confirmation, or `--yes` in non-interactive and agent mode. CLI confirmation
records caller intent only: server permissions, scopes, and step-up MFA remain
authoritative. Terminal protocols require a CLI OAuth login and a valid step-up
assertion for the matching purpose; personal access tokens cannot
satisfy or bypass that authorization. `luna login` requests only common scopes
appropriate for the current role; sensitive scopes require explicit
reauthorization. Known commands check the active OAuth grant before sending a
request and return `oauth_scope_required` with a runnable login command when a
scope is missing. Scopes never replace project roles or backend authorization.
Generic `api request` remains a human-only diagnostic escape hatch.
Stored OAuth credentials are refreshed automatically by `auth status` and remote
commands when the access token is within 30 seconds of expiry or already expired.
Concurrent CLI processes coalesce the refresh so the refresh token is rotated only
once. `luna auth refresh` remains available for forced refresh and diagnostics;
routine use does not require it. `LUNA_TOKEN` and personal access tokens do not
participate in OAuth refresh. If the grant is invalid or a refresh outcome cannot
be confirmed safely, the CLI returns `oauth_refresh_reauthentication_required`,
blocks reuse of the old refresh token, and requires `luna login`. The safe
underlying classification is available only as `details.causeCode`.

### Installation

```bash
npm install --global @liteyuki/luna-cli@beta
pnpm add --global @liteyuki/luna-cli@beta
```

Standalone binaries will also be attached to GitHub Releases. Stable releases currently include only Linux glibc binaries that pass target-environment smoke tests. Until Apple signing is configured, macOS binaries are available only on prereleases and are explicitly suffixed with `-unsigned`. Windows and Alpine/musl use the npm or pnpm distribution on Node.js `22.14.0` or later.

See the documentation links above for installation, release channels, checksums, SBOMs, provenance, and current limitations.

The CLI includes layered human Help without requiring Skills:

```bash
luna
luna --help
luna login
luna login server=https://devops.example.com
printf '%s' "$LUNA_TOKEN" | luna login mode=access-token token=@-
luna whoami
luna doctor
luna logout
luna project --help
luna project get-projects --help
```

The four root shortcuts reuse the canonical `auth login`, `auth status`,
`health doctor`, and `auth logout` handlers. Scripts and agents must use the
canonical two-level paths; strict Agent mode rejects root aliases.

Running `luna` without a subcommand displays the same localized root Help and
does not perform a remote operation. A bare `luna login` always targets the
official `https://devops.liteyuki.org` instance. Pass `server=https://...` to
log in elsewhere; a new login replaces the locally active server, credential,
and default project. There is no context-switching layer. Locale precedence is
`--lang`, `LUNA_LANG`, configured `language`, system locale, then English. Use
`LUNA_LANG=zh-CN luna --help` for Chinese. npm `latest` and `beta` are separate
update channels, so prerelease testing must explicitly install `@beta`. Skills
build on the CLI's machine-readable Help for more precise agent operation; the
CLI does not depend on Skills. Skills use the exact same version and ship in the
same `v*` GitHub Release as the CLI.
