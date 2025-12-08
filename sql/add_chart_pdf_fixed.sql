-- הוספת שדה chart_pdf לטבלת songs (גרסה משופרת)
-- אם השדה כבר קיים, נדלג עליו

-- בדיקה אם השדה קיים לפני הוספה
SET @dbname = 'ari_stage';
SET @tablename = 'songs';
SET @columnname = 'chart_pdf';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "השדה chart_pdf כבר קיים בטבלת songs" AS message;',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` VARCHAR(255) NULL DEFAULT NULL AFTER `notes`;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- הוספת שדה chart_pdf לטבלת lineup_songs
SET @tablename = 'lineup_songs';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "השדה chart_pdf כבר קיים בטבלת lineup_songs" AS message;',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` VARCHAR(255) NULL DEFAULT NULL AFTER `position`;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- בדיקה שהשדות נוספו
SELECT 'songs' as table_name, 
       CASE WHEN COUNT(*) > 0 THEN '✅ השדה קיים' ELSE '❌ השדה לא קיים' END as status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'songs'
  AND COLUMN_NAME = 'chart_pdf'
UNION ALL
SELECT 'lineup_songs' as table_name,
       CASE WHEN COUNT(*) > 0 THEN '✅ השדה קיים' ELSE '❌ השדה לא קיים' END as status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'lineup_songs'
  AND COLUMN_NAME = 'chart_pdf';

