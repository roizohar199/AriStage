# Run Security Module Database Migrations
# This script runs all required SQL migrations for the security module

Write-Host "=== Security Module Database Migrations ===" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL credentials are set
$env:MYSQL_HOST = if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { "localhost" }
$env:MYSQL_PORT = if ($env:MYSQL_PORT) { $env:MYSQL_PORT } else { "3306" }
$env:MYSQL_USER = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "root" }
$env:MYSQL_DATABASE = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "ari_stage" }

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $env:MYSQL_HOST"
Write-Host "  Port: $env:MYSQL_PORT"
Write-Host "  User: $env:MYSQL_USER"
Write-Host "  Database: $env:MYSQL_DATABASE"
Write-Host ""

# Prompt for password
$password = Read-Host "Enter MySQL password for $env:MYSQL_USER" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$migrations = @(
    @{
        file = "create_refresh_tokens_table.sql"
        description = "Create refresh_tokens table"
    },
    @{
        file = "add_two_factor_authentication.sql"
        description = "Add 2FA columns to users table"
    },
    @{
        file = "create_security_audit_logs.sql"
        description = "Create security_audit_logs table"
    }
)

$success = 0
$failed = 0

foreach ($migration in $migrations) {
    Write-Host "Running: $($migration.description)..." -ForegroundColor Yellow
    
    $sqlFile = Join-Path $PSScriptRoot $migration.file
    
    if (-not (Test-Path $sqlFile)) {
        Write-Host "  ERROR: File not found: $sqlFile" -ForegroundColor Red
        $failed++
        continue
    }
    
    try {
        # Run MySQL command
        $result = Get-Content $sqlFile | mysql --host=$env:MYSQL_HOST --port=$env:MYSQL_PORT --user=$env:MYSQL_USER --password=$plainPassword $env:MYSQL_DATABASE 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: $($migration.description)" -ForegroundColor Green
            $success++
        } else {
            Write-Host "  ERROR: $result" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "=== Migration Summary ===" -ForegroundColor Cyan
Write-Host "  Successful: $success" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All migrations completed successfully!" -ForegroundColor Green
    Write-Host "You can now restart your server." -ForegroundColor Yellow
} else {
    Write-Host "Some migrations failed. Please check the errors above." -ForegroundColor Red
}

# Clear password from memory
$plainPassword = $null
