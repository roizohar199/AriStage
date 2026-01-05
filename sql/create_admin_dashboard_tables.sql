-- Admin Dashboard supporting tables
-- Run this against the `ari_stage` database.

CREATE TABLE IF NOT EXISTS system_logs (
  id INT NOT NULL AUTO_INCREMENT,
  level ENUM('info','warn','error') NOT NULL DEFAULT 'info',
  action VARCHAR(64) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  context JSON NULL,
  userId INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_system_logs_createdAt (createdAt),
  KEY idx_system_logs_action (action),
  KEY idx_system_logs_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_errors (
  id INT NOT NULL AUTO_INCREMENT,
  message VARCHAR(1000) NOT NULL,
  route VARCHAR(512) NULL,
  user VARCHAR(512) NULL,
  status INT NULL,
  stack TEXT NULL,
  resolved TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_system_errors_created_at (created_at),
  KEY idx_system_errors_resolved (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feature_flags (
  `key` VARCHAR(191) NOT NULL,
  description VARCHAR(512) NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
