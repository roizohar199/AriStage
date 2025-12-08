@echo off
echo ========================================
echo   הרצת migrations למסד הנתונים
echo ========================================
echo.

REM בדיקה אם MySQL של XAMPP קיים
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
if not exist "%MYSQL_PATH%" (
    echo שגיאה: לא נמצא MySQL של XAMPP ב-%MYSQL_PATH%
    echo וודא ש-XAMPP מותקן ב-C:\xampp
    pause
    exit /b 1
)

echo [1/3] בודק חיבור ל-MySQL...
"%MYSQL_PATH%" -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo שגיאה: לא ניתן להתחבר ל-MySQL
    echo וודא ש-MySQL רץ ב-XAMPP Control Panel
    pause
    exit /b 1
)

echo [2/3] מוסיף שדה chart_pdf לטבלת lineup_songs...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0add_chart_pdf_to_lineup_songs.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: ייתכן שהשדה כבר קיים בטבלת lineup_songs
)

echo [3/3] מוסיף שדה chart_pdf לטבלת songs...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0add_chart_pdf_to_songs.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: ייתכן שהשדה כבר קיים בטבלת songs
)

echo.
echo ========================================
echo   ✅ Migrations הורצו!
echo ========================================
echo.

pause

