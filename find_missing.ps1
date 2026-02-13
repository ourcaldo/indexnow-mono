$results = @()
$files = git grep -l "logger\." -- "apps/" "packages/" ":!node_modules" ":!.next"
foreach ($f in $files) {
    $content = [IO.File]::ReadAllText($f)
    if ($content -notmatch "import.*logger") {
        $results += $f
    }
}
$results | Set-Content -Path "missing_imports.txt" -Encoding UTF8
Write-Output "Found $($results.Count) files missing logger import"
