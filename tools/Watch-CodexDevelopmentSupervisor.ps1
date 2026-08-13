[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateRange(1, [int]::MaxValue)]
    [int]$SupervisorProcessId,

    [Parameter(Mandatory)]
    [long]$SupervisorStartTimeUtcTicks,

    [Parameter(Mandatory)]
    [datetime]$DeadlineUtc,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$StopSignalFile,

    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$WatcherLogFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-WatcherLog {
    param([Parameter(Mandatory)][string]$Message)

    $line = '{0} {1}{2}' -f (Get-Date).ToUniversalTime().ToString('o'), $Message, [Environment]::NewLine
    [System.IO.File]::AppendAllText(
        $WatcherLogFile,
        $line,
        (New-Object System.Text.UTF8Encoding($false))
    )
}

function Get-SupervisorProcess {
    $process = Get-Process -Id $SupervisorProcessId -ErrorAction SilentlyContinue
    if ($null -eq $process) {
        return $null
    }

    try {
        if ($process.StartTime.ToUniversalTime().Ticks -ne $SupervisorStartTimeUtcTicks) {
            return $null
        }
    }
    catch {
        return $null
    }

    return $process
}

Write-WatcherLog -Message "Watcher started for supervisor PID $SupervisorProcessId; deadline $($DeadlineUtc.ToUniversalTime().ToString('o'))."

while ($true) {
    if (Test-Path -LiteralPath $StopSignalFile -PathType Leaf) {
        Write-WatcherLog -Message 'Stop signal received; watcher is exiting.'
        exit 0
    }

    $supervisorProcess = Get-SupervisorProcess
    if ($null -eq $supervisorProcess) {
        Write-WatcherLog -Message 'Supervisor process is no longer running; watcher is exiting.'
        exit 0
    }

    if ((Get-Date).ToUniversalTime() -ge $DeadlineUtc.ToUniversalTime()) {
        # Check the completion-side stop signal again immediately before terminating the tree.
        if (Test-Path -LiteralPath $StopSignalFile -PathType Leaf) {
            Write-WatcherLog -Message 'Stop signal received at deadline; watcher is exiting.'
            exit 0
        }

        $supervisorProcess = Get-SupervisorProcess
        if ($null -eq $supervisorProcess) {
            Write-WatcherLog -Message 'Supervisor exited at deadline; watcher is exiting.'
            exit 0
        }

        Write-WatcherLog -Message "Timeout reached; terminating supervisor PID $SupervisorProcessId and its child process tree."
        & taskkill.exe /PID $SupervisorProcessId /T /F | Out-Null
        exit $LASTEXITCODE
    }

    Start-Sleep -Seconds 1
}
