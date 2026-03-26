ALTER TABLE `plans`
  ADD COLUMN `monthly_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `enabled`,
  ADD COLUMN `yearly_enabled` TINYINT(1) NOT NULL DEFAULT 1 AFTER `monthly_enabled`;