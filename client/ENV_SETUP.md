# הגדרת קובץ .env ב-Client

## יצירת קובץ .env

צור קובץ `.env` בתיקיית `client/` עם התוכן הבא:

```env
# API URL for Socket.IO and HTTP requests
# Use localhost for local development
VITE_API_URL=http://localhost:5000

# If you need to access server on LAN, uncomment and use:
# VITE_API_URL=http://10.0.0.99:5000
```

## חשוב!

1. **לאחר יצירת/עדכון קובץ .env:**
   - עצור את `npm run dev` (אם רץ)
   - הפעל שוב: `npm run dev`
   - Vite טוען משתני סביבה רק בהפעלה

2. **בדיקה שהכל עובד:**
   - פתח את הקונסול בדפדפן
   - בדוק שאין שגיאות WebSocket
   - החיבור אמור להיות יציב יותר (polling → websocket אוטומטי)

3. **אם אתה עובד ב-LAN:**
   - שנה את `VITE_API_URL` ל-`http://10.0.0.99:5000`
   - וודא שהשרת מאזין על `0.0.0.0:5000` (לא רק localhost)

