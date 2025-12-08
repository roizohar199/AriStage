@echo off
echo ========================================
echo   תיקון מלא של מסד הנתונים
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

echo [1/5] בודק חיבור ל-MySQL...
"%MYSQL_PATH%" -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo שגיאה: לא ניתן להתחבר ל-MySQL
    echo וודא ש-MySQL רץ ב-XAMPP Control Panel
    pause
    exit /b 1
)

echo [2/5] יוצר/בודק טבלת user_invitations...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0create_invitations_table.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: ייתכן שהטבלה כבר קיימת
)

echo [3/5] מוסיף שדה chart_pdf לטבלת lineup_songs...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0add_chart_pdf_to_lineup_songs.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: ייתכן שהשדה כבר קיים
)

echo [4/5] מוסיף שדה chart_pdf לטבלת songs...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0add_chart_pdf_to_songs.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: ייתכן שהשדה כבר קיים
)

echo [5/5] מתקן encoding...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0fix_encoding.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: ייתכן שה-encoding כבר תקין
)

echo.
echo ========================================
echo   ✅ כל התיקונים הושלמו!
echo ========================================
echo.
echo עכשיו הרץ את sql/verify_database.sql דרך phpMyAdmin
echo כדי לבדוק שהכל תקין.
echo.

pause

