-- סקריפט בדיקה מקיף למסד הנתונים
-- הרץ את זה דרך phpMyAdmin כדי לבדוק שהכל תקין

-- 1. בדיקת קיום כל הטבלאות
SELECT '=== בדיקת טבלאות ===' AS check_type;
SELECT TABLE_NAME, TABLE_COLLATION, ENGINE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ari_stage'
ORDER BY TABLE_NAME;

-- 2. בדיקת שדה chart_pdf בטבלת songs
SELECT '=== בדיקת chart_pdf בטבלת songs ===' AS check_type;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ השדה chart_pdf קיים בטבלת songs'
        ELSE '❌ השדה chart_pdf לא קיים בטבלת songs - צריך להריץ: sql/add_chart_pdf_to_songs.sql'
    END AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'songs'
  AND COLUMN_NAME = 'chart_pdf';

-- 3. בדיקת שדה chart_pdf בטבלת lineup_songs
SELECT '=== בדיקת chart_pdf בטבלת lineup_songs ===' AS check_type;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ השדה chart_pdf קיים בטבלת lineup_songs'
        ELSE '❌ השדה chart_pdf לא קיים בטבלת lineup_songs - צריך להריץ: sql/add_chart_pdf_to_lineup_songs.sql'
    END AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'lineup_songs'
  AND COLUMN_NAME = 'chart_pdf';

-- 4. בדיקת טבלת user_invitations
SELECT '=== בדיקת טבלת user_invitations ===' AS check_type;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ טבלת user_invitations קיימת'
        ELSE '❌ טבלת user_invitations לא קיימת - צריך להריץ: sql/create_invitations_table.sql'
    END AS status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'user_invitations';

-- 5. בדיקת encoding של טבלת users
SELECT '=== בדיקת encoding של טבלת users ===' AS check_type;
SELECT 
    TABLE_NAME,
    TABLE_COLLATION,
    CASE 
        WHEN TABLE_COLLATION LIKE 'utf8mb4%' THEN '✅ Encoding תקין (utf8mb4)'
        ELSE '❌ Encoding לא תקין - צריך להריץ: sql/fix_encoding.sql'
    END AS status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'users';

-- 6. בדיקת encoding של עמודת full_name
SELECT '=== בדיקת encoding של עמודת full_name ===' AS check_type;
SELECT 
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME,
    CASE 
        WHEN CHARACTER_SET_NAME = 'utf8mb4' THEN '✅ Encoding תקין'
        ELSE '❌ Encoding לא תקין'
    END AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'full_name';

-- 7. בדיקת Foreign Keys
SELECT '=== בדיקת Foreign Keys ===' AS check_type;
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'ari_stage'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- 8. בדיקת Indexes חשובים
SELECT '=== בדיקת Indexes ===' AS check_type;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND INDEX_NAME != 'PRIMARY'
ORDER BY TABLE_NAME, INDEX_NAME;

-- 9. בדיקת מספר רשומות בכל טבלה
SELECT '=== מספר רשומות בכל טבלה ===' AS check_type;
SELECT 'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'songs', COUNT(*) FROM songs
UNION ALL
SELECT 'lineups', COUNT(*) FROM lineups
UNION ALL
SELECT 'lineup_songs', COUNT(*) FROM lineup_songs
UNION ALL
SELECT 'lineup_shares', COUNT(*) FROM lineup_shares
UNION ALL
SELECT 'user_invitations', COUNT(*) FROM user_invitations
UNION ALL
SELECT 'files', COUNT(*) FROM files
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

