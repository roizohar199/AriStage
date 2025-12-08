-- סקריפט תיקון מלא למסד הנתונים
-- הרץ את זה דרך phpMyAdmin כדי לתקן את כל הבעיות

-- 1. וידוא שהמסד נתונים מוגדר עם utf8mb4
ALTER DATABASE `ari_stage` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. הוספת שדה chart_pdf לטבלת songs (אם לא קיים)
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

-- 3. הוספת שדה chart_pdf לטבלת lineup_songs (אם לא קיים)
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

-- 4. יצירת טבלת user_invitations (אם לא קיימת)
CREATE TABLE IF NOT EXISTS `user_invitations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(190) NOT NULL,
  `host_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `token` (`token`),
  KEY `host_id` (`host_id`),
  CONSTRAINT `user_invitations_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. תיקון encoding של טבלת users
ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `users` MODIFY `full_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `users` MODIFY `email` VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `users` MODIFY `artist_role` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 6. תיקון encoding של כל הטבלאות
ALTER TABLE `songs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineups` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineup_songs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineup_shares` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `files` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `notifications` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 7. הודעת סיום
SELECT '✅ כל התיקונים הושלמו בהצלחה!' AS message;

