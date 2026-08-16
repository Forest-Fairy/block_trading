# Codex 系统开发监督脚本

## 用途

`Invoke-CodexDevelopmentSupervisor.ps1` 用于在当前仓库启动 Codex 系统开发任务，并在 Codex 工作会话异常退出但尚未报告完成时，根据实际进度重组提示词并持续恢复同一个 Codex 工作会话。

监督器首次调用 `codex exec --json`，从 `thread.started` 事件中保存工作会话 A 的 UUID。首次提示词固定最终目标，要求工作会话先建立验收里程碑，再按文档/接口、构建与运行时、后端与数据、生产前端、部署与中间件、自动化与系统验证、文档收口的门禁顺序推进。未完成时必须输出“已完成证据、未验证或失败、剩余项、阻塞、下一里程碑、首个下一动作”检查点。

工作尝试未完成时，监督器会启动一个全新的只读、ephemeral 提示词调度会话，根据原始任务、上一轮最后消息、日志尾部、退出码、`git status --short`、`git diff --name-status`、`git diff --stat` 和 Docker 运行快照生成新的恢复提示词。恢复提示词必须将进度重组为“有证据完成、未验证、未完成、阻塞”四态，只选择一个下一端到端里程碑，并给出验收证据和首个具体动作。随后固定调用 `codex exec resume <会话 UUID>` 恢复工作会话 A，不会使用可能与其他并发线程冲突的 `--last`。

如果提示词调度会话失败或没有输出有效提示词，监督器会使用包含同一批进度证据的确定性回退提示词，避免恢复链路中断。如果首次工作尝试未能产生会话 UUID，下一轮会使用重组后的提示词创建新的工作会话。

监督器只有收到与本次运行标识匹配的 `completion.json` 才会退出。Codex 工作线程必须完成代码、项目要求的文档回写和必要验证后，执行提示中给出的 `Complete-CodexDevelopmentTask.ps1` 命令。

启动工作会话前，监督器会异步启动独立超时监听进程。正常模式默认超时时长为 1 小时，配置值不能低于 1 小时。仅显式启用调试模式时，才可使用以秒为单位的超时，最小值为 1 秒。

工作尝试和提示词调度尝试都运行在独立 attempt runner 中。到期时，监听进程只写入 `timeout.json`，监督器检测到信号后停止后续调度并以退出码 `2` 结束，不终止正在执行的 attempt runner 或其中的 Codex 会话。正在执行的 Codex 可以继续自然运行，但监督器退出后不会再为该次运行发起新的恢复尝试。Codex 单次异常退出不会停止监听进程；只要总超时尚未到达，监督器仍会重组提示词并恢复工作会话 A。

## 调度流程

1. 用户准备 UTF-8 任务文件，由主线程理解并确认最终目标。
2. 监督器启动超时监听进程和独立工作 attempt runner，创建工作会话 A。
3. 工作会话正常完成代码、文档和验证后写入匹配本次 Run ID 的 `completion.json`。
4. 工作会话中断或未报告完成时，监督器汇总任务与真实进度。
5. 监督器启动新的只读提示词调度 Codex 会话，生成下一轮恢复提示词。
6. 监督器用新提示词恢复固定工作会话 A，并按退避间隔继续调度。
7. 总超时到达后只停止监督器的后续调度，保留当前正在执行的 Codex attempt。

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

调试时可使用以秒为单位的总超时。下面的 10 秒配置只用于验证调度器超时行为：

```powershell
& '.\tools\Invoke-CodexDevelopmentSupervisor.ps1' `
    -TaskFile '.\development-task.md' `
    -DebugMode `
    -DebugTimeoutSeconds 10
```

## 运行记录

每次监督运行的数据保存在 `.codex-supervisor/runs/<运行标识>/`，包括：

- `run.json`：运行清单、任务文件、会话 UUID 和实际超时模式。
- `run.json` 中的 `promptContractVersion`：本次使用的首次/恢复提示词契约版本。
- `conversation-id.txt`：固定恢复的 Codex 会话 UUID。
- `attempt-*.log`：每次执行或恢复的输出日志。
- `attempt-*-last-message.md`：Codex 每次尝试的最后一条消息。
- `attempt-*-result.json`：独立 attempt runner 的角色、退出码和执行时间。
- `attempt-*-recovery-context.md`：传给新提示词调度会话的任务与进度证据。
- `attempt-*-composer.log`：提示词调度会话的 JSONL 输出日志。
- `attempt-*-composer-last-message.md`：提示词调度会话生成的恢复提示词原文。
- `attempt-*-resume-prompt.md`：实际用于下一轮工作会话的动态恢复提示词。
- `attempt-*-fallback-prompt.md`：提示词调度失败时使用的证据化回退提示词。
- `completion.json`：工作线程执行完成命令后生成的完成记录。
- `watcher.log`：超时监听进程的启动、停止或超时切断记录。
- `watcher.stop`：正常完成或监督器退出时写入的监听停止信号。
- `timeout.json`：监听进程到达总超时时写入的调度停止信号。

所有任务、提示词、最后消息、JSONL 尝试日志和运行记录均使用 UTF-8 无 BOM。attempt runner 在调用原生 `codex` 前显式设置 Windows PowerShell 5.1 的 `$OutputEncoding`、控制台输入和输出编码为 UTF-8，并在退出时恢复宿主设置；输出捕获器也以 UTF-8 写入。因此日志中的中文应按 UTF-8 读取，不能依赖 Git Bash、OEM 或系统 ANSI 代码页猜测。

若需要人工停止监督器，使用 `Ctrl+C`。人工停止后不会自动继续；再次启动脚本会创建新的监督运行。

## 测试

测试使用假 Codex，不会调用真实模型：

```powershell
& '.\tools\tests\Test-CodexDevelopmentSupervisor.ps1'
```

测试覆盖动态进度提示词重组、固定工作会话恢复、UTF-8 中文 JSONL 日志探针、完成信号，以及 10 秒超时后监督器停止但活跃工作进程继续运行。
