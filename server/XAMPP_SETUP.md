# מדריך התקנה והגדרה של XAMPP

## יתרונות:
✅ MySQL מגיע בלי סיסמה כברירת מחדל
✅ פשוט יותר להגדרה
✅ מגיע עם phpMyAdmin לניהול קל
✅ אפשר להפעיל/לעצור בקלות דרך Control Panel

---

## שלב 1: הורדה והתקנה

1. הורד XAMPP מ: **https://www.apachefriends.org/**
2. בחר את הגרסה עבור Windows (PHP 8.x מומלץ)
3. הרץ את קובץ ההתקנה
4. התקן ל- `C:\xampp` (ברירת מחדל)
5. בחר להתקין את: **Apache**, **MySQL**, **phpMyAdmin**

---

## שלב 2: הפעלה

1. פתח את **XAMPP Control Panel** (כמנהל מערכת אם צריך)
2. לחץ על **Start** ליד **Apache**
3. לחץ על **Start** ליד **MySQL**

✅ אם ה-**Stop** מופיע וירוק - הכל עובד!

---

## שלב 3: עדכון קובץ .env

עדכן את קובץ `server/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ari_stage
```

**חשוב:** `DB_PASSWORD=` צריך להיות ריק!

---

## שלב 4: ייבוא מסד הנתונים

### דרך phpMyAdmin:
1. פתח דפדפן וגש ל: **http://localhost/phpmyadmin**
2. לחץ על **New** (יצירת מסד נתונים חדש)
3. שם: `ari_stage`
4. בחירת תווים: `utf8mb4_general_ci`
5. לחץ **Create**
6. בחר את `ari_stage` מהרשימה משמאל
7. לחץ על הלשונית **Import**
8. לחץ **Choose File** ובחר את: `sql/ari_stage (3).sql`
9. לחץ **Go** בתחתית

### דרך CMD:
```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root ari_stage < "C:\ari stage\sql\ari_stage (3).sql"
```

---

## שלב 5: בדיקה

נסה להתחבר:
```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root
```

אם זה עובד (לא מבקש סיסמה) - מעולה! ✅

---

## שלב 6: הפעל את השרת

```powershell
cd "C:\ari stage\server"
npm run dev
```

השרת אמור להתחבר בהצלחה! 🎉

---

## פתרון בעיות:

### אם MySQL לא מתחיל:
- בדוק אם פורט 3306 תפוס (אולי MySQL הישן עדיין רץ)
- עצור את שירות MySQL80 הישן: `net stop MySQL80`
- נסה שוב

### אם יש בעיות הרשאות:
- הרץ את XAMPP Control Panel כמנהל מערכת

### אם phpMyAdmin לא נפתח:
- וודא ש-Apache רץ
- נסה: http://127.0.0.1/phpmyadmin

---

**אחרי ההתקנה, זה אמור לעבוד מיד ללא בעיות סיסמה!** ✨

