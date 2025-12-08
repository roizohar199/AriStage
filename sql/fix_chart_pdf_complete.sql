-- תיקון מלא: הוספת שדה chart_pdf לטבלת songs
-- אם השדה כבר קיים, הסקריפט יכשל - זה תקין

-- הוספת שדה chart_pdf לטבלת songs
ALTER TABLE `songs` 
ADD COLUMN IF NOT EXISTS `chart_pdf` VARCHAR(255) NULL DEFAULT NULL AFTER `notes`;

-- הוספת שדה chart_pdf לטבלת lineup_songs
ALTER TABLE `lineup_songs` 
ADD COLUMN IF NOT EXISTS `chart_pdf` VARCHAR(255) NULL DEFAULT NULL AFTER `position`;

-- בדיקה שהשדות נוספו
SELECT 'songs' as table_name, COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'songs'
  AND COLUMN_NAME = 'chart_pdf'
UNION ALL
SELECT 'lineup_songs' as table_name, COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'lineup_songs'
  AND COLUMN_NAME = 'chart_pdf';

