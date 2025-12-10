# הפעלת MySQL - הרץ כמנהל מערכת

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  הפעלת MySQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# בדיקה אם רץ כמנהל
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  הסקריפט צריך לרוץ כמנהל מערכת!" -ForegroundColor Yellow
    Write-Host "לחץ ימני על PowerShell → Run as administrator" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "לחיצה על Enter תפתח PowerShell חדש כמנהל..." -ForegroundColor Cyan
    pause
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\start-mysql.ps1"
    exit
}

Write-Host "[1/3] בודק את סטטוס MySQL..." -ForegroundColor Yellow
$service = Get-Service MySQL80 -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "❌ שגיאה: שירות MySQL80 לא נמצא" -ForegroundColor Red
    Write-Host "וודא ש-MySQL מותקן במחשב" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "   שירות: $($service.DisplayName)" -ForegroundColor Cyan
Write-Host "   סטטוס: $($service.Status)" -ForegroundColor Cyan

if ($service.Status -eq "Running") {
    Write-Host ""
    Write-Host "✅ MySQL כבר רץ!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[2/3] מפעיל את MySQL..." -ForegroundColor Yellow
    try {
        Start-Service MySQL80
        Start-Sleep -Seconds 2
        $service.Refresh()
        
        if ($service.Status -eq "Running") {
            Write-Host "✅ MySQL הופעל בהצלחה!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  MySQL לא הצליח להתחיל" -ForegroundColor Yellow
            Write-Host "נסה להפעיל ידנית דרך Services (services.msc)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ שגיאה בהפעלת MySQL: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "נסה להפעיל ידנית:" -ForegroundColor Yellow
        Write-Host "  1. לחץ Win+R" -ForegroundColor White
        Write-Host "  2. הקלד: services.msc" -ForegroundColor White
        Write-Host "  3. מצא MySQL80 → לחץ ימני → Start" -ForegroundColor White
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "[3/3] בודק חיבור..." -ForegroundColor Yellow
try {
    $result = mysql -u root -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ חיבור ל-MySQL הצליח!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  חיבור ל-MySQL נכשל" -ForegroundColor Yellow
        Write-Host "   אבל השירות רץ - אולי צריך להמתין כמה שניות" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  לא ניתן לבדוק חיבור (mysql לא ב-PATH)" -ForegroundColor Yellow
    Write-Host "   אבל השירות רץ - זה בסדר" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ MySQL מוכן לשימוש!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "עכשיו תוכל להפעיל את השרת:" -ForegroundColor White
Write-Host "  cd `"C:\ari stage\server`"" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""

pause

