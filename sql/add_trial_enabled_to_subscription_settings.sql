ALTER TABLE `subscriptions_settings`
  ADD COLUMN `trial_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `trial_days`;

UPDATE `subscriptions_settings`
SET `trial_enabled` = 1
WHERE `id` = 1 AND `trial_enabled` IS NULL;