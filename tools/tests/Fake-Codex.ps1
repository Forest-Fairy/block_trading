Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Get-ArgumentValue {
    param([Parameter(Mandatory)][string]$Name)

    for ($index = 0; $index -lt $args.Count - 1; $index++) {
        if ($args[$index] -eq $Name) {
            return $args[$index + 1]
        }
    }
    return $null
}

$allArguments = @($args)
$workspace = Get-ArgumentValue -Name '-C'
$lastMessageFile = Get-ArgumentValue -Name '--output-last-message'
$prompt = ($input | Out-String)
$isComposer = $allArguments -contains '--ephemeral'
$isResume = $allArguments -contains 'resume'
$role = if ($isComposer) { 'prompt-composer' } elseif ($isResume) { 'worker-resume' } else { 'worker-initial' }

$callLog = Join-Path $workspace 'fake-codex-calls.log'
[System.IO.File]::AppendAllText(
    $callLog,
    ('{0}|{1}|{2}{3}' -f (Get-Date).ToUniversalTime().ToString('o'), $PID, $role, [Environment]::NewLine),
    (New-Object System.Text.UTF8Encoding($false))
)

if ($isComposer) {
    $runId = [regex]::Match($prompt, '(?m)^Run ID:\s*(.+?)\s*$').Groups[1].Value.Trim()
    $completionFile = [regex]::Match($prompt, '(?m)^Completion record:\s*(.+?)\s*$').Groups[1].Value.Trim()
    $composedPrompt = @"
DYNAMIC_RECOVERY_PROMPT
Resume fixed worker conversation A using the actual previous progress.
Run ID: $runId
Completion record: $completionFile
Known progress: WORKER_PROGRESS_PHASE_1
Inspect the workspace, then finish remaining validation without restarting.
"@
    Write-Utf8NoBom -Path $lastMessageFile -Content $composedPrompt
    Write-Output '{"type":"turn.completed","usage":{"input_tokens":1,"output_tokens":1}}'
    exit 0
}

$threadId = '11111111-2222-4333-8444-555555555555'
if (-not $isResume) {
    Write-Output ('{{"type":"thread.started","thread_id":"{0}"}}' -f $threadId)
}

if ($prompt.Contains('TEST_TIMEOUT')) {
    Write-Utf8NoBom -Path (Join-Path $workspace 'fake-worker.pid') -Content ([string]$PID)
    Start-Sleep -Seconds 14
    Write-Utf8NoBom -Path $lastMessageFile -Content 'TIMEOUT_WORKER_FINISHED_NATURALLY'
    exit 23
}

if (-not $isResume) {
    Write-Utf8NoBom -Path $lastMessageFile -Content @'
WORKER_PROGRESS_PHASE_1
Completed: initial inspection.
Validation: incomplete.
Next: resume from current progress and finish the test.
'@
    Write-Output '{"type":"turn.failed","error":{"message":"synthetic interruption"}}'
    exit 17
}

Write-Utf8NoBom -Path (Join-Path $workspace 'resume-input.md') -Content $prompt
if (-not $prompt.Contains('DYNAMIC_RECOVERY_PROMPT') -or
    -not $prompt.Contains('WORKER_PROGRESS_PHASE_1')) {
    Write-Utf8NoBom -Path $lastMessageFile -Content 'Recovery prompt did not contain dynamic progress.'
    exit 41
}

$runId = [regex]::Match($prompt, '(?m)^Run ID:\s*(.+?)\s*$').Groups[1].Value.Trim()
$completionFile = [regex]::Match($prompt, '(?m)^Completion record:\s*(.+?)\s*$').Groups[1].Value.Trim()
$completionRecord = [ordered]@{
    status = 'completed'
    runId = $runId
    completedAt = (Get-Date).ToUniversalTime().ToString('o')
    summary = 'Synthetic Codex dynamic recovery test completed'
    validationSummary = 'Dynamic prompt carried previous progress and resumed the fixed conversation'
}
$temporaryPath = "$completionFile.tmp"
Write-Utf8NoBom -Path $temporaryPath -Content ($completionRecord | ConvertTo-Json -Depth 4)
[System.IO.File]::Move($temporaryPath, $completionFile)
Write-Utf8NoBom -Path $lastMessageFile -Content 'WORKER_COMPLETED_AFTER_DYNAMIC_RESUME'
Write-Output '{"type":"turn.completed","usage":{"input_tokens":1,"output_tokens":1}}'
exit 0
