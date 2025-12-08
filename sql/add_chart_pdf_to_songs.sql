-- הוספת שדה chart_pdf לטבלת songs
ALTER TABLE `songs` 
ADD COLUMN `chart_pdf` VARCHAR(255) NULL DEFAULT NULL AFTER `notes`;

