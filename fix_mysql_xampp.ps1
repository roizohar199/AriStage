# Comprehensive MySQL/XAMPP Port Conflict Fix
# Run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MySQL/XAMPP Port Conflict Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current port status
Write-Host "[1/6] Checking port 3306 status..." -ForegroundColor Yellow
$port3306 = netstat -ano | findstr :3306
if ($port3306) {
    Write-Host "Port 3306 is in use:" -ForegroundColor Red
    Write-Host $port3306
} else {
    Write-Host "Port 3306 is free" -ForegroundColor Green
}

# Step 2: Stop all MySQL services
Write-Host "`n[2/6] Stopping MySQL services..." -ForegroundColor Yellow
$mysqlServices = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue
if ($mysqlServices) {
    foreach ($service in $mysqlServices) {
        Write-Host "Found service: $($service.Name) (Status: $($service.Status))" -ForegroundColor Cyan
        if ($service.Status -eq 'Running') {
            Stop-Service -Name $service.Name -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Write-Host "  Stopped: $($service.Name)" -ForegroundColor Green
        }
    }
} else {
    Write-Host "No MySQL services found" -ForegroundColor Yellow
}

# Step 3: Kill all mysqld processes
Write-Host "`n[3/6] Stopping mysqld processes..." -ForegroundColor Yellow
$mysqlProcesses = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mysqlProcesses) {
    foreach ($process in $mysqlProcesses) {
        Write-Host "Stopping mysqld.exe (PID: $($process.Id))" -ForegroundColor Cyan
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
    Write-Host "All mysqld processes stopped" -ForegroundColor Green
} else {
    Write-Host "No mysqld processes found" -ForegroundColor Yellow
}

# Step 4: Wait and verify ports are free
Write-Host "`n[4/6] Waiting for ports to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$port3306After = netstat -ano | findstr :3306
if ($port3306After) {
    Write-Host "WARNING: Port 3306 is still in use!" -ForegroundColor Red
    Write-Host $port3306After
    Write-Host "`nTrying to identify and kill the process..." -ForegroundColor Yellow
    
    # Extract PID from netstat output
    $lines = $port3306After -split "`n"
    foreach ($line in $lines) {
        if ($line -match '\s+(\d+)\s*$') {
            $pid = $matches[1]
            Write-Host "Attempting to kill PID: $pid" -ForegroundColor Cyan
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "Port 3306 is now free!" -ForegroundColor Green
}

# Step 5: Check XAMPP MySQL data directory
Write-Host "`n[5/6] Checking XAMPP MySQL configuration..." -ForegroundColor Yellow
$xamppPath = "C:\xampp\mysql"
if (Test-Path $xamppPath) {
    Write-Host "XAMPP MySQL found at: $xamppPath" -ForegroundColor Green
    
    $dataDir = Join-Path $xamppPath "data"
    $myIni = Join-Path $xamppPath "bin\my.ini"
    
    if (Test-Path $dataDir) {
        Write-Host "Data directory exists: $dataDir" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Data directory not found: $dataDir" -ForegroundColor Red
    }
    
    if (Test-Path $myIni) {
        Write-Host "Configuration file found: $myIni" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Configuration file not found: $myIni" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: XAMPP MySQL not found at: $xamppPath" -ForegroundColor Red
    Write-Host "Please verify XAMPP installation path" -ForegroundColor Yellow
}

# Step 6: Final verification
Write-Host "`n[6/6] Final port verification..." -ForegroundColor Yellow
$finalCheck = netstat -ano | findstr :3306
if ($finalCheck) {
    Write-Host "`n❌ Port 3306 is STILL in use:" -ForegroundColor Red
    Write-Host $finalCheck
    Write-Host "`nYou may need to:" -ForegroundColor Yellow
    Write-Host "  1. Restart your computer" -ForegroundColor White
    Write-Host "  2. Or change XAMPP MySQL port (see XAMPP_PORT_FIX_GUIDE.md)" -ForegroundColor White
} else {
    Write-Host "`n✅ Port 3306 is FREE!" -ForegroundColor Green
    Write-Host "`nYou can now start MySQL from XAMPP Control Panel" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Fix Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Optional: Check MySQL error log
$xamppErrorLog = "C:\xampp\mysql\data\*.err"
$errorLogs = Get-ChildItem -Path $xamppErrorLog -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($errorLogs) {
    Write-Host "Latest MySQL error log: $($errorLogs.FullName)" -ForegroundColor Cyan
    Write-Host "To view errors, run:" -ForegroundColor Yellow
    Write-Host "  Get-Content '$($errorLogs.FullName)' -Tail 20" -ForegroundColor White
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

