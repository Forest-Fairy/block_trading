[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Assert-True {
    param([Parameter(Mandatory)][bool]$Condition, [Parameter(Mandatory)][string]$Message)
    if (-not $Condition) {
        throw "ASSERTION FAILED: $Message"
    }
}

function Read-Utf8 {
    param([Parameter(Mandatory)][string]$Path)
    return [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($Path))
}

function Invoke-TestSupervisor {
    param(
        [Parameter(Mandatory)][string]$Workspace,
        [Parameter(Mandatory)][string]$TaskFile,
        [Parameter(Mandatory)][int]$TimeoutSeconds
    )

    $arguments = @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $supervisorScript,
        '-TaskFile', $TaskFile, '-Workspace', $Workspace, '-CodexCommand', $fakeCodexScript,
        '-RetryDelaySeconds', '1', '-MaxRetryDelaySeconds', '1',
        '-DebugMode', '-DebugTimeoutSeconds', [string]$TimeoutSeconds
    )
    $startedAt = Get-Date
    $output = (& powershell.exe @arguments 2>&1 | Out-String)
    return [pscustomobject]@{
        ExitCode = $LASTEXITCODE
        Output = $output
        ElapsedSeconds = ((Get-Date) - $startedAt).TotalSeconds
    }
}

function Get-OnlyRunDirectory {
    param([Parameter(Mandatory)][string]$Workspace)
    $directories = @(Get-ChildItem -LiteralPath (Join-Path $Workspace '.codex-supervisor\runs') -Directory)
    Assert-True -Condition ($directories.Count -eq 1) -Message "Expected exactly one run directory, found $($directories.Count)."
    return $directories[0].FullName
}

$toolsDirectory = Split-Path -Parent $PSScriptRoot
$supervisorScript = Join-Path $toolsDirectory 'Invoke-CodexDevelopmentSupervisor.ps1'
$fakeCodexScript = Join-Path $PSScriptRoot 'Fake-Codex.ps1'
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('codex-supervisor-test-' + [Guid]::NewGuid().ToString('N'))
[System.IO.Directory]::CreateDirectory($testRoot) | Out-Null

try {
    Write-Host 'TEST 1: interrupted worker -> fresh prompt composer -> dynamic prompt -> resume worker A'
    $retryWorkspace = Join-Path $testRoot 'retry-workspace'
    [System.IO.Directory]::CreateDirectory($retryWorkspace) | Out-Null
    $retryTask = Join-Path $retryWorkspace 'task.md'
    Write-Utf8NoBom -Path $retryTask -Content "# Test task`n`nTEST_RETRY"
    $retryResult = Invoke-TestSupervisor -Workspace $retryWorkspace -TaskFile $retryTask -TimeoutSeconds 20
    Assert-True -Condition ($retryResult.ExitCode -eq 0) -Message "Retry scenario exit code was $($retryResult.ExitCode). Output: $($retryResult.Output)"

    $retryRun = Get-OnlyRunDirectory -Workspace $retryWorkspace
    $retryManifest = Read-Utf8 -Path (Join-Path $retryRun 'run.json') | ConvertFrom-Json
    $calls = Read-Utf8 -Path (Join-Path $retryWorkspace 'fake-codex-calls.log')
    $initialInput = Read-Utf8 -Path (Join-Path $retryWorkspace 'initial-input.md')
    $resumeInput = Read-Utf8 -Path (Join-Path $retryWorkspace 'resume-input.md')
    Assert-True -Condition ($retryManifest.status -eq 'completed') -Message 'Retry scenario did not reach completed status.'
    Assert-True -Condition ($calls.Contains('worker-initial')) -Message 'Initial worker was not invoked.'
    Assert-True -Condition ($calls.Contains('prompt-composer')) -Message 'Fresh prompt composer was not invoked.'
    Assert-True -Condition ($calls.Contains('worker-resume')) -Message 'Worker conversation A was not resumed.'
    Assert-True -Condition ($initialInput.Contains('Initial dispatch contract:')) -Message 'Initial prompt did not contain the dispatch contract.'
    Assert-True -Condition ($initialInput.Contains('Completed with evidence; Unverified or failed; Remaining; Blockers; Next milestone; First next action.')) -Message 'Initial prompt did not require the structured progress checkpoint.'
    Assert-True -Condition ($resumeInput.Contains('DYNAMIC_RECOVERY_PROMPT')) -Message 'Resume input did not use the composed prompt.'
    Assert-True -Condition ($resumeInput.Contains('WORKER_PROGRESS_PHASE_1')) -Message 'Resume input did not carry previous progress.'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $retryRun 'attempt-002-recovery-context.md')) -Message 'Recovery context was not persisted.'
    $recoveryContext = Read-Utf8 -Path (Join-Path $retryRun 'attempt-002-recovery-context.md')
    Assert-True -Condition ($recoveryContext.Contains('exactly four states: completed with evidence, unverified, incomplete, and blocked')) -Message 'Recovery composer did not receive the four-state evidence contract.'
    Assert-True -Condition ($recoveryContext.Contains('## Current runtime progress')) -Message 'Recovery context did not include runtime progress.'
    $unicodeProbe = ([char]0x8DA3).ToString() + ([char]0x6C47).ToString() + ([char]0x4EA7).ToString() + ([char]0x54C1).ToString()
    $attemptLog = Read-Utf8 -Path (Join-Path $retryRun 'attempt-001.log')
    Assert-True -Condition ($attemptLog.Contains($unicodeProbe)) -Message 'Attempt log did not preserve the UTF-8 Chinese probe.'
    Write-Host 'PASS TEST 1'

    Write-Host 'TEST 2: 10-second timeout stops scheduling and preserves active worker'
    $timeoutWorkspace = Join-Path $testRoot 'timeout-workspace'
    [System.IO.Directory]::CreateDirectory($timeoutWorkspace) | Out-Null
    $timeoutTask = Join-Path $timeoutWorkspace 'task.md'
    Write-Utf8NoBom -Path $timeoutTask -Content "# Test task`n`nTEST_TIMEOUT"
    $timeoutResult = Invoke-TestSupervisor -Workspace $timeoutWorkspace -TaskFile $timeoutTask -TimeoutSeconds 10
    Assert-True -Condition ($timeoutResult.ExitCode -eq 2) -Message "Timeout scenario exit code was $($timeoutResult.ExitCode). Output: $($timeoutResult.Output)"
    Assert-True -Condition ($timeoutResult.ElapsedSeconds -ge 9 -and $timeoutResult.ElapsedSeconds -le 14) `
        -Message "10-second timeout returned after $($timeoutResult.ElapsedSeconds) seconds."

    $timeoutRun = Get-OnlyRunDirectory -Workspace $timeoutWorkspace
    $timeoutManifest = Read-Utf8 -Path (Join-Path $timeoutRun 'run.json') | ConvertFrom-Json
    $workerPid = [int](Read-Utf8 -Path (Join-Path $timeoutWorkspace 'fake-worker.pid')).Trim()
    $workerProcess = Get-Process -Id $workerPid -ErrorAction SilentlyContinue
    Assert-True -Condition ($timeoutManifest.status -eq 'timed_out') -Message 'Timeout manifest status is not timed_out.'
    Assert-True -Condition ([bool]$timeoutManifest.activeAttemptPreserved) -Message 'Manifest did not record preservation of the active worker.'
    Assert-True -Condition ($null -ne $workerProcess -and -not $workerProcess.HasExited) -Message 'Active worker was terminated by the supervisor timeout.'
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $timeoutRun 'attempt-002.log'))) -Message 'Supervisor scheduled another worker after timeout.'

    $naturalExitDeadline = (Get-Date).AddSeconds(8)
    while ($null -ne (Get-Process -Id $workerPid -ErrorAction SilentlyContinue) -and (Get-Date) -lt $naturalExitDeadline) {
        Start-Sleep -Milliseconds 200
    }
    Assert-True -Condition ($null -eq (Get-Process -Id $workerPid -ErrorAction SilentlyContinue)) `
        -Message 'Fake worker did not finish naturally after being preserved.'
    Write-Host 'PASS TEST 2'
    Write-Host 'ALL CODEX SUPERVISOR TESTS PASSED'
}
finally {
    $resolvedTestRoot = [System.IO.Path]::GetFullPath($testRoot)
    $resolvedTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if ($resolvedTestRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedTestRoot).StartsWith('codex-supervisor-test-')) {
        Remove-Item -LiteralPath $resolvedTestRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
