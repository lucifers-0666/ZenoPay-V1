# ZenoPay Modern Dashboard - Rollback Script
# This script restores your old dashboard files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ZenoPay Dashboard Rollback" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "D:\zenpay-V2\ZenoPay"

Write-Host "Searching for backup files..." -ForegroundColor Yellow
Write-Host ""

# Find the most recent backup
$backups = @{
    ejs = Get-ChildItem "$projectRoot\views\dashboard-backup-*.ejs" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    css = Get-ChildItem "$projectRoot\public\css\dashboard-backup-*.css" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    js = Get-ChildItem "$projectRoot\public\js\dashboard-backup-*.js" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

if (-not $backups.ejs -or -not $backups.css -or -not $backups.js) {
    Write-Host "No backup files found!" -ForegroundColor Red
    Write-Host "Cannot perform rollback." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available backups:" -ForegroundColor Yellow
    if ($backups.ejs) { Write-Host "  ✓ EJS: $($backups.ejs.Name)" -ForegroundColor Green }
    if ($backups.css) { Write-Host "  ✓ CSS: $($backups.css.Name)" -ForegroundColor Green }
    if ($backups.js) { Write-Host "  ✓ JS: $($backups.js.Name)" -ForegroundColor Green }
    exit 1
}

Write-Host "Found backups:" -ForegroundColor Green
Write-Host "  • $($backups.ejs.Name)" -ForegroundColor White
Write-Host "  • $($backups.css.Name)" -ForegroundColor White
Write-Host "  • $($backups.js.Name)" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Do you want to restore these backups? (Y/N)"

if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Rollback cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[1/3] Backing up modern files (just in case)..." -ForegroundColor Yellow

$modernBackupSuffix = "-modern-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

$currentFiles = @(
    @{Current="$projectRoot\views\dashboard.ejs"; Backup="$projectRoot\views\dashboard$modernBackupSuffix.ejs"},
    @{Current="$projectRoot\public\css\dashboard.css"; Backup="$projectRoot\public\css\dashboard$modernBackupSuffix.css"},
    @{Current="$projectRoot\public\js\dashboard.js"; Backup="$projectRoot\public\js\dashboard$modernBackupSuffix.js"}
)

foreach ($file in $currentFiles) {
    if (Test-Path $file.Current) {
        Copy-Item $file.Current $file.Backup
        Write-Host "  ✓ Backed up current: $(Split-Path $file.Current -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[2/3] Removing current files..." -ForegroundColor Yellow

foreach ($file in $currentFiles) {
    if (Test-Path $file.Current) {
        Remove-Item $file.Current
        Write-Host "  ✓ Removed: $(Split-Path $file.Current -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[3/3] Restoring backup files..." -ForegroundColor Yellow

$restoreFiles = @(
    @{Backup=$backups.ejs.FullName; Target="$projectRoot\views\dashboard.ejs"},
    @{Backup=$backups.css.FullName; Target="$projectRoot\public\css\dashboard.css"},
    @{Backup=$backups.js.FullName; Target="$projectRoot\public\js\dashboard.js"}
)

foreach ($file in $restoreFiles) {
    Copy-Item $file.Backup $file.Target
    Write-Host "  ✓ Restored: $(Split-Path $file.Target -Leaf)" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Rollback Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your old dashboard has been restored." -ForegroundColor Cyan
Write-Host ""
Write-Host "Modern files backed up with suffix: $modernBackupSuffix" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now restart your server: npm start" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
