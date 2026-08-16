# Findings

## Confirmed

- 官方文档确认 `codex exec resume <SESSION_ID>` 可恢复指定的非交互会话。
- `codex exec --json` 输出 JSONL，其中包含 `thread.started`、`turn.failed`、`item.*` 等事件。
- 现有监督器使用固定会话 ID 恢复，并保存每次最后消息，但恢复提示词目前是静态文本。
- 当前恢复命令使用固定会话 ID，满足“恢复工作会话 A”，但没有独立提示词调度会话。
- `attempt-*-last-message.md` 和 `attempt-*.log` 只落盘，不进入后续恢复提示词。
- 当前监听器调用 `taskkill.exe /PID <supervisor> /T /F`，会终止监督器和当前 Codex 子进程树。
- 当前监督器同步运行 Codex 管道，无法在保留 Codex 的同时自行结束；需要独立工作运行器。

## Selected Design

- 新增独立 attempt runner，工作 Codex 与监督器生命周期解耦。
- 每次工作尝试失败后启动新的 ephemeral/read-only Codex 调度会话。
- 调度上下文包含原任务、上一轮最后消息、日志尾部、退出码、Git status 和 diff stat。
- 调度失败时使用同样上下文生成确定性回退提示词，避免恢复链断裂。
- watcher 到期只写超时信号；监督器轮询信号并退出，不终止活跃 attempt runner。
- 通过可注入 `CodexCommand` 的假 Codex 脚本完成重试和 10 秒超时测试。
