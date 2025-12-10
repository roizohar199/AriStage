# setup-daily-backup.ps1
# הגדרת גיבוי יומי אוטומטי ב-Task Scheduler

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  הגדרת גיבוי יומי אוטומטי" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# בדיקה אם רץ כמנהל
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "הסקריפט צריך לרוץ כמנהל מערכת!" -ForegroundColor Yellow
    Write-Host "לחץ ימני על PowerShell -> Run as administrator" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "לחיצה על Enter תפתח PowerShell חדש כמנהל..." -ForegroundColor Cyan
    pause
    $scriptPath = Join-Path $PSScriptRoot "setup-daily-backup.ps1"
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; .\setup-daily-backup.ps1"
    exit
}

$scriptPath = Join-Path $PSScriptRoot "backup-database-daily.ps1"
$taskName = "ARI_Stage_Daily_Backup"

Write-Host "[1/3] בודק אם Task כבר קיים..." -ForegroundColor Yellow

# מחיקת Task קיים אם קיים
$existingTask = schtasks /Query /TN $taskName 2>$null
if ($existingTask) {
    Write-Host "   נמצא Task קיים, מוחק..." -ForegroundColor Yellow
    schtasks /Delete /TN $taskName /F | Out-Null
}

Write-Host "[2/3] יוצר Task חדש..." -ForegroundColor Yellow

# יצירת Task דרך schtasks - שימוש ב-8.3 format לנתיב כדי להימנע מבעיות עם רווחים
try {
    # קבלת נתיב קצר (8.3 format) כדי להימנע מבעיות עם רווחים
    $fso = New-Object -ComObject Scripting.FileSystemObject
    $scriptPathShort = $fso.GetFile($scriptPath).ShortPath
    Write-Host "   משתמש בנתיב קצר: $scriptPathShort" -ForegroundColor Gray
} catch {
    # אם לא הצליח, נשתמש בנתיב המלא עם מרכאות
    $scriptPathShort = $scriptPath
    Write-Host "   משתמש בנתיב מלא: $scriptPathShort" -ForegroundColor Gray
}

# בניית פקודת PowerShell עם נתיב מוקף במרכאות
$taskCommand = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPathShort`""

try {
    # יצירת Task דרך schtasks עם נתיב קצר
    $result = schtasks /Create /TN $taskName /TR $taskCommand /SC DAILY /ST 02:00 /RL HIGHEST /F 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[3/3] בודק שהכל תקין..." -ForegroundColor Yellow
        
        $task = schtasks /Query /TN $taskName 2>$null
        if ($task) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  Task נוצר בהצלחה!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "פרטי ה-Task:" -ForegroundColor Cyan
            Write-Host "  שם: $taskName" -ForegroundColor White
            Write-Host "  זמן הרצה: כל יום ב-02:00" -ForegroundColor White
            Write-Host "  Script: $scriptPath" -ForegroundColor White
            Write-Host ""
            Write-Host "לבדיקת ה-Task:" -ForegroundColor Yellow
            Write-Host "  1. פתח Task Scheduler (taskschd.msc)" -ForegroundColor White
            Write-Host "  2. מצא: $taskName" -ForegroundColor White
            Write-Host ""
            Write-Host "להרצה ידנית:" -ForegroundColor Yellow
            Write-Host "  schtasks /Run /TN `"$taskName`"" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "שגיאה: Task לא נוצר" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "שגיאה ביצירת Task (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
        if ($result) {
            Write-Host $result -ForegroundColor Red
        }
        exit 1
    }
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "שגיאה ביצירת Task: $errorMsg" -ForegroundColor Red
    exit 1
}

pause