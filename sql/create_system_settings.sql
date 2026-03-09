-- =============================================
-- System Settings Table Creation
-- =============================================
-- This migration creates a system_settings table for storing
-- system-wide configuration (locales, features, etc.)
-- Idempotent: safe to run multiple times

USE `ari_stage`;

-- Create system_settings table if not exists
CREATE TABLE IF NOT EXISTS `system_settings` (
  `key` VARCHAR(191) NOT NULL COMMENT 'Setting key (unique identifier)',
  `value` TEXT COMMENT 'Setting value (JSON or plain text)',
  `description` VARCHAR(512) COMMENT 'Human-readable description',
  `category` VARCHAR(64) DEFAULT 'general' COMMENT 'Setting category (i18n, security, etc.)',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  PRIMARY KEY (`key`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System-wide configuration settings';

-- Insert default locale settings (only if not exists)
INSERT IGNORE INTO `system_settings` (`key`, `value`, `description`, `category`) 
VALUES
  ('default_locale', 'he-IL', 'Default system language (BCP-47 format)', 'i18n'),
  ('enabled_locales', '["he-IL","en-US"]', 'Available languages for users (JSON array)', 'i18n'),
  ('default_locale_mode', 'browser', 'Default language mode: "browser" (dynamic) or "fixed"', 'i18n');

-- Verification query
SELECT 
  '✓ system_settings table created' AS status,
  COUNT(*) AS settings_count
FROM `system_settings`;

SELECT * FROM `system_settings` WHERE `category` = 'i18n';
