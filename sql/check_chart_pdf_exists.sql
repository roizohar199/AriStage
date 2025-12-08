-- בדיקה אם השדה chart_pdf קיים בטבלת songs
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ari_stage'
  AND TABLE_NAME = 'songs'
  AND COLUMN_NAME = 'chart_pdf';

-- אם השאילתה לא מחזירה תוצאות, השדה לא קיים

