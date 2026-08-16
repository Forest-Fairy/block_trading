[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$LogFile,

    [string]$ConversationIdFile,

    [Parameter(ValueFromPipeline = $true)]
    [AllowNull()]
    [object]$InputObject
)

begin {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    $OutputEncoding = $encoding
    [Console]::OutputEncoding = $encoding
    [Console]::InputEncoding = $encoding
    $writer = New-Object System.IO.StreamWriter($LogFile, $false, $encoding)
}

process {
    try {
        $line = if ($null -eq $InputObject) { '' } else { $InputObject.ToString() }
        $writer.WriteLine($line)
        $writer.Flush()

        if (-not [string]::IsNullOrWhiteSpace($ConversationIdFile) -and
            -not (Test-Path -LiteralPath $ConversationIdFile -PathType Leaf) -and
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
    catch {
        $writer.Dispose()
        throw
    }
}

end {
    $writer.Dispose()
}
