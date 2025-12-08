# Stop conflicting services for XAMPP
# Run as Administrator

Write-Host "Stopping conflicting services..." -ForegroundColor Yellow

# Stop MySQL service
$mysqlService = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue
if ($mysqlService) {
    Write-Host "Found MySQL service: $($mysqlService.Name)" -ForegroundColor Cyan
    Stop-Service -Name $mysqlService.Name -Force
    Write-Host "MySQL service stopped" -ForegroundColor Green
} else {
    Write-Host "No MySQL service found" -ForegroundColor Yellow
}

# Stop Tomcat service
$tomcatService = Get-Service -Name "*tomcat*" -ErrorAction SilentlyContinue
if ($tomcatService) {
    Write-Host "Found Tomcat service: $($tomcatService.Name)" -ForegroundColor Cyan
    Stop-Service -Name $tomcatService.Name -Force
    Write-Host "Tomcat service stopped" -ForegroundColor Green
} else {
    Write-Host "No Tomcat service found" -ForegroundColor Yellow
}

# Kill processes if services don't exist or didn't stop
Write-Host "`nChecking for running processes..." -ForegroundColor Yellow

$mysqlProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if ($mysqlProcess) {
    Write-Host "Stopping mysqld.exe (PID: $($mysqlProcess.Id))" -ForegroundColor Cyan
    Stop-Process -Id $mysqlProcess.Id -Force
    Write-Host "mysqld.exe stopped" -ForegroundColor Green
}

$javaProcess = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.Id -eq 10716 }
if ($javaProcess) {
    Write-Host "Stopping java.exe (PID: $($javaProcess.Id))" -ForegroundColor Cyan
    Stop-Process -Id $javaProcess.Id -Force
    Write-Host "java.exe stopped" -ForegroundColor Green
}

Write-Host "`nDone! You can now start XAMPP services." -ForegroundColor Green
Write-Host "Press any key to verify ports are free..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Verify ports are free
Write-Host "`nChecking ports..." -ForegroundColor Yellow
$port8009 = netstat -ano | findstr :8009
$port3306 = netstat -ano | findstr :3306

if (-not $port8009) {
    Write-Host "Port 8009 is now free" -ForegroundColor Green
} else {
    Write-Host "Port 8009 is still in use:" -ForegroundColor Red
    Write-Host $port8009
}

if (-not $port3306) {
    Write-Host "Port 3306 is now free" -ForegroundColor Green
} else {
    Write-Host "Port 3306 is still in use:" -ForegroundColor Red
    Write-Host $port3306
}

