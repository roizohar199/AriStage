-- בדיקת מצב ה-encoding במסד הנתונים
-- הרץ את זה כדי לראות מה המצב הנוכחי

-- 1. בדיקת encoding של המסד נתונים
SELECT 
    'מסד נתונים' AS level,
    DEFAULT_CHARACTER_SET_NAME AS charset,
    DEFAULT_COLLATION_NAME AS collation,
    CASE 
        WHEN DEFAULT_CHARACTER_SET_NAME = 'utf8mb4' THEN '✅'
        ELSE '❌'
    END AS status
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME = 'ari_stage';

-- 2. בדיקת encoding של כל הטבלאות
SELECT 
    'טבלאות' AS level,
    TABLE_NAME,
    TABLE_COLLATION,
    CASE 
        WHEN TABLE_COLLATION LIKE 'utf8mb4%' THEN '✅'
        ELSE '❌'
    END AS status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'ari_stage'
ORDER BY TABLE_NAME;

-- 3. בדיקת encoding של עמודות חשובות בטבלת users
SELECT 
    'עמודות users' AS level,
    COLUMN_NAME,
    CHARACTER_SET_NAME,
    COLLATION_NAME,
    DATA_TYPE,
    CASE 
        WHEN CHARACTER_SET_NAME = 'utf8mb4' OR CHARACTER_SET_NAME IS NULL THEN '✅'
        ELSE '❌'
    END AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('full_name', 'email', 'artist_role', 'avatar')
ORDER BY COLUMN_NAME;

-- 4. בדיקת דוגמת נתונים (אם יש)
SELECT 
    'דוגמת נתונים' AS level,
    id,
    full_name,
    email,
    artist_role,
    CASE 
        WHEN full_name LIKE '%?%' OR full_name REGEXP '[?]{2,}' THEN '❌ בעיית encoding'
        WHEN full_name IS NOT NULL AND full_name != '' THEN '✅ נראה תקין'
        ELSE '⚠️ ריק'
    END AS data_status
FROM users
LIMIT 10;

