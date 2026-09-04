# Luna CLI 架构与协议约束

本文只记录 Luna CLI 的稳定架构、协议边界和安全约束。用户操作说明见
[中文 README](../README.md)、[English README](../README_EN.md) 与
[公开 CLI 文档](https://luna-devops.liteyuki.org/guide/cli/)；命令、参数、
接口数量、发布步骤和测试结果以代码及自动化门禁为准，不在本文复制快照。

## 1. 产品边界

Luna CLI 是 Luna DevOps 的命令行客户端，也是自动化与 AI Agent 的确定性执行层。
它负责：

- 登录一个 Luna DevOps 实例并调用平台公开能力；
- 把 OpenAPI 业务接口映射为稳定、可发现的命令；
- 为 SSE、WebSocket、上传和下载提供显式协议适配器；
- 为人类输出可读结果，为脚本和 Agent 输出稳定结构；
- 在本地保护凭据、终端状态和下载文件。

CLI 不直接访问 GitHub、Gitea、Registry 或 Kubernetes，也不复制平台授权逻辑。
第三方平台适配、资源权限、审计、MFA 和最终副作用都由 Luna DevOps 服务端完成。

首版保持静态命令目录，不引入插件运行时、自治循环、长期记忆、Shell 求值器或
通用工作流解释器。`api request` 仅是人工诊断入口，不替代正式业务命令。

## 2. 权威来源

同一事实出现冲突时，按下表判断：

| 事实 | 权威来源 |
| --- | --- |
| 平台路径、Schema、错误响应、接口安全元数据 | [`openapi/openapi.yaml`](../openapi/openapi.yaml) |
| OpenAPI 快照与命令目录生成规则 | [`packages/api-contract`](../packages/api-contract/) |
| 本地命令、别名和协议命令 | [`src/commands`](../src/commands/) |
| 登录与刷新行为 | [`src/auth`](../src/auth/) |
| 活动配置与凭据持久化 | [`src/config`](../src/config/) |
| 输出 Envelope、渲染和脱敏 | [`src/output`](../src/output/) 与 [`src/errors`](../src/errors/) |
| Agent 使用方法 | [`skills/luna-devops`](../skills/luna-devops/) |
| 可执行门禁 | [`package.json`](../package.json) 中的 `check:*` 脚本 |

`openapi/openapi.yaml` 是平台契约的同步快照，不在 CLI 仓库手工维护另一份接口定义。
生成文件只由同步和生成脚本更新，不手工修改。

## 3. 运行时架构

```text
src/entry.ts
  -> 命令执行器
  -> CommandRegistry
       -> local：本地配置、认证、帮助和诊断
       -> openapi：普通业务 HTTP 调用
       -> protocol：SSE、WebSocket、上传、下载和复合调用
  -> 输入校验 / API Client / 协议 Transport
  -> 统一输出或稳定错误
```

### 3.1 包职责

- `packages/api-contract` 读取 OpenAPI 快照，生成 TypeScript 类型与操作目录。
- `packages/api-client` 提供环境无关的 HTTP Client，不读取终端、本地文件或浏览器状态。
- `src` 负责 Node.js/Bun 运行时、命令执行、本地凭据、协议流和输出适配。
- `skills/luna-devops` 只编排已存在的 CLI 能力，不成为第二套命令或权限目录。

CLI 不导入平台 Web 前端代码。需要共享的纯契约能力位于 `packages/`，终端和文件系统
逻辑留在 `src`。

### 3.2 依赖方向

命令元数据依赖 API 契约；执行器依赖抽象端口；具体网络、配置、输入和输出实现注入
执行器。`packages/api-client` 不反向依赖 CLI 命令层，协议适配器不在普通 HTTP Client
里伪装成 JSON 请求。

## 4. 命令契约

### 4.1 固定命令结构

正式命令使用固定两级结构：

```text
luna <category> <tool> key=value
```

命令只有三个来源：

- `local`：无需映射平台 operation 的本地行为；
- `openapi`：从一个公开 OpenAPI operation 生成的普通业务命令；
- `protocol`：消费一个或多个 operation 的专用传输或复合命令。

OpenAPI 命令必须有 `operationId`。协议命令必须声明其消费的 operation，避免同一平台
能力被重复注册。隐藏的回调、Webhook、内部接收器和底层协议端点不作为 raw command
暴露。

顶层 `login`、`logout`、`whoami`、`doctor` 是人工快捷入口。机器和 Agent 使用
canonical 两级路径；严格 Agent 模式不依赖人工别名。

### 4.2 输入

简单值使用 `key=value`。复杂 JSON、长文本和敏感值可从文件或标准输入读取，避免
不必要地进入 Shell 历史和进程参数。输入在发起请求前按命令 Schema 校验，未知字段、
缺少必填字段或类型不匹配均返回稳定 CLI 错误。

项目空间参数可从当前活动项目补全，但服务端仍以请求中的真实资源和当前用户关系做
权限判断。幂等键、超时、输出格式等公共行为由执行器统一处理，不在每个命令重复实现。

### 4.3 帮助与发现

`CommandRegistry` 同时驱动人工 Help、机器 Help、Completion 和执行。Agent 先用
`help catalog` 过滤候选命令，再用 `help command` 获取完整 Schema，不能解析彩色
帮助文本或一次加载全部命令。

目录摘要用于发现和缓存失效，不授予权限。命令是否可执行始终以服务端当前授权为准。

## 5. 登录、权限与凭据

### 5.1 一个活动登录

本地配置只保存一个活动服务端、一个账号凭据和一个默认项目空间。再次登录会整体替换
当前登录；CLI 不维护 context 切换层。服务端 URL 规范化为 origin，不接受内嵌账号密码、
查询参数或 fragment。

未显式指定服务端时，CLI 使用 `https://devops.liteyuki.org`。其他实例必须通过登录参数
明确指定。

### 5.2 第一方 CLI 登录

默认登录使用第一方 Luna CLI 的 OAuth Device Code 流程。第一方登录不接受、不展示、
不持久化用户可选 Scope，也不在本地保存权限副本。CLI 登录后的能力与当前用户一致：
每次请求都由服务端根据平台角色、项目成员关系、资源策略和实时状态裁决。

本地 Help、按钮提示或命令风险级别不能替代 RBAC。CLI 确认只表达调用意图；后端权限、
审计和需要时的 Step-up MFA 是最终裁决。

### 5.3 其他身份类型

个人访问令牌是显式备用登录方式；第三方 OAuth 应用和 Agent 服务身份仍按服务端及
OpenAPI 声明的接口 Scope 限权。Scope 不能扩大项目成员角色或资源归属。个人访问令牌
不能绕过仅允许第一方 OAuth 会话和 Step-up 的终端授权。

环境变量 `LUNA_TOKEN` 仅覆盖当前进程，不写入配置，也不参与 OAuth 刷新。

### 5.4 刷新一致性

OAuth 凭据临近过期或已经过期时，认证状态查询和远程命令可自动刷新。并发 CLI 进程
通过凭据刷新临界区合并同一轮旋转，避免重复使用 Refresh Token。

刷新只有在能确认当前配置仍是发起刷新时观察到的同一登录时才提交。Grant 明确失效，
或刷新请求已发出但结果无法安全确认时，旧 Refresh Token 不再继续使用，CLI 要求重新
登录。个人访问令牌不进入这条刷新链路。

### 5.5 本地持久化

配置写入使用同目录私有临时文件、刷新到磁盘并原子替换目标。支持 POSIX mode 的系统上，
配置与锁文件限制为 `0600`，配置目录限制为 `0700`；读取和写入都会拒绝不安全的文件
类型、所有者或权限。无法提供可靠凭据 ACL 的 Windows 环境拒绝持久化凭据。

Token 不出现在普通状态输出、日志或错误详情中。诊断关联只使用不可逆指纹，不传播原值。

## 6. API 契约与兼容性

普通业务调用由 OpenAPI 的路径、参数、请求体、响应和错误 Schema 驱动。CLI 不根据
本地化 message 推断错误；流程分支使用稳定 `code` 和结构化字段。

发起 OpenAPI 业务命令前，CLI 读取 `/api/v1/meta`：

- API 代际不受支持时拒绝调用；
- 当前 CLI 低于服务端最低版本时拒绝调用；
- OpenAPI digest 不同只作为契约漂移诊断，不在同一兼容代际内擅自禁用已有命令。

HTTP 重定向不会携带凭据继续跟随到未知目标。TLS 默认严格校验；任何调试例外都必须
显式启用，不能成为持久化的隐式降级。

## 7. 输出与错误

### 7.1 通道

- stdout 只承载成功结果或明确的流式数据；
- stderr 承载提示、进度、警告和错误；
- 退出码表达成功、调用错误、认证错误和本地执行失败。

机器输出使用稳定 Envelope，并保留 schema version、request ID、correlation ID 与分页
元数据。人类表格可以本地化和调整展示，但不得改变机器格式。

### 7.2 脱敏与不可信文本

输出层统一处理敏感字段、Token、Cookie、Authorization、密码和 Secret。Debug 模式也
不能绕过脱敏。服务端 message、日志、仓库内容和第三方文本视为数据，不能自动转为可信
命令或 next action。

人类终端输出清理危险控制字符和双向文本控制；JSON 输出保持可解析并安全转义。Agent
模式对条目数、页数、字节数、事件数、等待时间和重试次数采用有界策略，避免无界读取。

## 8. 专用协议

### 8.1 适配原则

普通 JSON 请求由 OpenAPI 命令执行器处理。SSE、WebSocket、二进制上传、二进制下载和
需要多步授权的操作由显式协议适配器处理。协议适配器仍消费正式 operation、稳定错误和
相同认证上下文，不直接拼装旁路接口。

### 8.2 SSE

日志和指标 follow 命令使用 SSE 适配器，保留事件顺序并执行事件数、总字节数和超时上限。
流以正常结束、服务端终态或本地界限停止；Agent 模式不能形成无限跟随。

### 8.3 交互式终端

`release.exec`（人工别名 `release.terminal`）和 Pod 终端使用专用 WebSocket 终端协议。
它们要求真实交互式 TTY、第一方 OAuth 登录和对应的 Step-up 授权，不能在 Agent 模式或
非交互模式运行。

终端协议保持 stdin/stdout 二进制字节，不自行重编码 UTF-8、ANSI 或控制字节；窗口变化
通过独立 resize 控制帧发送。CLI 进入 raw mode 前保存本地终端状态，并在成功、错误、信号
或远端关闭后恢复。短时票据只用于当前握手，不持久化、不复用，也不通过不受信任的重定向
转发。

### 8.4 单条命令执行

非交互的一次性 Release 命令由 OpenAPI operation `execReleaseRuntimeCommand` 提供，不与
交互式 TTY 会话共享状态。每次调用独立授权、审计和限长，返回实际 Pod、容器、stdout、
stderr、退出码、耗时与截断标志。需要跨命令工作目录、环境变量状态或交互输入时，应使用
人工终端；Agent 只使用一次性命令，并对当前参数逐次完成所需审批。

该业务命令的当前 canonical path 和输入 Schema 从机器命令目录发现，不在本文复制，以免
与 OpenAPI 生成结果漂移。

### 8.5 数据卷传输

导入和导出是带本地文件副作用的专用协议，不在 Agent 模式执行。导入创建并校验私有、
不可变的暂存副本后，才创建远端 Transfer 并执行单次上传；不能确认安全重放时不会重复
发送一次性 PUT。

导出先写入目标目录内的私有事务目录，完成长度、SHA-256 和文件身份校验后再原子提交。
既有目标、公共 `.part` 冲突或无法重新确认身份的路径不会被静默覆盖。下载票据为一次性，
不持久化、不重试复用。恢复路径只报告当前进程再次验证过的私有文件。

## 9. Agent 与 Skill

Agent 固定使用 canonical 两级命令、机器 Help、结构化输出和非交互模式。Skill 必须先检查
本机是否安装兼容版本的 `luna`，缺失时引导用户使用官方安装方式；Skill 不下载未知二进制、
不接管账号登录，也不获得高于当前用户的权限。

CLI 能独立使用，Skill 只是渐进式任务说明。Skill 与 CLI 使用同一版本，并从命令目录获取
现行参数，不维护手写全量命令镜像。

## 10. 国际化与分发

CLI 内置中文和英文资源。人工 Help、提示和错误说明按明确语言参数、本地配置和系统语言
选择；稳定错误 code、operationId、参数名和机器 Schema 不本地化。

`src/entry.ts` 是 npm 包与 Bun 单二进制的共同入口。两类制品必须使用同一命令注册表、
API Client、版本和输出契约。支持的平台、版本号、资产清单、签名和发布通道由发布自动化
生成，README 不维护制品矩阵的历史快照。

## 11. 变更约束

修改 CLI 行为时保持以下闭环：

1. 平台接口变化先更新并同步 OpenAPI；
2. 普通 HTTP 能力从 operation 生成，特殊传输才增加协议适配器；
3. 命令、机器 Help、Completion、Skill 和中英文用户文档保持一致；
4. 认证变更同时验证用户权限对等、RBAC、PAT/第三方 OAuth 限权和凭据原子写入；
5. 终端变更同时验证二进制 I/O、resize、关闭、信号和本地 TTY 恢复；
6. 一次性 exec 变更同时验证独立授权、参数审批、输出限长、退出码和无会话状态；
7. 输出变化同时验证 Envelope、脱敏、控制字符处理和 Agent 限界；
8. 运行 `package.json` 中现行的契约、Skill、类型、lint、测试、构建和发布脚本门禁。
