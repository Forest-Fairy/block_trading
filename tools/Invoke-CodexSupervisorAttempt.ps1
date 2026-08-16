[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('worker-initial', 'worker-resume', 'prompt-composer')]
    [string]$Role,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Workspace,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$CodexCommand,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$PromptFile,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$LogFile,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$LastMessageFile,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$ResultFile,

    [ValidateNotNullOrEmpty()]
    [string]$OutputCaptureCommand = (Join-Path $PSScriptRoot 'Write-CodexSupervisorOutput.ps1'),

    [string]$ConversationId,

    [string]$ConversationIdFile,

    [string]$Model
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$Content
    )

    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Write-ResultRecord {
    param([Parameter(Mandatory)][System.Collections.IDictionary]$Record)

    $temporaryPath = '{0}.{1}.tmp' -f $ResultFile, ([Guid]::NewGuid().ToString('N'))
    try {
        Write-Utf8NoBom -Path $temporaryPath -Content ($Record | ConvertTo-Json -Depth 4)
        [System.IO.File]::Move($temporaryPath, $ResultFile)
    }
    finally {
        if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }
    }
}

$workspacePath = (Resolve-Path -LiteralPath $Workspace -ErrorAction Stop).Path
$promptPath = (Resolve-Path -LiteralPath $PromptFile -ErrorAction Stop).Path
$resolvedCodexCommand = Get-Command $CodexCommand -ErrorAction Stop
$codexExecutable = if (-not [string]::IsNullOrWhiteSpace($resolvedCodexCommand.Path)) {
    $resolvedCodexCommand.Path
}
else {
    $resolvedCodexCommand.Source
}

$codexArguments = @('-C', $workspacePath)
if ($Role -eq 'prompt-composer') {
    $codexArguments += @('-s', 'read-only', '-a', 'never')
}
else {
    $codexArguments += @('-s', 'danger-full-access', '-a', 'never')
}
if (-not [string]::IsNullOrWhiteSpace($Model)) {
    $codexArguments += @('-m', $Model)
}

switch ($Role) {
    'worker-initial' {
        $codexArguments += @('exec', '--json', '--output-last-message', $LastMessageFile, '-')
    }
    'worker-resume' {
        if ([string]::IsNullOrWhiteSpace($ConversationId)) {
            throw 'ConversationId is required for worker-resume.'
        }
        $codexArguments += @(
            'exec', 'resume', '--json', '--output-last-message', $LastMessageFile, $ConversationId, '-'
        )
    }
    'prompt-composer' {
        $codexArguments += @(
            'exec', '--ephemeral', '--json', '--output-last-message', $LastMessageFile, '-'
        )
    }
}

$record = [ordered]@{
    role = $Role
    processId = $PID
    startedAt = (Get-Date).ToUniversalTime().ToString('o')
    status = 'running'
    exitCode = -1
}
$exitCode = -1
try {
    $captureArguments = @{
        LogFile = $LogFile
    }
    if (-not [string]::IsNullOrWhiteSpace($ConversationIdFile)) {
        $captureArguments['ConversationIdFile'] = $ConversationIdFile
    }

    $previousErrorActionPreference = $ErrorActionPreference
    try {
        # Native stderr is part of the attempt log and must not abort the JSONL capture pipeline.
        $ErrorActionPreference = 'Continue'
        $promptText = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($promptPath))
        $promptText |
            & $codexExecutable @codexArguments 2>&1 |
            & $OutputCaptureCommand @captureArguments
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    $record.status = 'finished'
    $record.exitCode = $exitCode
}
catch {
    $record.status = 'failed-to-run'
    $record.error = $_.Exception.Message
    $errorText = $_ | Out-String
    if (Test-Path -LiteralPath $LogFile -PathType Leaf) {
        [System.IO.File]::AppendAllText(
            $LogFile,
            [Environment]::NewLine + $errorText,
            (New-Object System.Text.UTF8Encoding($false))
        )
    }
    else {
        Write-Utf8NoBom -Path $LogFile -Content $errorText
    }
}
finally {
    $record.finishedAt = (Get-Date).ToUniversalTime().ToString('o')
    Write-ResultRecord -Record $record
}

exit $exitCode
