-- הוספת שדה chart_pdf לטבלת lineup_songs
ALTER TABLE `lineup_songs` 
ADD COLUMN `chart_pdf` VARCHAR(255) NULL DEFAULT NULL AFTER `position`;

