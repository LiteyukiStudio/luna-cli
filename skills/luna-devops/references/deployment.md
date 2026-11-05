# 应用与部署

## 机器目录

按任务分别查询 `application`、`app-template` 和 `deployment` 分类，例如：

- `luna help catalog category=application limit=100 output=json interactive=false agent=true`
- `luna help catalog category=app-template limit=100 output=json interactive=false agent=true`
- `luna help catalog category=deployment limit=100 output=json interactive=false agent=true`

调用前使用
`luna help command path=<category.tool> output=json interactive=false agent=true`
读取具体契约，不凭名称猜测创建、发布或运行时工具。

## 工作流

1. 解析项目空间、应用、部署配置、发布和目标镜像的稳定 ID。
2. 按目录能力读取或维护应用、部署配置、候选镜像和部署相关设置。
3. 创建发布前确认镜像、环境、目标集群、钩子、成本与并发影响。
4. 需要停止现有工作负载时，使用部署配置更新工具将 `replicas` 设为 `0`；恢复时改回正整数。这类副本调整直接生效，不创建 Release。
5. 对发布、重启、回滚、日志、等待终态和终端授权，只调用目录存在的工具。
6. 异步操作返回后按 Help 指示轮询，最终重新读取发布或工作负载状态。

## 应用模板安装

1. 先读取模板详情；`components` 非空即为多组件模板，每个组件会创建独立的应用、部署配置和可选首个 Release。
2. 多组件模板按组件 `key` 在请求体 `componentProjectVolumeIds` 中为每个声明了项目数据卷的组件选择不同的项目数据卷，
   不发送 `imageRef`、`replicas`、`cpuRequest`、`memoryRequest` 和 `projectVolumeId`。
3. 单组件模板仍使用 `projectVolumeId` 及可选的镜像、副本与资源覆盖。
4. 安装结果中的 `components` 列出每个组件的应用、部署配置和 Release；`installNow` 为 `true` 时逐个回读 Release 终态。

## 风险与验证

- 应用、部署配置、发布和运行资源删除是关键操作。
- Secret 环境变量不回显，也不以内联参数传递。
- 取得终端授权票据不代表会话已连接。
- 终端预授权要求 CLI OAuth 登录和对应 purpose 的 Step-up MFA；个人访问令牌
  不能用于绕过用户在场验证。
- 收到 `mfa_required` 时遵循根 Skill 的用户在场验证流程，不能改用其他 Token 绕过。
- 回滚和重启前确认目标版本与当前运行版本，执行后验证实际工作负载状态。
- 当前 CPU/内存 Resource Metrics 自动伸缩的最小副本数必须至少为 `1`，不能依赖它从零副本自动唤醒。
