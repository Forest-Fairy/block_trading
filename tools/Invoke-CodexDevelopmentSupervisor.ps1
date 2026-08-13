[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$TaskFile,

    [ValidateNotNullOrEmpty()]
    [string]$Workspace = (Split-Path -Parent $PSScriptRoot),

    [string]$Model,

    [ValidateNotNullOrEmpty()]
    [string]$CodexCommand = 'codex',

    [ValidateRange(1, 3600)]
    [int]$RetryDelaySeconds = 30,

    [ValidateRange(1, 3600)]
    [int]$MaxRetryDelaySeconds = 300,

    [ValidateScript({ $_ -ge 1 })]
    [double]$TimeoutHours = 1,

    [switch]$DebugMode,

    [ValidateRange(30, [int]::MaxValue)]
    [int]$DebugTimeoutSeconds = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Read-Utf8 {
    param([Parameter(Mandatory)][string]$Path)

    return [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($Path))
}

function Test-CompletionRecord {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$ExpectedRunId
    )

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

$workspacePath = (Resolve-Path -LiteralPath $Workspace -ErrorAction Stop).Path
$taskFilePath = (Resolve-Path -LiteralPath $TaskFile -ErrorAction Stop).Path
if (-not (Test-Path -LiteralPath $taskFilePath -PathType Leaf)) {
    throw "Task file is not a regular file: $taskFilePath"
}
if (-not $DebugMode -and $PSBoundParameters.ContainsKey('DebugTimeoutSeconds')) {
    throw 'DebugTimeoutSeconds can only be used together with DebugMode.'
}

$resolvedCodexCommand = Get-Command $CodexCommand -ErrorAction Stop
$runId = '{0}-{1}' -f (Get-Date -Format 'yyyyMMdd-HHmmss-fff'), ([Guid]::NewGuid().ToString('N').Substring(0, 8))
$runRoot = Join-Path $workspacePath '.codex-supervisor\runs'
$runDirectory = Join-Path $runRoot $runId
$completionFile = Join-Path $runDirectory 'completion.json'
$manifestFile = Join-Path $runDirectory 'run.json'
$promptFile = Join-Path $runDirectory 'prompt.md'
$resumePromptFile = Join-Path $runDirectory 'resume-prompt.md'
$conversationIdFile = Join-Path $runDirectory 'conversation-id.txt'
$completionCommand = Join-Path $PSScriptRoot 'Complete-CodexDevelopmentTask.ps1'
$outputCaptureCommand = Join-Path $PSScriptRoot 'Write-CodexSupervisorOutput.ps1'
$watcherCommand = Join-Path $PSScriptRoot 'Watch-CodexDevelopmentSupervisor.ps1'
$watcherStopSignal = Join-Path $runDirectory 'watcher.stop'
$watcherLogFile = Join-Path $runDirectory 'watcher.log'

if (-not (Test-Path -LiteralPath $completionCommand -PathType Leaf)) {
    throw "Completion command script is missing: $completionCommand"
}
if (-not (Test-Path -LiteralPath $outputCaptureCommand -PathType Leaf)) {
    throw "Output capture script is missing: $outputCaptureCommand"
}
if (-not (Test-Path -LiteralPath $watcherCommand -PathType Leaf)) {
    throw "Timeout watcher script is missing: $watcherCommand"
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
}
if ($DebugMode) {
    $manifest['timeoutSeconds'] = $DebugTimeoutSeconds
}
Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 4)

$taskText = Read-Utf8 -Path $taskFilePath
$prompt = @"
You are the recovery execution thread for a system-development task in this repository. Complete the task directly in the existing workspace. Do not overwrite or revert work already made by other threads.

Task file: $taskFilePath
Run ID: $runId
Completion record: $completionFile

Rules:
1. Read project rules, PROJECT.md, and only the required document sections. Follow the project's Chinese development-document requirements.
2. Other Codex threads may be active. Do not modify .planning/.active_plan. Never delete, reset, or revert existing workspace changes.
3. First inspect the completion record. If status is completed and runId equals this Run ID, stop immediately without duplicating work.
4. Only after actual system development, required documentation updates, and task-appropriate validation are complete, run this exact completion command once. Do not end the task without executing it.

& '$completionCommand' -CompletionFile '$completionFile' -RunId '$runId' -Summary '<concise Chinese completion summary>' -ValidationSummary '<commands run and results>'

5. If you cannot complete the task because of context, command, or service failures, do not run the completion command. Preserve completed work and diagnostics, then end. The supervisor will launch another recovery thread.

The following UTF-8 task file content is the development objective:

$taskText
"@
Write-Utf8NoBom -Path $promptFile -Content $prompt

$resumePrompt = @"
Continue the same development task from the previous turn. Inspect the existing workspace and your prior context, then resume from the last incomplete point. Do not restart the task or revert work from any thread.

Run ID: $runId
Completion record: $completionFile

Only after implementation, required documentation, and validation are complete, run this exact command once:

& '$completionCommand' -CompletionFile '$completionFile' -RunId '$runId' -Summary '<concise Chinese completion summary>' -ValidationSummary '<commands run and results>'

If the task is still incomplete, do not run the completion command. Preserve progress so the same conversation can be resumed again.
"@
Write-Utf8NoBom -Path $resumePromptFile -Content $resumePrompt

Write-Host "Codex development supervisor started."
Write-Host "Run ID: $runId"
Write-Host "Task file: $taskFilePath"
Write-Host "Completion record: $completionFile"
Write-Host "When a Codex attempt exits without the completion command, a recovery thread is launched. Press Ctrl+C to stop manually."

$supervisorProcess = Get-Process -Id $PID -ErrorAction Stop
$timeoutDuration = if ($DebugMode) {
    [TimeSpan]::FromSeconds($DebugTimeoutSeconds)
}
else {
    [TimeSpan]::FromHours($TimeoutHours)
}
$deadlineUtc = (Get-Date).ToUniversalTime().Add($timeoutDuration)
$watcherArguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', $watcherCommand,
    '-SupervisorProcessId', [string]$PID,
    '-SupervisorStartTimeUtcTicks', [string]$supervisorProcess.StartTime.ToUniversalTime().Ticks,
    '-DeadlineUtc', $deadlineUtc.ToString('o'),
    '-StopSignalFile', $watcherStopSignal,
    '-WatcherLogFile', $watcherLogFile
)
$watcherProcess = Start-Process `
    -FilePath 'powershell.exe' `
    -ArgumentList (($watcherArguments | ForEach-Object { ConvertTo-ProcessArgument -Value $_ }) -join ' ') `
    -PassThru `
    -WindowStyle Hidden
$manifest['watcherProcessId'] = $watcherProcess.Id
$manifest['deadlineUtc'] = $deadlineUtc.ToString('o')
Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 4)
Write-Host "Timeout watcher started: PID $($watcherProcess.Id), deadline $($deadlineUtc.ToString('o')), mode $($manifest.timeoutMode)."

$attempt = 0
$conversationId = $null
$taskCompleted = $false
try {
while (-not $taskCompleted) {
    $completed = Test-CompletionRecord -Path $completionFile -ExpectedRunId $runId
    if ($null -ne $completed) {
        $manifest.status = 'completed'
        $manifest['completedAt'] = (Get-Date).ToUniversalTime().ToString('o')
        Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 4)
        Write-Host "Task completion command received."
        Write-Host "Summary: $($completed.summary)"
        Write-Host "Validation: $($completed.validationSummary)"
        $taskCompleted = $true
        break
    }

    $attempt++
    $attemptLog = Join-Path $runDirectory ('attempt-{0:D3}.log' -f $attempt)
    $lastMessage = Join-Path $runDirectory ('attempt-{0:D3}-last-message.md' -f $attempt)
    $startedAt = Get-Date
    Write-Host "[$($startedAt.ToString('s'))] Starting Codex recovery thread, attempt $attempt."

    $codexArguments = @(
        '-C', $workspacePath,
        '-s', 'danger-full-access',
        '-a', 'never'
    )
    if (-not [string]::IsNullOrWhiteSpace($Model)) {
        $codexArguments += @('-m', $Model)
    }
    if ([string]::IsNullOrWhiteSpace($conversationId)) {
        $attemptPromptFile = $promptFile
        $codexArguments += @(
            'exec',
            '--json',
            '--output-last-message', $lastMessage,
            '-'
        )
    }
    else {
        $attemptPromptFile = $resumePromptFile
        $codexArguments += @(
            'exec',
            'resume',
            '--json',
            '--output-last-message', $lastMessage,
            $conversationId,
            '-'
        )
    }

    # Stdin avoids Windows command-line length and escaping issues for task text.
    $exitCode = -1
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        # Native stderr is task output. It must not abort the pipeline before thread.started is captured.
        $ErrorActionPreference = 'Continue'
        Get-Content -LiteralPath $attemptPromptFile -Raw -Encoding UTF8 |
            & $resolvedCodexCommand.Source @codexArguments 2>&1 |
            & $outputCaptureCommand `
                -LogFile $attemptLog `
                -ConversationIdFile $conversationIdFile
        $exitCode = $LASTEXITCODE
    }
    catch {
        $errorText = $_ | Out-String
        Write-Warning "Codex attempt $attempt failed to launch or stream output: $($_.Exception.Message)"
        if (Test-Path -LiteralPath $attemptLog -PathType Leaf) {
            [System.IO.File]::AppendAllText(
                $attemptLog,
                [Environment]::NewLine + $errorText,
                (New-Object System.Text.UTF8Encoding($false))
            )
        }
        else {
            Write-Utf8NoBom -Path $attemptLog -Content $errorText
        }
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ([string]::IsNullOrWhiteSpace($conversationId) -and
        (Test-Path -LiteralPath $conversationIdFile -PathType Leaf)) {
        $conversationId = (Read-Utf8 -Path $conversationIdFile).Trim()
        if ($conversationId -notmatch '^[0-9a-fA-F-]{36}$') {
            throw "Invalid conversation ID captured: $conversationId"
        }
        $manifest['conversationId'] = $conversationId
        Write-Utf8NoBom -Path $manifestFile -Content ($manifest | ConvertTo-Json -Depth 4)
        Write-Host "Conversation ID captured: $conversationId"
    }

    $completed = Test-CompletionRecord -Path $completionFile -ExpectedRunId $runId
    if ($null -ne $completed) {
        continue
    }

    $finishedAt = Get-Date
    if ([string]::IsNullOrWhiteSpace($conversationId)) {
        Write-Warning "Codex attempt $attempt exited with code $exitCode before a conversation ID was captured. A new conversation must be created on the next attempt. Log: $attemptLog"
    }
    else {
        Write-Warning "Codex attempt $attempt exited with code $exitCode without a completion command. The same conversation $conversationId will be resumed. Log: $attemptLog"
    }

    $exponent = [Math]::Min($attempt - 1, 8)
    $delay = [Math]::Min($MaxRetryDelaySeconds, $RetryDelaySeconds * [Math]::Pow(2, $exponent))
    $delay = [int][Math]::Ceiling($delay)
    Write-Host "[$($finishedAt.ToString('s'))] Starting a new recovery thread in $delay seconds."
    Start-Sleep -Seconds $delay
}
}
finally {
    Stop-TimeoutWatcher -StopSignalFile $watcherStopSignal -WatcherProcess $watcherProcess
}

if ($taskCompleted) {
    Write-Host 'Timeout watcher stopped; supervisor is exiting successfully.'
    exit 0
}

exit 1
