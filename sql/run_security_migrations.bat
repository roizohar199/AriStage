@echo off
REM Run Security Module Database Migrations
REM This script runs all required SQL migrations for the security module

echo === Security Module Database Migrations ===
echo.

REM Check if MySQL credentials are set
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost
if "%MYSQL_PORT%"=="" set MYSQL_PORT=3306
if "%MYSQL_USER%"=="" set MYSQL_USER=root
if "%MYSQL_DATABASE%"=="" set MYSQL_DATABASE=ari_stage

echo Database Configuration:
echo   Host: %MYSQL_HOST%
echo   Port: %MYSQL_PORT%
echo   User: %MYSQL_USER%
echo   Database: %MYSQL_DATABASE%
echo.

set /p MYSQL_PASSWORD="Enter MySQL password for %MYSQL_USER%: "
echo.

echo Running migrations...
echo.

echo [1/3] Creating refresh_tokens table...
mysql --host=%MYSQL_HOST% --port=%MYSQL_PORT% --user=%MYSQL_USER% --password=%MYSQL_PASSWORD% %MYSQL_DATABASE% < create_refresh_tokens_table.sql
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Failed to create refresh_tokens table
) else (
    echo   SUCCESS
)
echo.

echo [2/3] Adding 2FA columns to users table...
mysql --host=%MYSQL_HOST% --port=%MYSQL_PORT% --user=%MYSQL_USER% --password=%MYSQL_PASSWORD% %MYSQL_DATABASE% < add_two_factor_authentication.sql
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Failed to add 2FA columns
) else (
    echo   SUCCESS
)
echo.

echo [3/3] Creating security_audit_logs table...
mysql --host=%MYSQL_HOST% --port=%MYSQL_PORT% --user=%MYSQL_USER% --password=%MYSQL_PASSWORD% %MYSQL_DATABASE% < create_security_audit_logs.sql
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Failed to create security_audit_logs table
) else (
    echo   SUCCESS
)
echo.

echo === Migration Complete ===
echo.
echo Please restart your server.
echo.

pause
