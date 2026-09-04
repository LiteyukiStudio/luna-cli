# 项目空间数据卷

## 机器目录

先用 `luna help catalog category=volume limit=100 output=json interactive=false agent=true`
发现数据卷业务命令；传输记录使用 `category=volume-transfer`。调用前读取具体命令契约，
确认项目空间、风险、分页、资源 revision 和稳定错误码。实际权限由服务端按当前账号、
项目成员关系和资源状态实时判断。

## 工作流

1. 列表读取必须显式传 `page` 和 `pageSize`，再用稳定 ID 获取详情与当前 Kubernetes 观察结果。
2. 创建空白卷时传入结构化 body；引用或纳管已有 PVC 时使用 `volume.adopt`，不得用 force
   绕过归属冲突或正在使用检查。
3. 更新、删除和重试必须使用详情回读的最新 `revision`；冲突后重新读取，不覆盖新状态。
4. 删除前先读取删除预览。托管卷使用 `dataAction=delete`，引用卷使用
   `dataAction=detach`，不得混淆底层数据影响。
5. 导入和导出涉及操作者本地文件，只能让用户在人类终端执行 `volume.import` 或
   `volume.export`；Agent 可以查询 `volume-transfer` 进度，但不得读取、编码或上传文件内容。
6. 导入先创建并校验不可变的私有本地副本，再等待 Transfer `ready` 后以单次 `PUT` 上传完整
   归档；导出等待 `ready` 后申请一次性票据，再以单次 `GET` 下载完整归档。传输完成后重新读取
   Transfer 和数据卷观察结果；排队、运行、失败、取消和过期不是成功。
7. 创建、纳管、首次导入/导出和 Transfer 重试必须显式提供 8–160 字符的
   `idempotencyKey`；使用 `volume.export transferId=<id>` 下载已准备完成且仍为 `ready` 的导出时，
   不创建新资源，也不需要新的幂等键。

## 风险与恢复

- `volume.import` 与 `volume.export` 都要求当前账号通过服务端权限检查，并完成对应的 Step-up
  用户在场验证；个人访问令牌不能绕过用户在场验证。
- 导入和导出均为单次完整流，不支持从 offset、Range 或本地状态恢复；中断后的导入必须重新
  创建，导出则根据 Transfer 状态使用正式重试命令或重新创建。
- 导入会先占用约一个归档大小的额外本地空间；副本校验后在创建远端 Transfer 前从文件系统
  命名空间分离，仅通过当前进程的只读句柄上传，成功或失败都会关闭句柄并释放空间。本地文件系统
  无法安全分离时必须在远端副作用前停止。同一幂等键返回 `succeeded` 时，只有方向、长度和
  SHA-256 与当前副本完全一致才视为成功；`streaming` 时不得重放单次 `PUT`。
- CLI 不保存传输状态或一次性票据。导出在目标目录内随机命名的私有事务目录中暂存；支持 POSIX
  mode 时目录和文件使用 `0700` / `0600`。失败错误的 `recoveryPath` / `recoveryPaths` 只能列出
  再次验证过身份、长度和 SHA-256 的私有文件；未知身份冲突列为 `preservedUnknownPaths`。CLI
  不创建公共 `<destination>.part`，但既有或中途出现的 `.part`（含 Block sidecar）即使
  `overwrite=true` 也必须保留并拒绝提交。无法提供可靠文件身份或安全硬链接时必须在出票前停止。
  同一 OS 账号在命令期间移动或替换目标父目录时也必须停止；无法重新确认的路径只能报告为
  `preservedUnknownPaths`，不得声称为恢复文件。
- Block 卷 `raw_zst` 导出为归档和 `<archive>.manifest.json` 分别申请一次性票据，完成双重校验后
  才整体提交；Filesystem 导出没有该 sidecar。
- 收到 checksum、过期或状态冲突错误时停止操作并保留稳定错误码，不删除源文件，也不猜测
  数据卷可用。
