-- ============================================
-- בדיקה מקיפה של מסד הנתונים
-- ============================================
-- הרץ את זה דרך phpMyAdmin כדי לבדוק שהכל תקין

-- 1. בדיקת קיום כל הטבלאות הנדרשות
SELECT '=== 1. בדיקת טבלאות ===' AS section;
SELECT 
    TABLE_NAME,
    TABLE_COLLATION,
    ENGINE,
    CASE 
        WHEN TABLE_COLLATION LIKE 'utf8mb4%' THEN '✅'
        ELSE '❌'
    END AS encoding_status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ari_stage'
ORDER BY TABLE_NAME;

-- 2. בדיקת שדה chart_pdf בטבלת songs
SELECT '=== 2. בדיקת chart_pdf בטבלת songs ===' AS section;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ השדה chart_pdf קיים'
        ELSE '❌ השדה chart_pdf לא קיים - צריך להריץ: sql/add_chart_pdf_to_songs.sql'
    END AS status,
    CASE 
        WHEN COUNT(*) > 0 THEN (SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ari_stage' AND TABLE_NAME = 'songs' AND COLUMN_NAME = 'chart_pdf')
        ELSE NULL
    END AS data_type
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'songs'
  AND COLUMN_NAME = 'chart_pdf';

-- 3. בדיקת שדה chart_pdf בטבלת lineup_songs
SELECT '=== 3. בדיקת chart_pdf בטבלת lineup_songs ===' AS section;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ השדה chart_pdf קיים'
        ELSE '❌ השדה chart_pdf לא קיים - צריך להריץ: sql/add_chart_pdf_to_lineup_songs.sql'
    END AS status,
    CASE 
        WHEN COUNT(*) > 0 THEN (SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'ari_stage' AND TABLE_NAME = 'lineup_songs' AND COLUMN_NAME = 'chart_pdf')
        ELSE NULL
    END AS data_type
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'lineup_songs'
  AND COLUMN_NAME = 'chart_pdf';

-- 4. בדיקת טבלת user_invitations
SELECT '=== 4. בדיקת טבלת user_invitations ===' AS section;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ טבלת user_invitations קיימת'
        ELSE '❌ טבלת user_invitations לא קיימת - צריך להריץ: sql/create_invitations_table.sql'
    END AS status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'user_invitations';

-- 5. בדיקת encoding של טבלת users
SELECT '=== 5. בדיקת encoding של טבלת users ===' AS section;
SELECT 
    TABLE_NAME,
    TABLE_COLLATION,
    CASE 
        WHEN TABLE_COLLATION LIKE 'utf8mb4%' THEN '✅ Encoding תקין'
        ELSE '❌ Encoding לא תקין - צריך להריץ: sql/fix_encoding.sql'
    END AS status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'users';

-- 6. בדיקת encoding של עמודת full_name
SELECT '=== 6. בדיקת encoding של עמודת full_name ===' AS section;
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
SELECT '=== 7. בדיקת Foreign Keys ===' AS section;
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'ari_stage'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- 8. בדיקת מספר רשומות בכל טבלה
SELECT '=== 8. מספר רשומות בכל טבלה ===' AS section;
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

-- 9. בדיקת שדות חשובים בטבלת users
SELECT '=== 9. בדיקת שדות בטבלת users ===' AS section;
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_SET_NAME,
    CASE 
        WHEN CHARACTER_SET_NAME = 'utf8mb4' OR CHARACTER_SET_NAME IS NULL THEN '✅'
        ELSE '❌'
    END AS encoding_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('full_name', 'email', 'artist_role', 'avatar', 'invited_by')
ORDER BY COLUMN_NAME;

-- 10. בדיקת שדות חשובים בטבלת songs
SELECT '=== 10. בדיקת שדות בטבלת songs ===' AS section;
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_SET_NAME,
    CASE 
        WHEN CHARACTER_SET_NAME = 'utf8mb4' OR CHARACTER_SET_NAME IS NULL THEN '✅'
        ELSE '❌'
    END AS encoding_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'songs'
  AND COLUMN_NAME IN ('title', 'artist', 'notes', 'chart_pdf', 'user_id')
ORDER BY COLUMN_NAME;

