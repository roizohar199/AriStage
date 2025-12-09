@echo off
REM Quick Fix for MySQL Port 3306 Conflict
REM Run as Administrator: Right-click → Run as administrator

echo ========================================
echo   Fixing MySQL Port 3306 Conflict
echo ========================================
echo.

echo [1/3] Checking what's using port 3306...
netstat -ano | findstr :3306
if %errorlevel% neq 0 (
    echo Port 3306 is free!
    pause
    exit /b 0
)

echo.
echo [2/3] Stopping MySQL80 service...
net stop MySQL80
if %errorlevel% neq 0 (
    echo Warning: Could not stop MySQL80 service
    echo Trying to kill mysqld.exe process...
    for /f "tokens=2" %%a in ('netstat -ano ^| findstr :3306 ^| findstr LISTENING') do (
        taskkill /F /PID %%a
    )
) else (
    echo MySQL80 service stopped successfully!
)

echo.
echo [3/3] Verifying port is free...
timeout /t 2 /nobreak >nul
netstat -ano | findstr :3306
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Port 3306 is now FREE!
    echo ========================================
    echo.
    echo You can now start MySQL in XAMPP Control Panel
) else (
    echo.
    echo ========================================
    echo   Port 3306 is still in use
    echo ========================================
    echo.
    echo Try running this script as Administrator
    echo Or use the PowerShell script: fix_mysql_port_3306.ps1
)

echo.
pause

