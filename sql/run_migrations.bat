@echo off
echo ========================================
echo   הרצת migrations למסד הנתונים
echo ========================================
echo.

REM בדיקה אם MySQL של XAMPP קיים, אחרת נשתמש ב-mysql.exe מה-PATH
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
if not exist "%MYSQL_PATH%" (
    for /f "delims=" %%i in ('where mysql 2^>nul') do (
        set "MYSQL_PATH=%%i"
        goto :mysql_found
    )
    echo שגיאה: לא נמצא mysql.exe
    echo נסה להתקין MySQL או לוודא ש-mysql.exe נמצא ב-PATH
    pause
    exit /b 1
)
:mysql_found

echo [1/3] בודק חיבור ל-MySQL...
"%MYSQL_PATH%" -u root -e "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo שגיאה: לא ניתן להתחבר ל-MySQL
    echo וודא ש-MySQL רץ ב-XAMPP Control Panel
    pause
    exit /b 1
)

echo [2/4] מאפשר שמירת plan keys דינמיים (payments/users)...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0allow_dynamic_plan_keys.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: לא ניתן לעדכן את שדות ה-plan keys (יתכן שכבר עודכנו)
)

echo [3/4] מוסיף שדה chart_pdf לטבלת lineup_songs...
"%MYSQL_PATH%" -u root ari_stage < "%~dp0add_chart_pdf_to_lineup_songs.sql" 2>&1
if %errorlevel% neq 0 (
    echo אזהרה: ייתכן שהשדה כבר קיים בטבלת lineup_songs
)

echo [4/4] מוסיף שדה chart_pdf לטבלת songs...
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

