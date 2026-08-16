[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateNotNullOrEmpty()][string]$TaskFile,
    [ValidateNotNullOrEmpty()][string]$Workspace = (Split-Path -Parent $PSScriptRoot),
    [string]$Model,
    [ValidateNotNullOrEmpty()][string]$CodexCommand = 'codex',
    [ValidateRange(1, 3600)][int]$RetryDelaySeconds = 30,
    [ValidateRange(1, 3600)][int]$MaxRetryDelaySeconds = 300,
    [ValidateScript({ $_ -ge 1 })][double]$TimeoutHours = 1,
    [switch]$DebugMode,
    [ValidateRange(1, [int]::MaxValue)][int]$DebugTimeoutSeconds = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Read-Utf8 {
    param([Parameter(Mandatory)][string]$Path)
    return [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($Path))
}

function Read-Utf8Snippet {
    param(
        [Parameter(Mandatory)][string]$Path,
        [ValidateRange(1, [int]::MaxValue)][int]$MaximumCharacters = 16000
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return '(file does not exist)'
    }
    $content = Read-Utf8 -Path $Path
    if ($content.Length -le $MaximumCharacters) {
        return $content
    }
    return "...(only the last $MaximumCharacters characters are retained)...`n" +
        $content.Substring($content.Length - $MaximumCharacters)
}

function Test-CompletionRecord {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$ExpectedRunId)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $null
    }
    try {
        $record = Read-Utf8 -Path $Path | ConvertFrom-Json
        if ($record.status -eq 'completed' -and $record.runId -eq $ExpectedRunId) {
            return $record
        }
    }
    catch {
        Write-Warning "Completion record is not yet readable; wait or retry will continue: $($_.Exception.Message)"
    }
    return $null
}

function Stop-TimeoutWatcher {
    param(
        [Parameter(Mandatory)][string]$StopSignalFile,
        [Parameter(Mandatory)][System.Diagnostics.Process]$WatcherProcess
    )

    Write-Utf8NoBom -Path $StopSignalFile -Content ((Get-Date).ToUniversalTime().ToString('o'))
    try {
        if (-not $WatcherProcess.HasExited) {
            [void]$WatcherProcess.WaitForExit(5000)
        }
        if (-not $WatcherProcess.HasExited) {
            Stop-Process -Id $WatcherProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        Write-Warning "Failed while stopping timeout watcher PID $($WatcherProcess.Id): $($_.Exception.Message)"
    }
}

function ConvertTo-ProcessArgument {
    param([Parameter(Mandatory)][string]$Value)
    if ($Value -notmatch '[\s"]') {
        return $Value
    }
    return '"{0}"' -f $Value.Replace('"', '\"')
}

function Start-AttemptRunner {
    param(
        [Parameter(Mandatory)][string]$Role,
        [Parameter(Mandatory)][string]$PromptFile,
        [Parameter(Mandatory)][string]$LogFile,
        [Parameter(Mandatory)][string]$LastMessageFile,
        [Parameter(Mandatory)][string]$ResultFile,
        [AllowEmptyString()][string]$ConversationId
    )

    $runnerArguments = @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $attemptRunnerCommand,
        '-Role', $Role, '-Workspace', $workspacePath, '-CodexCommand', $codexExecutable,
        '-PromptFile', $PromptFile, '-LogFile', $LogFile,
        '-LastMessageFile', $LastMessageFile, '-ResultFile', $ResultFile,
        '-OutputCaptureCommand', $outputCaptureCommand
    )
    if ($Role -ne 'prompt-composer') {
        $runnerArguments += @('-ConversationIdFile', $conversationIdFile)
    }
    if (-not [string]::IsNullOrWhiteSpace($ConversationId)) {
        $runnerArguments += @('-ConversationId', $ConversationId)
    }
    if (-not [string]::IsNullOrWhiteSpace($Model)) {
        $runnerArguments += @('-Model', $Model)
    }

    return Start-Process `
        -FilePath 'powershell.exe' `
        -ArgumentList (($runnerArguments | ForEach-Object { ConvertTo-ProcessArgument -Value $_ }) -join ' ') `
        -PassThru `
        -WindowStyle Hidden
}

function Wait-AttemptOrTimeout {
    param(
        [Parameter(Mandatory)][System.Diagnostics.Process]$Process,
        [Parameter(Mandatory)][string]$TimeoutSignalFile
    )

    while ($true) {
        $Process.Refresh()
        if ($Process.HasExited) {
            [void]$Process.WaitForExit()
            return 'finished'
        }
        if (Test-Path -LiteralPath $TimeoutSignalFile -PathType Leaf) {
            return 'timed-out'
        }
        Start-Sleep -Milliseconds 200
    }
}

function Wait-RetryDelayOrTimeout {
    param([Parameter(Mandatory)][int]$Seconds, [Parameter(Mandatory)][string]$TimeoutSignalFile)

    $retryAt = (Get-Date).AddSeconds($Seconds)
    while ((Get-Date) -lt $retryAt) {
        if (Test-Path -LiteralPath $TimeoutSignalFile -PathType Leaf) {
            return $false
        }
        Start-Sleep -Milliseconds 200
    }
    return $true
}

function Get-GitProgressSnapshot {
    param([Parameter(Mandatory)][string]$WorkspacePath)

    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $status = (& git -C $WorkspacePath status --short 2>&1 | Out-String).Trim()
        $diffStat = (& git -C $WorkspacePath diff --stat 2>&1 | Out-String).Trim()
        $diffNames = (& git -C $WorkspacePath diff --name-status 2>&1 | Out-String).Trim()
    }
    catch {
        return "Git progress inspection failed: $($_.Exception.Message)"
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    if ([string]::IsNullOrWhiteSpace($status)) { $status = '(working tree is clean)' }
    if ([string]::IsNullOrWhiteSpace($diffStat)) { $diffStat = '(no diff stat)' }
    if ([string]::IsNullOrWhiteSpace($diffNames)) { $diffNames = '(no changed tracked files)' }
    return "git status --short:`n$status`n`ngit diff --name-status:`n$diffNames`n`ngit diff --stat:`n$diffStat"
}

function Get-RuntimeProgressSnapshot {
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $dockerCommand = Get-Command docker -ErrorAction SilentlyContinue
        if ($null -eq $dockerCommand) {
            return 'Docker CLI is not available.'
        }
        $serverVersion = (& docker version --format '{{.Server.Version}}' 2>&1 | Out-String).Trim()
        $containers = (& docker ps --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}' 2>&1 | Out-String).Trim()
        if ([string]::IsNullOrWhiteSpace($serverVersion)) { $serverVersion = '(server unavailable)' }
        if ([string]::IsNullOrWhiteSpace($containers)) { $containers = '(no running containers)' }
        return "Docker server: $serverVersion`nRunning containers:`n$containers"
    }
    catch {
        return "Runtime progress inspection failed: $($_.Exception.Message)"
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function Set-ManifestTimeout {
    param(
        [Parameter(Mandatory)][string]$ActiveRole,
        [Parameter(Mandatory)][System.Diagnostics.Process]$ActiveProcess
    )

    $manifest.status = 'timed_out'
    $manifest['timedOutAt'] = (Get-Date).ToUniversalTime().ToString('o')
    $manifest['activeAttemptRole'] = $ActiveRole
    $manifest['activeAttemptProcessId'] = $ActiveProcess.Id
    $manifest['activeAttemptPreserved'] = $true
    Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)
    Write-Warning "Timeout reached. The supervisor is stopping without terminating active $ActiveRole process PID $($ActiveProcess.Id)."
}

$workspacePath = (Resolve-Path -LiteralPath $Workspace -ErrorAction Stop).Path
$taskFilePath = (Resolve-Path -LiteralPath $TaskFile -ErrorAction Stop).Path
if (-not (Test-Path -LiteralPath $taskFilePath -PathType Leaf)) {
    throw "Task file is not a regular file: $taskFilePath"
}
if (-not $DebugMode -and $PSBoundParameters.ContainsKey('DebugTimeoutSeconds')) {
    throw 'DebugTimeoutSeconds can only be used together with DebugMode.'
}

$resolvedCodexCommand = Get-Command $CodexCommand -ErrorAction Stop
$codexExecutable = if (-not [string]::IsNullOrWhiteSpace($resolvedCodexCommand.Path)) {
    $resolvedCodexCommand.Path
}
else {
    $resolvedCodexCommand.Source
}

$runId = '{0}-{1}' -f (Get-Date -Format 'yyyyMMdd-HHmmss-fff'), ([Guid]::NewGuid().ToString('N').Substring(0, 8))
$runDirectory = Join-Path (Join-Path $workspacePath '.codex-supervisor\runs') $runId
$completionFile = Join-Path $runDirectory 'completion.json'
$manifestFile = Join-Path $runDirectory 'run.json'
$promptFile = Join-Path $runDirectory 'prompt.md'
$conversationIdFile = Join-Path $runDirectory 'conversation-id.txt'
$completionCommand = Join-Path $PSScriptRoot 'Complete-CodexDevelopmentTask.ps1'
$attemptRunnerCommand = Join-Path $PSScriptRoot 'Invoke-CodexSupervisorAttempt.ps1'
$outputCaptureCommand = Join-Path $PSScriptRoot 'Write-CodexSupervisorOutput.ps1'
$watcherCommand = Join-Path $PSScriptRoot 'Watch-CodexDevelopmentSupervisor.ps1'
$watcherStopSignal = Join-Path $runDirectory 'watcher.stop'
$timeoutSignalFile = Join-Path $runDirectory 'timeout.json'
$watcherLogFile = Join-Path $runDirectory 'watcher.log'

foreach ($requiredScript in @($completionCommand, $attemptRunnerCommand, $outputCaptureCommand, $watcherCommand)) {
    if (-not (Test-Path -LiteralPath $requiredScript -PathType Leaf)) {
        throw "Supervisor helper script is missing: $requiredScript"
    }
}
[System.IO.Directory]::CreateDirectory($runDirectory) | Out-Null

$manifest = [ordered]@{
    runId = $runId
    status = 'running'
    workspace = $workspacePath
    taskFile = $taskFilePath
    startedAt = (Get-Date).ToUniversalTime().ToString('o')
    completionFile = $completionFile
    timeoutHours = $TimeoutHours
    timeoutMode = if ($DebugMode) { 'debug-seconds' } else { 'hours' }
    timeoutBehavior = 'stop-scheduling-preserve-active-attempt'
    promptContractVersion = 2
}
if ($DebugMode) { $manifest['timeoutSeconds'] = $DebugTimeoutSeconds }
Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)

$taskText = Read-Utf8 -Path $taskFilePath
$prompt = @"
You are worker conversation A for a long-running system-development task in this repository. Own the final outcome end to end in the existing workspace. Do not overwrite or revert changes made by other threads.

Task file: $taskFilePath
Run ID: $runId
Completion record: $completionFile

Initial dispatch contract:
1. Inspect the completion record first. If status is completed and runId matches this run, stop immediately without duplicating work.
2. Read project rules, PROJECT.md, the task file, and only the document sections needed for the current milestone. Follow the project's Chinese development-document requirements.
3. Inspect the dirty worktree and existing implementation before editing. Other Codex threads may be active. Do not modify .planning/.active_plan. Never delete, reset, or revert existing workspace changes.
4. Convert the final objective and acceptance criteria into an evidence-backed milestone checklist. Keep the final objective immutable; a partial prototype, mock-only path, passing subset, or time limit is not completion.
5. Execute the smallest complete end-to-end milestone at a time. Unless the task file requires another order, use these gates: required documentation and interface contracts; build/runtime foundation; backend and data path; production frontend integration; deployment and middleware; automated and visual/system validation; documentation closeout.
6. Before crossing an interface or persistence boundary, update the required contract or migration documentation. Reuse project patterns and verify each milestone before starting the next one.
7. You have unattended execution access for normal in-scope development, Docker, build, test, and deployment work. Preserve unrelated containers and user data. Do not broaden scope, publish externally, or perform destructive recovery operations.
8. Prefer fixing blockers and continuing over stopping to ask questions when repository evidence supports a safe in-scope decision.

Completion protocol:
- Run the following completion command exactly once only after every acceptance criterion has implementation evidence and all task-required documentation, builds, tests, runtime checks, and deployment checks are complete:

& '$completionCommand' -CompletionFile '$completionFile' -RunId '$runId' -Summary '<concise Chinese completion summary>' -ValidationSummary '<commands run and results>'

- If this attempt cannot finish the task, do not run the completion command. Preserve valid changes and diagnostics. End with a compact progress checkpoint containing exactly these headings: Completed with evidence; Unverified or failed; Remaining; Blockers; Next milestone; First next action. The scheduler will use that checkpoint plus repository and runtime evidence to rebuild the prompt and resume this same conversation.

The following UTF-8 task file content is the stable final objective. Project-facing output must remain Chinese:

$taskText
"@
Write-Utf8NoBom -Path $promptFile -Content $prompt

Write-Host 'Codex development supervisor started.'
Write-Host "Run ID: $runId"
Write-Host "Task file: $taskFilePath"
Write-Host "Completion record: $completionFile"
Write-Host 'A fresh prompt-composer Codex session will rebuild the recovery prompt after each incomplete worker attempt.'

$supervisorProcess = Get-Process -Id $PID -ErrorAction Stop
$timeoutDuration = if ($DebugMode) { [TimeSpan]::FromSeconds($DebugTimeoutSeconds) } else { [TimeSpan]::FromHours($TimeoutHours) }
$deadlineUtc = (Get-Date).ToUniversalTime().Add($timeoutDuration)
$watcherArguments = @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $watcherCommand,
    '-SupervisorProcessId', [string]$PID,
    '-SupervisorStartTimeUtcTicks', [string]$supervisorProcess.StartTime.ToUniversalTime().Ticks,
    '-DeadlineUtc', $deadlineUtc.ToString('o'),
    '-StopSignalFile', $watcherStopSignal,
    '-TimeoutSignalFile', $timeoutSignalFile,
    '-WatcherLogFile', $watcherLogFile
)
$watcherProcess = Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList (($watcherArguments | ForEach-Object { ConvertTo-ProcessArgument -Value $_ }) -join ' ') `
    -PassThru `
    -WindowStyle Hidden
$manifest['watcherProcessId'] = $watcherProcess.Id
$manifest['deadlineUtc'] = $deadlineUtc.ToString('o')
Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)
Write-Host "Timeout watcher started: PID $($watcherProcess.Id), deadline $($deadlineUtc.ToString('o')), mode $($manifest.timeoutMode)."

$attempt = 0
$conversationId = $null
$nextPromptFile = $promptFile
$taskCompleted = $false
$timedOut = $false
try {
    while (-not $taskCompleted -and -not $timedOut) {
        $completed = Test-CompletionRecord -Path $completionFile -ExpectedRunId $runId
        if ($null -ne $completed) {
            $manifest.status = 'completed'
            $manifest['completedAt'] = (Get-Date).ToUniversalTime().ToString('o')
            Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)
            Write-Host 'Task completion command received.'
            Write-Host "Summary: $($completed.summary)"
            Write-Host "Validation: $($completed.validationSummary)"
            $taskCompleted = $true
            break
        }
        if (Test-Path -LiteralPath $timeoutSignalFile -PathType Leaf) {
            $manifest.status = 'timed_out'
            $manifest['timedOutAt'] = (Get-Date).ToUniversalTime().ToString('o')
            $manifest['activeAttemptPreserved'] = $false
            Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)
            $timedOut = $true
            break
        }

        $attempt++
        $attemptLog = Join-Path $runDirectory ('attempt-{0:D3}.log' -f $attempt)
        $lastMessage = Join-Path $runDirectory ('attempt-{0:D3}-last-message.md' -f $attempt)
        $attemptResult = Join-Path $runDirectory ('attempt-{0:D3}-result.json' -f $attempt)
        $workerRole = if ([string]::IsNullOrWhiteSpace($conversationId)) { 'worker-initial' } else { 'worker-resume' }
        Write-Host "[$((Get-Date).ToString('s'))] Starting $workerRole attempt $attempt."

        $workerProcess = Start-AttemptRunner -Role $workerRole -PromptFile $nextPromptFile `
            -LogFile $attemptLog -LastMessageFile $lastMessage -ResultFile $attemptResult `
            -ConversationId $conversationId
        $manifest['activeAttempt'] = $attempt
        $manifest['activeAttemptRole'] = $workerRole
        $manifest['activeAttemptProcessId'] = $workerProcess.Id
        Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)

        $waitResult = Wait-AttemptOrTimeout -Process $workerProcess -TimeoutSignalFile $timeoutSignalFile
        if ($waitResult -eq 'timed-out') {
            Set-ManifestTimeout -ActiveRole $workerRole -ActiveProcess $workerProcess
            $timedOut = $true
            break
        }

        $workerExitCode = $workerProcess.ExitCode
        if (Test-Path -LiteralPath $attemptResult -PathType Leaf) {
            $workerResult = Read-Utf8 -Path $attemptResult | ConvertFrom-Json
            $workerExitCode = [int]$workerResult.exitCode
        }
        [void]$manifest.Remove('activeAttempt')
        [void]$manifest.Remove('activeAttemptRole')
        [void]$manifest.Remove('activeAttemptProcessId')

        if ([string]::IsNullOrWhiteSpace($conversationId) -and (Test-Path -LiteralPath $conversationIdFile -PathType Leaf)) {
            $capturedConversationId = (Read-Utf8 -Path $conversationIdFile).Trim()
            if ($capturedConversationId -notmatch '^[0-9a-fA-F-]{36}$') {
                throw "Invalid conversation ID captured: $capturedConversationId"
            }
            $conversationId = $capturedConversationId
            $manifest['conversationId'] = $conversationId
            Write-Host "Worker conversation A captured: $conversationId"
        }
        Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)

        if ($null -ne (Test-CompletionRecord -Path $completionFile -ExpectedRunId $runId)) { continue }
        if (Test-Path -LiteralPath $timeoutSignalFile -PathType Leaf) {
            $manifest.status = 'timed_out'
            $manifest['timedOutAt'] = (Get-Date).ToUniversalTime().ToString('o')
            $manifest['activeAttemptPreserved'] = $false
            Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)
            $timedOut = $true
            break
        }

        if ([string]::IsNullOrWhiteSpace($conversationId)) {
            Write-Warning "Worker attempt $attempt exited with code $workerExitCode before a conversation ID was captured. The next worker will start a new session from the rebuilt prompt."
        }
        else {
            Write-Warning "Worker attempt $attempt exited with code $workerExitCode without completion. Prompt scheduling will rebuild the next instruction before resuming conversation A."
        }

        $nextAttempt = $attempt + 1
        $recoveryContextFile = Join-Path $runDirectory ('attempt-{0:D3}-recovery-context.md' -f $nextAttempt)
        $recoveryPromptFile = Join-Path $runDirectory ('attempt-{0:D3}-resume-prompt.md' -f $nextAttempt)
        $fallbackPromptFile = Join-Path $runDirectory ('attempt-{0:D3}-fallback-prompt.md' -f $nextAttempt)
        $composerLog = Join-Path $runDirectory ('attempt-{0:D3}-composer.log' -f $nextAttempt)
        $composerLastMessage = Join-Path $runDirectory ('attempt-{0:D3}-composer-last-message.md' -f $nextAttempt)
        $composerResult = Join-Path $runDirectory ('attempt-{0:D3}-composer-result.json' -f $nextAttempt)
        $previousLastMessage = Read-Utf8Snippet -Path $lastMessage -MaximumCharacters 16000
        $previousLogTail = Read-Utf8Snippet -Path $attemptLog -MaximumCharacters 16000
        $gitProgress = Get-GitProgressSnapshot -WorkspacePath $workspacePath
        $runtimeProgress = Get-RuntimeProgressSnapshot
        $workerSessionDescription = if ([string]::IsNullOrWhiteSpace($conversationId)) {
            '(not captured; the next worker will start a new conversation)'
        }
        else {
            $conversationId
        }

        $recoveryContext = @"
# Recovery prompt scheduling task

You are a fresh, read-only prompt-composer Codex session, not the worker. Do not modify the repository or execute the development task. Use the stable objective and actual progress evidence to produce a directly executable Chinese prompt for the next worker attempt.

Requirements:
- Output only the worker prompt body. Do not explain your analysis.
- Preserve the stable final objective, Run ID, completion record, and completion command.
- Start with the immutable final outcome, then synthesize an evidence ledger with exactly four states: completed with evidence, unverified, incomplete, and blocked. Never infer completion from plans, file presence, or claims without validation evidence.
- Select exactly one next end-to-end milestone that most directly advances the final outcome. Include its acceptance evidence and the first concrete files or commands to inspect. Do not redesign the whole project unless evidence proves the design is invalid.
- Tell the worker to inspect the completion record and current workspace first, verify inherited changes, then continue that milestone. Preserve already validated work and avoid broad rereads.
- Do not restart, revert existing changes, or repeat a deterministic failing command unchanged.
- Convert known failures into an adjusted action or diagnostic step. Call out missing runtime dependencies only when supported by the runtime snapshot.
- If the task remains incomplete, require the same structured progress checkpoint: Completed with evidence; Unverified or failed; Remaining; Blockers; Next milestone; First next action.
- Do not weaken or narrow acceptance criteria to fit the current attempt. Only include the completion command after the evidence ledger and execution instructions.

## Stable task information

Task file: $taskFilePath
Run ID: $runId
Completion record: $completionFile
Worker conversation ID: $workerSessionDescription
Previous worker attempt: $attempt
Previous exit code: $workerExitCode

Completion command:
& '$completionCommand' -CompletionFile '$completionFile' -RunId '$runId' -Summary '<concise Chinese completion summary>' -ValidationSummary '<commands run and results>'

## Original final objective
$taskText

## Previous final message
$previousLastMessage

## Previous log tail
$previousLogTail

## Current Git progress
$gitProgress

## Current runtime progress
$runtimeProgress
"@
        Write-Utf8NoBom -Path $recoveryContextFile -Content $recoveryContext

$fallbackPrompt = @"
Continue the same development task with the stable final objective unchanged. Inspect the completion record and current workspace first. Reconcile inherited changes against the evidence below, preserve validated work, and continue exactly one highest-priority incomplete end-to-end milestone. Do not restart, revert existing changes, broadly reread settled context, or repeat a deterministic failing command unchanged. Project-facing output must remain Chinese.

Run ID: $runId
Completion record: $completionFile

Original final objective:
$taskText

Previous exit code: $workerExitCode
Previous final message:
$previousLastMessage

Previous log tail:
$previousLogTail

Current Git progress:
$gitProgress

Current runtime progress:
$runtimeProgress

Run the following command exactly once only after implementation, required documentation, and validation are complete:
& '$completionCommand' -CompletionFile '$completionFile' -RunId '$runId' -Summary '<concise Chinese completion summary>' -ValidationSummary '<commands run and results>'

If the task remains incomplete, do not run the completion command. Preserve progress and end with these headings: Completed with evidence; Unverified or failed; Remaining; Blockers; Next milestone; First next action.
"@
        Write-Utf8NoBom -Path $fallbackPromptFile -Content $fallbackPrompt

        Write-Host "Starting a fresh prompt-composer session for worker attempt $nextAttempt."
        $composerProcess = Start-AttemptRunner -Role 'prompt-composer' -PromptFile $recoveryContextFile `
            -LogFile $composerLog -LastMessageFile $composerLastMessage -ResultFile $composerResult `
            -ConversationId ''
        $manifest['activeAttemptRole'] = 'prompt-composer'
        $manifest['activeAttemptProcessId'] = $composerProcess.Id
        Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)

        $composerWaitResult = Wait-AttemptOrTimeout -Process $composerProcess -TimeoutSignalFile $timeoutSignalFile
        if ($composerWaitResult -eq 'timed-out') {
            Set-ManifestTimeout -ActiveRole 'prompt-composer' -ActiveProcess $composerProcess
            $timedOut = $true
            break
        }

        $composerExitCode = $composerProcess.ExitCode
        if (Test-Path -LiteralPath $composerResult -PathType Leaf) {
            $parsedComposerResult = Read-Utf8 -Path $composerResult | ConvertFrom-Json
            $composerExitCode = [int]$parsedComposerResult.exitCode
        }
        [void]$manifest.Remove('activeAttemptRole')
        [void]$manifest.Remove('activeAttemptProcessId')
        Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)

        if ($composerExitCode -eq 0 -and (Test-Path -LiteralPath $composerLastMessage -PathType Leaf) -and
            -not [string]::IsNullOrWhiteSpace((Read-Utf8 -Path $composerLastMessage))) {
            Write-Utf8NoBom -Path $recoveryPromptFile -Content (Read-Utf8 -Path $composerLastMessage)
            $nextPromptFile = $recoveryPromptFile
            Write-Host "Prompt composer produced: $recoveryPromptFile"
        }
        else {
            $nextPromptFile = $fallbackPromptFile
            Write-Warning "Prompt composer exited with code $composerExitCode. The evidence-based fallback prompt will be used."
        }

        $exponent = [Math]::Min($attempt - 1, 8)
        $delay = [int][Math]::Ceiling([Math]::Min(
            $MaxRetryDelaySeconds,
            $RetryDelaySeconds * [Math]::Pow(2, $exponent)
        ))
        Write-Host "Starting worker attempt $nextAttempt in $delay seconds."
        if (-not (Wait-RetryDelayOrTimeout -Seconds $delay -TimeoutSignalFile $timeoutSignalFile)) {
            $manifest.status = 'timed_out'
            $manifest['timedOutAt'] = (Get-Date).ToUniversalTime().ToString('o')
            $manifest['activeAttemptPreserved'] = $false
            Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 5)
            $timedOut = $true
        }
    }
}
finally {
    Stop-TimeoutWatcher -StopSignalFile $watcherStopSignal -WatcherProcess $watcherProcess
}

if ($taskCompleted) {
    Write-Host 'Timeout watcher stopped; supervisor is exiting successfully.'
    exit 0
}
if ($timedOut) {
    Write-Host 'Supervisor scheduling stopped because the total timeout was reached. Any active Codex attempt was left running.'
    exit 2
}
exit 1
