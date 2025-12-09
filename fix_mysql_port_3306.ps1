# Quick Fix for MySQL Port 3306 Conflict
# Run as Administrator: Right-click → Run with PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fixing MySQL Port 3306 Conflict" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check what's using port 3306
Write-Host "[1/4] Checking what's using port 3306..." -ForegroundColor Yellow
$port3306 = netstat -ano | findstr :3306
if ($port3306) {
    Write-Host "Port 3306 is in use:" -ForegroundColor Red
    Write-Host $port3306
} else {
    Write-Host "Port 3306 is free!" -ForegroundColor Green
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Find MySQL service
Write-Host "`n[2/4] Finding MySQL service..." -ForegroundColor Yellow
$mysqlService = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue
if ($mysqlService) {
    Write-Host "Found: $($mysqlService.Name) - Status: $($mysqlService.Status)" -ForegroundColor Cyan
} else {
    Write-Host "No MySQL service found" -ForegroundColor Yellow
}

# Stop MySQL service
if ($mysqlService -and $mysqlService.Status -eq 'Running') {
    Write-Host "`n[3/4] Stopping MySQL service..." -ForegroundColor Yellow
    try {
        Stop-Service -Name $mysqlService.Name -Force -ErrorAction Stop
        Write-Host "✅ MySQL service stopped successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to stop service: $_" -ForegroundColor Red
        Write-Host "Trying to kill process..." -ForegroundColor Yellow
        
        # Kill the process directly
        $mysqlProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
        if ($mysqlProcess) {
            Stop-Process -Id $mysqlProcess.Id -Force
            Write-Host "✅ Process killed" -ForegroundColor Green
        }
    }
} else {
    Write-Host "MySQL service is not running" -ForegroundColor Yellow
}

# Kill any remaining mysqld processes
Write-Host "`n[4/4] Checking for remaining MySQL processes..." -ForegroundColor Yellow
$mysqlProcesses = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mysqlProcesses) {
    foreach ($proc in $mysqlProcesses) {
        Write-Host "Killing mysqld.exe (PID: $($proc.Id))" -ForegroundColor Cyan
        Stop-Process -Id $proc.Id -Force
    }
    Write-Host "✅ All MySQL processes stopped" -ForegroundColor Green
} else {
    Write-Host "No MySQL processes found" -ForegroundColor Green
}

# Wait a moment
Start-Sleep -Seconds 2

# Verify port is free
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$port3306Check = netstat -ano | findstr :3306
if (-not $port3306Check) {
    Write-Host "✅ Port 3306 is now FREE!" -ForegroundColor Green
    Write-Host "`nYou can now start MySQL in XAMPP Control Panel" -ForegroundColor Green
} else {
    Write-Host "❌ Port 3306 is still in use:" -ForegroundColor Red
    Write-Host $port3306Check
    Write-Host "`nTry running this script as Administrator" -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

