[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$LogFile,

    [Parameter(Mandatory)]
    [string]$ConversationIdFile,

    [Parameter(ValueFromPipeline = $true)]
    [AllowNull()]
    [object]$InputObject
)

begin {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    $writer = New-Object System.IO.StreamWriter($LogFile, $false, $encoding)
}

process {
    $line = if ($null -eq $InputObject) { '' } else { $InputObject.ToString() }
    $writer.WriteLine($line)
    $writer.Flush()

    if (-not (Test-Path -LiteralPath $ConversationIdFile -PathType Leaf) -and
        $line.Contains('thread.started')) {
        $threadId = [regex]::Match(
            $line,
            '[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}'
        )
        if ($threadId.Success) {
            [System.IO.File]::WriteAllText($ConversationIdFile, $threadId.Value, $encoding)
        }
    }

    Write-Output $line
}

end {
    $writer.Dispose()
}
