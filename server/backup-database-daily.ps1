# backup-database-daily.ps1
# גיבוי יומי אוטומטי של מסד הנתונים

# ============================================
# הגדרות
# ============================================
$MYSQL_DUMP = "C:\xampp\mysql\bin\mysqldump.exe"
$MYSQL_USER = "root"
$MYSQL_PASSWORD = ""  # אם יש סיסמה, הוסף כאן
$DB_NAME = "ari_stage"
$BACKUP_DIR = "$PSScriptRoot\..\backups"
$DATE = Get-Date -Format "yyyy-MM-dd"
$BACKUP_FILE = "$BACKUP_DIR\ari_stage_backup_$DATE.sql"
$LOG_FILE = "$BACKUP_DIR\backup_log.txt"

# ============================================
# פונקציות
# ============================================
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LOG_FILE -Value $logMessage
    if ($Level -eq "ERROR") {
        Write-Host $logMessage -ForegroundColor Red
    } elseif ($Level -eq "SUCCESS") {
        Write-Host $logMessage -ForegroundColor Green
    } else {
        Write-Host $logMessage
    }
}

# ============================================
# בדיקות ראשוניות
# ============================================
Write-Log "========================================"
Write-Log "  התחלת גיבוי יומי: $DB_NAME"
Write-Log "========================================"

# יצירת תיקיית גיבויים אם לא קיימת
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Log "נוצרה תיקיית גיבויים: $BACKUP_DIR"
}

# בדיקה אם mysqldump קיים
if (-not (Test-Path $MYSQL_DUMP)) {
    Write-Log "שגיאה: לא נמצא mysqldump ב-$MYSQL_DUMP" "ERROR"
    Write-Log "וודא ש-XAMPP מותקן ב-C:\xampp" "ERROR"
    exit 1
}

# ============================================
# בדיקת חיבור ל-MySQL
# ============================================
Write-Log "בודק חיבור ל-MySQL..."

# בדיקה אם MySQL רץ
$mysqlService = Get-Service MySQL80 -ErrorAction SilentlyContinue
if ($mysqlService -and $mysqlService.Status -ne "Running") {
    Write-Log "MySQL לא רץ, מנסה להפעיל..." "ERROR"
    try {
        Start-Service MySQL80
        Start-Sleep -Seconds 3
        Write-Log "MySQL הופעל"
    } catch {
        Write-Log "לא ניתן להפעיל MySQL: $_" "ERROR"
        exit 1
    }
}

# ============================================
# יצירת הגיבוי
# ============================================
Write-Log "יוצר גיבוי: $BACKUP_FILE"

try {
    # בניית פקודת mysqldump
    $dumpArgs = @(
        "-u", $MYSQL_USER
        "--single-transaction"
        "--routines"
        "--triggers"
        "--events"
        "--quick"
        "--lock-tables=false"
        $DB_NAME
    )
    
    # הוספת סיסמה אם קיימת
    if ($MYSQL_PASSWORD) {
        $dumpArgs = @("-u", $MYSQL_USER, "-p$MYSQL_PASSWORD") + $dumpArgs[1..($dumpArgs.Length-1)]
    }
    
    # הרצת mysqldump
    $process = Start-Process -FilePath $MYSQL_DUMP -ArgumentList $dumpArgs -RedirectStandardOutput $BACKUP_FILE -RedirectStandardError "$BACKUP_FILE.error" -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Log "גיבוי הושלם בהצלחה!" "SUCCESS"
        Write-Log "קובץ: $BACKUP_FILE"
        Write-Log "גודל: $([math]::Round($fileSize, 2)) MB"
        
        # מחיקת קובץ שגיאות אם הוא ריק
        if (Test-Path "$BACKUP_FILE.error") {
            $errorContent = Get-Content "$BACKUP_FILE.error" -Raw
            if ([string]::IsNullOrWhiteSpace($errorContent)) {
                Remove-Item "$BACKUP_FILE.error" -Force
            } else {
                Write-Log "אזהרות: $errorContent" "ERROR"
            }
        }
        
        # מחיקת גיבויים ישנים (יותר מ-30 יום)
        Write-Log "מנקה גיבויים ישנים (יותר מ-30 יום)..."
        $oldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "ari_stage_backup_*.sql" | Where-Object {
            $_.LastWriteTime -lt (Get-Date).AddDays(-30)
        }
        
        foreach ($oldBackup in $oldBackups) {
            Remove-Item $oldBackup.FullName -Force
            Write-Log "נמחק גיבוי ישן: $($oldBackup.Name)"
        }
        
        Write-Log "========================================"
        Write-Log "  ✅ גיבוי יומי הושלם בהצלחה!"
        Write-Log "========================================"
        exit 0
    } else {
        $errorContent = ""
        if (Test-Path "$BACKUP_FILE.error") {
            $errorContent = Get-Content "$BACKUP_FILE.error" -Raw
        }
        Write-Log "שגיאה ביצירת הגיבוי (Exit Code: $($process.ExitCode))" "ERROR"
        Write-Log "פרטים: $errorContent" "ERROR"
        exit 1
    }
} catch {
    Write-Log "שגיאה ביצירת הגיבוי: $_" "ERROR"
    exit 1
}


