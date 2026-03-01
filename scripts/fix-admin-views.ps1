# Fix broken admin EJS views that manually wrap content in include('../layouts/admin-layout', { content: `...` })
# With express-ejs-layouts, the view file IS the body – just output the content directly.

$viewsRoot = "D:\zenpay-V2\ZenoPay\views\admin"

$targets = Get-ChildItem $viewsRoot -Recurse -Filter "*.ejs" | Where-Object {
    (Get-Content $_.FullName -TotalCount 1 -Encoding UTF8) -match "include\('\.\./layouts"
}

Write-Host "Processing $($targets.Count) files...`n"

foreach ($file in $targets) {
    $lines = [System.IO.File]::ReadAllLines($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Find the line index that contains the opening `content: `` ` or `` body: ` ``
    $startIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '(content|body|pageContent)\s*:\s*`\s*$') {
            $startIdx = $i + 1   # content starts on the NEXT line
            break
        }
    }

    if ($startIdx -lt 0) {
        Write-Host "  [SKIP] No content marker found: $($file.Name)"
        continue
    }

    # Find the closing line: a line that is just whitespace + backtick (the template literal close)
    # AND the line after it matches  '}) %>'
    $endIdx = -1
    for ($i = $lines.Count - 1; $i -ge $startIdx; $i--) {
        if ($lines[$i] -match '^\s*`\s*$') {
            # Check if next non-empty line is '}) %>'
            $nextLine = if ($i + 1 -lt $lines.Count) { $lines[$i + 1].Trim() } else { "" }
            if ($nextLine -match '^\}\)\s*%>') {
                $endIdx = $i - 1   # content ends on the line BEFORE the closing backtick
                break
            }
        }
    }

    if ($endIdx -lt 0) {
        Write-Host "  [SKIP] No closing backtick found: $($file.Name)"
        continue
    }

    $contentLines = $lines[$startIdx..$endIdx]
    
    # Trim leading blank lines
    while ($contentLines.Count -gt 0 -and $contentLines[0].Trim() -eq "") {
        $contentLines = $contentLines[1..($contentLines.Count - 1)]
    }
    # Trim trailing blank lines
    while ($contentLines.Count -gt 0 -and $contentLines[-1].Trim() -eq "") {
        $contentLines = $contentLines[0..($contentLines.Count - 2)]
    }

    $newContent = $contentLines -join "`n"
    [System.IO.File]::WriteAllText($file.FullName, $newContent + "`n", [System.Text.Encoding]::UTF8)

    Write-Host "  [OK]   $($file.Name)  ($startIdx -> $endIdx, $($contentLines.Count) lines kept)"
}

Write-Host "`nDone."
