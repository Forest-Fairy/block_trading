[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$CompletionFile,

    [Parameter(Mandatory)]
    [ValidatePattern('^[A-Za-z0-9][A-Za-z0-9-]{8,80}$')]
    [string]$RunId,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$Summary,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$ValidationSummary
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-Utf8 {
    param([Parameter(Mandatory)][string]$Path)

    return [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($Path))
}

$completionPath = [System.IO.Path]::GetFullPath($CompletionFile)
$runDirectory = Split-Path -Parent $completionPath
$manifestFile = Join-Path $runDirectory 'run.json'
if (-not (Test-Path -LiteralPath $manifestFile -PathType Leaf)) {
    throw "The supervisor manifest is missing: $manifestFile"
}
if (Test-Path -LiteralPath $completionPath -PathType Leaf) {
    throw "This run already received a completion command: $completionPath"
}

$manifest = Read-Utf8 -Path $manifestFile | ConvertFrom-Json
if ($manifest.runId -ne $RunId -or $manifest.completionFile -ne $completionPath) {
    throw 'The completion command run ID or record path does not match the supervisor manifest.'
}

$record = [ordered]@{
    status = 'completed'
    runId = $RunId
    completedAt = (Get-Date).ToUniversalTime().ToString('o')
    summary = $Summary
    validationSummary = $ValidationSummary
}
$encoding = New-Object System.Text.UTF8Encoding($false)
$temporaryPath = '{0}.{1}.tmp' -f $completionPath, ([Guid]::NewGuid().ToString('N'))

try {
    [System.IO.File]::WriteAllText($temporaryPath, ($record | ConvertTo-Json -Depth 4), $encoding)
    [System.IO.File]::Move($temporaryPath, $completionPath)
}
finally {
    if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
        Remove-Item -LiteralPath $temporaryPath -Force
    }
}

Write-Host "Task completion command record written: $completionPath"
