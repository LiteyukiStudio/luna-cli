# 安全与账号

## 机器目录

按任务分别查询：

- `luna help catalog category=auth limit=100 output=json interactive=false agent=true`
- `luna help catalog category=user limit=100 output=json interactive=false agent=true`
- `luna help catalog category=access-token limit=100 output=json interactive=false agent=true`

执行具体工具前使用
`luna help command path=<category.tool> output=json interactive=false agent=true`
确认会话类型、接口所需 Scope、风险、MFA purpose 和安全输入方式。Help 中的 Scope
用于个人访问令牌、第三方 OAuth 应用和 Agent 服务身份等受限凭据，不是
`luna login` 的可选参数。

## 工作流

1. 读取活动实例、认证状态、账号和服务端认证能力。
2. 区分 CLI 本地凭据、Web Session、OAuth Token、OIDC 绑定和个人访问令牌。
3. 用户、Provider、注册策略、密码、MFA、OAuth App 或 Token 变更前读取当前状态。
4. 第一方 CLI 登录不选择或扩大 Scope；创建个人访问令牌等受限凭据时采用最小 Scope。
   按 Help Schema 执行一次变更，再重新读取验证。
5. 用户可以在自己的终端执行 `luna login` 进入默认 Device Code 登录，也可显式选择 Help 提供的备用方式。

## OAuth 刷新

- 本地存储的 OAuth Access Token 在到期前 30 秒或已过期时，由
  `auth status` 和远程命令自动刷新。CLI 会跨进程合并同一轮刷新，
  不会让并发命令重复旋转 Refresh Token。
- `luna auth refresh output=json interactive=false agent=true` 只用于强制手动刷新或认证诊断；
  日常操作和 Agent 可用性门禁不需要先执行它。
- `LUNA_TOKEN` 与个人访问令牌没有 CLI OAuth Refresh Token，不参与自动或
  手动 OAuth 刷新。
- 收到 `oauth_refresh_reauthentication_required` 时停止重试。它表示 Refresh Token / Grant
  已失效，或刷新请求已发出但结果无法安全确认；CLI 会持久阻止旧 Refresh Token 再次使用。
  `details.causeCode` 只用于诊断。不要用 `auth refresh` 绕过阻断，保留本地状态并让用户在自己的
  终端重新执行 `luna login`。
- 收到 `auth_context_changed` 时停止当前命令并重新读取 `auth status`，不得把原请求、协议连接
  或项目空间写入带到并发切换后的新实例或新账号继续执行。

## MFA 与协议入口

- OIDC/OAuth callback、Device Authorization 页面和 Webhook 接收端点不是 Agent 直接调用的业务工具。
- 收到 `mfa_required` 时记录 `purpose` 与 request ID，停止并让用户在自己的终端完成 CLI 提供的用户在场验证；随后重新读取状态，最多重放一次原命令。
- Agent 不接收、转述或记录 OTP、恢复码、密码和 Token。
- 登录与 Step-up MFA 是不同事务，已有登录凭据不代表满足当前敏感操作。
- CLI 终端要求 OAuth 登录与对应 purpose 的有效 Step-up assertion。个人访问
  令牌不能满足或绕过该协议授权。
- 第一方 `luna-cli` Device Code 登录不接受、展示或保存用户可选 Scope。CLI 不根据
  本地权限副本预检命令，也不把服务端拒绝转换为带 Scope 参数的重登录命令。收到权限
  错误时保留服务端稳定错误与 request ID，由用户按当前角色、项目空间成员关系或
  资源策略处理；Agent 不改用平台管理员或个人访问令牌重试。
- OpenAPI Scope 继续约束个人访问令牌、第三方 OAuth 应用和 Agent 服务身份；项目
  成员角色、资源归属和后端权限检查仍然是最终裁决。

## Secret 与权限

- 密码、Token、OTP、恢复码和 Provider Secret 不进入对话或内联参数。
- 创建访问令牌时使用最小 Scope；明文只可在一次性安全输出中交付。
- Token 吊销、MFA 重置、身份源和用户管理按机器 Help 风险处理。
- 不通过管理员账号、扩大 Scope、重新登录其他实例或通用 API 绕过用户在场要求。
