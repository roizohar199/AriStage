# setup-daily-backup.ps1
# ׳”׳’׳“׳¨׳× ׳’׳™׳‘׳•׳™ ׳™׳•׳׳™ ׳׳•׳˜׳•׳׳˜׳™ ׳‘-Task Scheduler

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ׳”׳’׳“׳¨׳× ׳’׳™׳‘׳•׳™ ׳™׳•׳׳™ ׳׳•׳˜׳•׳׳˜׳™" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ׳‘׳“׳™׳§׳” ׳׳ ׳¨׳¥ ׳›׳׳ ׳”׳
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "׳”׳¡׳§׳¨׳™׳₪׳˜ ׳¦׳¨׳™׳ ׳׳¨׳•׳¥ ׳›׳׳ ׳”׳ ׳׳¢׳¨׳›׳×!" -ForegroundColor Yellow
    Write-Host "׳׳—׳¥ ׳™׳׳ ׳™ ׳¢׳ PowerShell -> Run as administrator" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "׳׳—׳™׳¦׳” ׳¢׳ Enter ׳×׳₪׳×׳— PowerShell ׳—׳“׳© ׳›׳׳ ׳”׳..." -ForegroundColor Cyan
    pause
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\setup-daily-backup.ps1"
    exit
}

$scriptPath = "$PSScriptRoot\backup-database-daily.ps1"
$taskName = "ARI_Stage_Daily_Backup"

Write-Host "[1/3] ׳‘׳•׳“׳§ ׳׳ Task ׳›׳‘׳¨ ׳§׳™׳™׳..." -ForegroundColor Yellow

# ׳׳—׳™׳§׳× Task ׳§׳™׳™׳ ׳׳ ׳§׳™׳™׳
$existingTask = schtasks /Query /TN $taskName 2>$null
if ($existingTask) {
    Write-Host "   ׳ ׳׳¦׳ Task ׳§׳™׳™׳, ׳׳•׳—׳§..." -ForegroundColor Yellow
    schtasks /Delete /TN $taskName /F | Out-Null
}

Write-Host "[2/3] ׳™׳•׳¦׳¨ Task ׳—׳“׳©..." -ForegroundColor Yellow

# ׳™׳¦׳™׳¨׳× Task ׳“׳¨׳ schtasks
$schtasksCmd = "schtasks /Create /TN `"$taskName`" /TR `"powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \`"$scriptPath\`"`" /SC DAILY /ST 02:00 /RL HIGHEST /F"

try {
    $result = Invoke-Expression $schtasksCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[3/3] ׳‘׳•׳“׳§ ׳©׳”׳›׳ ׳×׳§׳™׳..." -ForegroundColor Yellow
        
        $task = schtasks /Query /TN $taskName 2>$null
        if ($task) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  Task ׳ ׳•׳¦׳¨ ׳‘׳”׳¦׳׳—׳”!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "׳₪׳¨׳˜׳™ ׳”-Task:" -ForegroundColor Cyan
            Write-Host "  ׳©׳: $taskName" -ForegroundColor White
            Write-Host "  ׳–׳׳ ׳”׳¨׳¦׳”: ׳›׳ ׳™׳•׳ ׳‘-02:00" -ForegroundColor White
            Write-Host "  Script: $scriptPath" -ForegroundColor White
            Write-Host ""
            Write-Host "׳׳‘׳“׳™׳§׳× ׳”-Task:" -ForegroundColor Yellow
            Write-Host "  1. ׳₪׳×׳— Task Scheduler (taskschd.msc)" -ForegroundColor White
            Write-Host "  2. ׳׳¦׳: $taskName" -ForegroundColor White
            Write-Host ""
            Write-Host "׳׳”׳¨׳¦׳” ׳™׳“׳ ׳™׳×:" -ForegroundColor Yellow
            Write-Host "  schtasks /Run /TN `"$taskName`"" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "׳©׳’׳™׳׳”: Task ׳׳ ׳ ׳•׳¦׳¨" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "׳©׳’׳™׳׳” ׳‘׳™׳¦׳™׳¨׳× Task" -ForegroundColor Red
        exit 1
    }
} catch {
    $errorMsg = $_.Exception.Message
    Write-Host "׳©׳’׳™׳׳” ׳‘׳™׳¦׳™׳¨׳× Task: $errorMsg" -ForegroundColor Red
    exit 1
}

pause

