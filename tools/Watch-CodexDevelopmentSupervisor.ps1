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
    [string]$TimeoutSignalFile,

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
        # Recheck normal completion immediately before publishing the timeout signal.
        if (Test-Path -LiteralPath $StopSignalFile -PathType Leaf) {
            Write-WatcherLog -Message 'Stop signal received at deadline; watcher is exiting.'
            exit 0
        }

        $supervisorProcess = Get-SupervisorProcess
        if ($null -eq $supervisorProcess) {
            Write-WatcherLog -Message 'Supervisor exited at deadline; watcher is exiting.'
            exit 0
        }

        $temporaryPath = '{0}.{1}.tmp' -f $TimeoutSignalFile, ([Guid]::NewGuid().ToString('N'))
        try {
            $content = [ordered]@{
                status = 'timed_out'
                reachedAt = (Get-Date).ToUniversalTime().ToString('o')
                supervisorProcessId = $SupervisorProcessId
            } | ConvertTo-Json -Depth 3
            [System.IO.File]::WriteAllText(
                $temporaryPath,
                $content,
                (New-Object System.Text.UTF8Encoding($false))
            )
            [System.IO.File]::Move($temporaryPath, $TimeoutSignalFile)
        }
        finally {
            if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) {
                Remove-Item -LiteralPath $temporaryPath -Force
            }
        }

        Write-WatcherLog -Message 'Timeout reached; timeout signal written. The supervisor will stop scheduling without terminating the active Codex attempt.'
        exit 0
    }

    Start-Sleep -Seconds 1
}
