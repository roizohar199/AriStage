-- ============================================
-- תיקון מלא של בעיית ה-encoding במסד הנתונים
-- ============================================
-- ⚠️ חשוב: הרץ גיבוי לפני הרצת הסקריפט הזה!

-- שלב 1: וידוא שהמסד נתונים מוגדר עם utf8mb4
ALTER DATABASE `ari_stage` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- שלב 1.5: יצירת טבלת user_invitations אם היא לא קיימת
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

-- שלב 2: תיקון encoding של כל הטבלאות
ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `songs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineups` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineup_songs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineup_shares` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `notifications` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `files` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- תיקון encoding של טבלת user_invitations (אם היא קיימת)
-- אם הטבלה לא קיימת, היא כבר נוצרה למעלה עם encoding נכון
ALTER TABLE `user_invitations` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- שלב 3: תיקון encoding של כל העמודות הטקסטואליות בטבלת users
ALTER TABLE `users` 
  MODIFY `full_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `email` VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `password_hash` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `artist_role` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `avatar` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `reset_token` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- שלב 4: תיקון encoding של כל העמודות הטקסטואליות בטבלת songs
ALTER TABLE `songs`
  MODIFY `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `artist` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `key_sig` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `duration_sec` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- שלב 5: תיקון encoding של כל העמודות הטקסטואליות בטבלת lineups
ALTER TABLE `lineups`
  MODIFY `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `location` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- שלב 6: הודעת סיום
SELECT '✅ תיקון encoding הושלם!' AS message;
SELECT '⚠️ אם הנתונים עדיין מופיעים בסימני שאלה, הנתונים נשמרו עם encoding שגוי מלכתחילה.' AS warning;
SELECT '💡 פתרון: עדכן את הנתונים ידנית דרך ממשק המערכת (Settings) או עדכן אותם ישירות ב-SQL.' AS tip;

