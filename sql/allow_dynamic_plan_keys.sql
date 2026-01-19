-- Enable dynamic plan keys across the system (MySQL).
--
-- Problem:
-- - `users.subscription_type` and `payments.plan` are defined as ENUM('trial','pro')
--   in older schemas, which prevents storing any other `plans.key` (e.g. 'basic', 'vip').
--
-- This migration:
-- - Converts both columns to VARCHAR(64) to match `plans.key` (varchar(64)).
-- - Is safe to run multiple times (idempotent via INFORMATION_SCHEMA checks).

SET @db := DATABASE();

-- 1) users.subscription_type: ENUM -> VARCHAR(64)
SET @users_type := (
  SELECT DATA_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'subscription_type'
  LIMIT 1
);

SET @sql_users := IF(
  @users_type = 'enum',
  "ALTER TABLE `users` MODIFY COLUMN `subscription_type` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'trial'",
  "SELECT 'users.subscription_type already supports dynamic keys' AS info"
);

PREPARE stmt_users FROM @sql_users;
EXECUTE stmt_users;
DEALLOCATE PREPARE stmt_users;

-- 2) payments.plan: ENUM -> VARCHAR(64)
SET @payments_type := (
  SELECT DATA_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'plan'
  LIMIT 1
);

SET @sql_payments := IF(
  @payments_type = 'enum',
  "ALTER TABLE `payments` MODIFY COLUMN `plan` VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL",
  "SELECT 'payments.plan already supports dynamic keys' AS info"
);

PREPARE stmt_payments FROM @sql_payments;
EXECUTE stmt_payments;
DEALLOCATE PREPARE stmt_payments;

