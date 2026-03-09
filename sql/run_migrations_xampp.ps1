# Run Security Migrations using XAMPP MySQL
# This script uses XAMPP's MySQL executable

$xamppPath = "C:\xampp"
if (Test-Path "C:\XAMPP") {
    $xamppPath = "C:\XAMPP"
}

$mysqlPath = Join-Path $xamppPath "mysql\bin\mysql.exe"

if (-not (Test-Path $mysqlPath)) {
    Write-Host "ERROR: MySQL not found at $mysqlPath" -ForegroundColor Red
    Write-Host "Please update the xamppPath variable in this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Running Security Migrations ===" -ForegroundColor Cyan
Write-Host "Using MySQL at: $mysqlPath" -ForegroundColor Yellow
Write-Host ""

$password = Read-Host "Enter MySQL root password (press Enter if no password)"

$sqlFiles = @(
    "create_refresh_tokens_table.sql",
    "add_two_factor_authentication.sql",
    "create_security_audit_logs.sql"
)

$currentDir = $PSScriptRoot

foreach ($file in $sqlFiles) {
    $sqlFile = Join-Path $currentDir $file
    Write-Host "Running: $file..." -ForegroundColor Yellow
    
    if ($password) {
        & $mysqlPath -u root "-p$password" ari_stage -e "source $sqlFile"
    } else {
        & $mysqlPath -u root ari_stage -e "source $sqlFile"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "  FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Migrations complete! Restart your server." -ForegroundColor Green
