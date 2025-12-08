-- הוספת שדה chart_pdf - גרסה פשוטה
-- הרץ את זה דרך phpMyAdmin או CMD

-- הוספת שדה chart_pdf לטבלת songs
ALTER TABLE `songs` 
ADD COLUMN `chart_pdf` VARCHAR(255) NULL DEFAULT NULL AFTER `notes`;

-- הוספת שדה chart_pdf לטבלת lineup_songs  
ALTER TABLE `lineup_songs` 
ADD COLUMN `chart_pdf` VARCHAR(255) NULL DEFAULT NULL AFTER `position`;

