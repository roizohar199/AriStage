ALTER TABLE `users`
  ADD COLUMN `subscription_provider` VARCHAR(32) NULL DEFAULT NULL AFTER `subscription_status`,
  ADD COLUMN `provider_customer_id` VARCHAR(191) NULL DEFAULT NULL AFTER `subscription_provider`,
  ADD COLUMN `provider_subscription_id` VARCHAR(191) NULL DEFAULT NULL AFTER `provider_customer_id`,
  ADD COLUMN `subscription_renews_at` DATETIME NULL DEFAULT NULL AFTER `subscription_expires_at`,
  ADD COLUMN `subscription_cancel_at_period_end` TINYINT(1) NOT NULL DEFAULT 0 AFTER `subscription_renews_at`,
  ADD COLUMN `subscription_cancelled_at` DATETIME NULL DEFAULT NULL AFTER `subscription_cancel_at_period_end`;

ALTER TABLE `users`
  ADD INDEX `idx_users_provider_subscription_id` (`provider_subscription_id`);

ALTER TABLE `payments`
  ADD COLUMN `provider_subscription_id` VARCHAR(191) NULL DEFAULT NULL AFTER `transaction_id`,
  ADD COLUMN `provider_order_id` VARCHAR(191) NULL DEFAULT NULL AFTER `provider_subscription_id`,
  ADD COLUMN `provider_capture_id` VARCHAR(191) NULL DEFAULT NULL AFTER `provider_order_id`,
  ADD COLUMN `provider_event_id` VARCHAR(191) NULL DEFAULT NULL AFTER `provider_capture_id`,
  ADD COLUMN `provider_payload_json` LONGTEXT NULL DEFAULT NULL AFTER `provider_event_id`,
  ADD COLUMN `failure_reason` VARCHAR(255) NULL DEFAULT NULL AFTER `provider_payload_json`;

ALTER TABLE `payments`
  ADD INDEX `idx_payments_provider_subscription_id` (`provider_subscription_id`),
  ADD INDEX `idx_payments_provider_capture_id` (`provider_capture_id`),
  ADD INDEX `idx_payments_provider_order_id` (`provider_order_id`);

CREATE TABLE IF NOT EXISTS `payment_webhook_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `provider` VARCHAR(32) NOT NULL,
  `event_id` VARCHAR(191) NOT NULL,
  `event_type` VARCHAR(128) NOT NULL,
  `resource_id` VARCHAR(191) DEFAULT NULL,
  `processing_status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `payload_json` LONGTEXT NOT NULL,
  `processed_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_webhook_events_provider_event` (`provider`, `event_id`),
  KEY `idx_payment_webhook_events_resource` (`resource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payment_provider_plans` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `provider` VARCHAR(32) NOT NULL,
  `local_plan_key` VARCHAR(64) NOT NULL,
  `billing_period` VARCHAR(16) NOT NULL,
  `currency` VARCHAR(16) NOT NULL,
  `amount` INT NOT NULL,
  `provider_product_id` VARCHAR(191) DEFAULT NULL,
  `provider_plan_id` VARCHAR(191) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_provider_plans_provider_plan` (`provider`, `provider_plan_id`),
  KEY `idx_payment_provider_plans_lookup` (`provider`, `local_plan_key`, `billing_period`, `currency`, `amount`),
  KEY `idx_payment_provider_plans_product` (`provider`, `local_plan_key`, `provider_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;