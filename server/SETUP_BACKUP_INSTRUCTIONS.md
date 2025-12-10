# הוראות להגדרת גיבוי יומי אוטומטי

## שלב 1: הרצת Script ההגדרה

1. לחץ ימני על `setup-daily-backup.ps1`
2. בחר **"Run with PowerShell"** או **"Run as administrator"**
3. אם תתבקש, לחץ **"Yes"** להרשאות מנהל

## שלב 2: בדיקה שהכל עובד

לאחר הרצת ה-script, בדוק:

1. פתח **Task Scheduler** (לחץ Win+R והקלד: `taskschd.msc`)
2. מצא את ה-Task: **ARI_Stage_Daily_Backup**
3. לחץ ימני על ה-Task → **Run** (להרצה ידנית)

## שלב 3: בדיקת הגיבוי

הגיבויים נשמרים בתיקייה: `C:\ari stage\backups\`

- כל גיבוי נקרא: `ari_stage_backup_YYYY-MM-DD.sql`
- הלוג נשמר ב: `backups\backup_log.txt`

## הרצה ידנית של הגיבוי

```powershell
cd "C:\ari stage\server"
.\backup-database-daily.ps1
```

או דרך Task Scheduler:

```powershell
schtasks /Run /TN "ARI_Stage_Daily_Backup"
```

## הגדרות

- **זמן הרצה**: כל יום ב-02:00
- **שמירת גיבויים**: 30 יום
- **אוטומטי**: כן - רץ גם אם המחשב על סוללה

## פתרון בעיות

אם הגיבוי לא רץ:

1. בדוק ש-MySQL רץ (XAMPP Control Panel)
2. בדוק את הלוג: `backups\backup_log.txt`
3. הרץ ידנית את `backup-database-daily.ps1` לבדיקה


