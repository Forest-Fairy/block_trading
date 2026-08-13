# Codex 系统开发监督脚本

## 用途

`Invoke-CodexDevelopmentSupervisor.ps1` 用于在当前仓库启动 Codex 系统开发任务，并在 Codex 异常退出但尚未报告完成时持续恢复同一个 Codex 对话。

监督器首次调用 `codex exec --json`，从 `thread.started` 事件中保存会话 UUID。后续尝试固定调用 `codex exec resume <会话 UUID>`，不会使用可能与其他并发线程冲突的 `--last`。

监督器只有收到与本次运行标识匹配的 `completion.json` 才会退出。Codex 工作线程必须完成代码、项目要求的文档回写和必要验证后，执行提示中给出的 `Complete-CodexDevelopmentTask.ps1` 命令。

启动 Codex 前，监督器会异步启动独立超时监听进程。正常模式默认超时时长为 1 小时，配置值不能低于 1 小时。仅显式启用调试模式时，才可使用以秒为单位的超时，且最小值为 30 秒。到期时如果监督器仍在运行且尚未收到正常完成信号，监听进程会终止监督器及其当前 Codex 子进程树。Codex 单次异常退出不会停止监听进程，监督器仍会在总超时时间内恢复同一对话。

## 使用方式

先创建 UTF-8 任务文件，例如 `development-task.md`：

```markdown
# 开发目标

根据当前业务开发文档和测试用例文档完成系统开发。

## 完成要求

- 实现本轮需求涉及的后端和前端功能。
- 遵守项目 AGENTS.md、PROJECT.md 和文档导航规则。
- 不回滚其他线程已经产生的修改。
- 执行与改动范围匹配的自动化测试和前端验收。
- 完成业务开发文档回写。
```

在项目根目录运行：

```powershell
& '.\tools\Invoke-CodexDevelopmentSupervisor.ps1' `
    -TaskFile '.\development-task.md'
```

可选指定模型及重试间隔：

```powershell
& '.\tools\Invoke-CodexDevelopmentSupervisor.ps1' `
    -TaskFile '.\development-task.md' `
    -Model 'gpt-5.6-sol' `
    -RetryDelaySeconds 30 `
    -MaxRetryDelaySeconds 300 `
    -TimeoutHours 1
```

调试时可将总超时缩短为 30 秒或更长时间：

```powershell
& '.\tools\Invoke-CodexDevelopmentSupervisor.ps1' `
    -TaskFile '.\development-task.md' `
    -DebugMode `
    -DebugTimeoutSeconds 30
```

## 运行记录

每次监督运行的数据保存在 `.codex-supervisor/runs/<运行标识>/`，包括：

- `run.json`：运行清单、任务文件、会话 UUID 和实际超时模式。
- `conversation-id.txt`：固定恢复的 Codex 会话 UUID。
- `attempt-*.log`：每次执行或恢复的输出日志。
- `attempt-*-last-message.md`：Codex 每次尝试的最后一条消息。
- `completion.json`：工作线程执行完成命令后生成的完成记录。
- `watcher.log`：超时监听进程的启动、停止或超时切断记录。
- `watcher.stop`：正常完成或监督器退出时写入的监听停止信号。

若需要人工停止监督器，使用 `Ctrl+C`。人工停止后不会自动继续；再次启动脚本会创建新的监督运行。
