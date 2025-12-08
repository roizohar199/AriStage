@echo off
REM Stop MySQL80 service to free port 3306 for XAMPP
REM Run this as Administrator (Right-click -> Run as administrator)

echo ========================================
echo   Stopping MySQL80 Service
echo ========================================
echo.

echo [1/3] Stopping MySQL80 service...
net stop MySQL80
if %errorlevel% equ 0 (
    echo MySQL80 service stopped successfully!
) else (
    echo WARNING: Could not stop MySQL80 service
    echo Make sure you're running as Administrator
    echo.
    echo Trying alternative method...
    sc stop MySQL80
)

echo.
echo [2/3] Waiting for service to stop...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Checking port 3306...
netstat -ano | findstr :3306
if %errorlevel% equ 0 (
    echo.
    echo WARNING: Port 3306 is still in use!
    echo Trying to kill mysqld processes...
    taskkill /F /IM mysqld.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
) else (
    echo Port 3306 is now free!
)

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo You can now start MySQL from XAMPP Control Panel
echo.
pause

