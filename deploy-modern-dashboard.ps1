# ZenoPay Modern Dashboard - Quick Deploy Script
# This script safely replaces your old dashboard with the new modern version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ZenoPay Modern Dashboard Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "D:\zenpay-V2\ZenoPay"

# Check if we're in the right directory
if (-not (Test-Path "$projectRoot\views")) {
    Write-Host "Error: Project directory not found!" -ForegroundColor Red
    Write-Host "Please update the `$projectRoot variable in this script" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/5] Checking if modern files exist..." -ForegroundColor Yellow

$modernFiles = @(
    "$projectRoot\views\dashboard-modern.ejs",
    "$projectRoot\public\css\dashboard-modern.css",
    "$projectRoot\public\js\dashboard-modern.js",
    "$projectRoot\views\partials\modern-header.ejs",
    "$projectRoot\views\partials\modern-footer.ejs"
)

$allExist = $true
foreach ($file in $modernFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "  ✗ Missing: $file" -ForegroundColor Red
        $allExist = $false
    } else {
        Write-Host "  ✓ Found: $(Split-Path $file -Leaf)" -ForegroundColor Green
    }
}

if (-not $allExist) {
    Write-Host ""
    Write-Host "Some modern files are missing. Please ensure all files were created." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/5] Creating backups of current files..." -ForegroundColor Yellow

$backupSuffix = "-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Backup current files
$filesToBackup = @(
    @{Old="$projectRoot\views\dashboard.ejs"; Backup="$projectRoot\views\dashboard$backupSuffix.ejs"},
    @{Old="$projectRoot\public\css\dashboard.css"; Backup="$projectRoot\public\css\dashboard$backupSuffix.css"},
    @{Old="$projectRoot\public\js\dashboard.js"; Backup="$projectRoot\public\js\dashboard$backupSuffix.js"}
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file.Old) {
        Copy-Item $file.Old $file.Backup
        Write-Host "  ✓ Backed up: $(Split-Path $file.Old -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[3/5] Removing old files..." -ForegroundColor Yellow

foreach ($file in $filesToBackup) {
    if (Test-Path $file.Old) {
        Remove-Item $file.Old
        Write-Host "  ✓ Removed: $(Split-Path $file.Old -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[4/5] Deploying modern files..." -ForegroundColor Yellow

# Rename modern files to production names
$deployFiles = @(
    @{Modern="$projectRoot\views\dashboard-modern.ejs"; Prod="$projectRoot\views\dashboard.ejs"},
    @{Modern="$projectRoot\public\css\dashboard-modern.css"; Prod="$projectRoot\public\css\dashboard.css"},
    @{Modern="$projectRoot\public\js\dashboard-modern.js"; Prod="$projectRoot\public\js\dashboard.js"}
)

foreach ($file in $deployFiles) {
    if (Test-Path $file.Modern) {
        Rename-Item $file.Modern (Split-Path $file.Prod -Leaf)
        Write-Host "  ✓ Deployed: $(Split-Path $file.Prod -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[5/5] Verifying deployment..." -ForegroundColor Yellow

$prodFiles = @(
    "$projectRoot\views\dashboard.ejs",
    "$projectRoot\public\css\dashboard.css",
    "$projectRoot\public\js\dashboard.js"
)

$deploymentSuccess = $true
foreach ($file in $prodFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  ✓ $(Split-Path $file -Leaf) ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing: $(Split-Path $file -Leaf)" -ForegroundColor Red
        $deploymentSuccess = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($deploymentSuccess) {
    Write-Host "✓ Deployment Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your modern dashboard is now live!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Start your server: npm start" -ForegroundColor White
    Write-Host "  2. Open browser and test the new design" -ForegroundColor White
    Write-Host "  3. Test on mobile (Chrome DevTools mobile view)" -ForegroundColor White
    Write-Host ""
    Write-Host "Backup Location:" -ForegroundColor Yellow
    Write-Host "  Your old files were backed up with suffix: $backupSuffix" -ForegroundColor White
    Write-Host ""
    Write-Host "To Rollback:" -ForegroundColor Yellow
    Write-Host "  Run: .\rollback-modern-dashboard.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "✗ Deployment Failed!" -ForegroundColor Red
    Write-Host "Some files are missing. Please check the errors above." -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
