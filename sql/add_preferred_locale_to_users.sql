-- Add per-user preferred locale (BCP-47 tag) for UI language/direction.
--
-- This migration is idempotent via INFORMATION_SCHEMA checks.
-- Stores a locale string like 'he-IL' / 'en-US'. Direction can be derived in app code.

SET @db := DATABASE();

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'preferred_locale'
);

SET @sql_add_locale := IF(
  @col_exists = 0,
  "ALTER TABLE `users` ADD COLUMN `preferred_locale` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'he-IL' AFTER `theme`",
  "SELECT 'users.preferred_locale already exists' AS info"
);

PREPARE stmt_add_locale FROM @sql_add_locale;
EXECUTE stmt_add_locale;
DEALLOCATE PREPARE stmt_add_locale;
