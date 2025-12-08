-- תיקון נתונים קיימים במסד הנתונים
-- סקריפט זה מתקן את ה-encoding של הנתונים שכבר קיימים
-- ⚠️ חשוב: הרץ גיבוי לפני הרצת הסקריפט הזה!

-- 1. וידוא שהמסד נתונים מוגדר עם utf8mb4
ALTER DATABASE `ari_stage` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. תיקון encoding של טבלת users
ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 3. תיקון encoding של כל העמודות הטקסטואליות בטבלת users
ALTER TABLE `users` 
  MODIFY `full_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `email` VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `password_hash` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `artist_role` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `avatar` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `reset_token` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 4. תיקון encoding של טבלת songs
ALTER TABLE `songs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `songs`
  MODIFY `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `artist` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `key_sig` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `duration_sec` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `chart_pdf` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 5. תיקון encoding של טבלת lineups
ALTER TABLE `lineups` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineups`
  MODIFY `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `location` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 6. תיקון encoding של טבלת lineup_songs
ALTER TABLE `lineup_songs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineup_songs`
  MODIFY `chart_pdf` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 7. תיקון encoding של טבלת user_invitations
ALTER TABLE `user_invitations` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `user_invitations`
  MODIFY `email` VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `token` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 8. תיקון encoding של טבלת lineup_shares
ALTER TABLE `lineup_shares` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `lineup_shares`
  MODIFY `share_token` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 9. תיקון encoding של טבלת notifications
ALTER TABLE `notifications` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `notifications`
  MODIFY `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `body` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 10. תיקון encoding של טבלת files
ALTER TABLE `files` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `files`
  MODIFY `file_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `file_url` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  MODIFY `file_type` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- הודעת סיום
SELECT '✅ תיקון encoding הושלם!' AS message;
SELECT '⚠️ אם הנתונים עדיין מופיעים בסימני שאלה, ייתכן שהנתונים נשמרו עם encoding שגוי מלכתחילה.' AS warning;
SELECT '💡 פתרון: עדכן את הנתונים ידנית או באמצעות ממשק המערכת.' AS tip;

