# Codex Supervisor Retry Plan

## Goal

检查并调整 Codex 开发监督器，使其能够依据上一轮进度重组恢复提示词、恢复固定 Codex 会话，并在总超时后停止继续调度但不终止当前正在执行的 Codex 会话。

## Phases

| Phase | Status | Verification |
|---|---|---|
| 1. 审计现有调度、监控、完成信号和测试入口 | complete | 已确认静态恢复提示和超时杀进程树两项差异 |
| 2. 设计并实现动态进度提示词与非破坏性超时 | complete | PowerShell 5.1 静态解析通过 |
| 3. 补充文档和自动化测试 | complete | 假 Codex 集成测试通过 |
| 4. 执行 10 秒超时中断测试 | complete | 调度器退出码 2，活跃工作进程仍存活并自然结束 |
| 5. 审查差异并汇总 | complete | diff check、编码检查、PowerShell 5.1 解析和集成测试均通过 |

## Constraints

- 不修改 `.gitignore`。
- 不回滚或覆盖其他线程修改。
- 文本使用 UTF-8 无 BOM。
- 进度提示必须由真实运行产物动态生成，不依赖手工维护的静态描述。
- 总超时只能停止后续重试调度，不得终止当前正在执行的 Codex 会话。
- 调试模式允许 10 秒超时，仅用于本次明确要求的测试。

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| None | - | - |
| `apply_patch` 拒绝同一补丁删除并重建同一路径 | 1 | 改用分段更新现有脚本 |
| Windows PowerShell 5.1 无法解析 UTF-8 无 BOM 脚本中的中文 here-string | 1 | `.ps1` 源码字面量改为 ASCII，任务与运行数据继续显式 UTF-8 |
| 收尾 `rg` 正则中的 `$exitCode` 被 PowerShell 展开 | 1 | 改用多个 `-e` 纯文本模式定位，不影响实现与测试 |
