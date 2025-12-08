-- תיקון encoding לטבלת users
-- הסקריפט הזה מתקן את הבעיה של סימני שאלה בשמות

-- 1. וידוא שהטבלה מוגדרת עם utf8mb4
ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 2. וידוא שכל העמודות מוגדרות עם utf8mb4
ALTER TABLE `users` MODIFY `full_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `users` MODIFY `email` VARCHAR(190) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE `users` MODIFY `artist_role` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 3. אם יש נתונים פגומים, תצטרך לעדכן אותם ידנית
-- לדוגמה:
-- UPDATE `users` SET `full_name` = 'משה' WHERE `id` = 1;
-- UPDATE `users` SET `full_name` = 'יואב לוי' WHERE `id` = 2;

