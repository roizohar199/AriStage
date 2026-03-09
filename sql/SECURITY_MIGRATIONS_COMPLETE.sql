-- =============================================================================
-- Security Module Complete Migration Script
-- Copy and paste this entire script into phpMyAdmin SQL tab and click "Go"
-- Database: ari_stage
-- =============================================================================

-- 1. CREATE REFRESH_TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME DEFAULT NULL,
  last_used_at DATETIME DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at),
  INDEX idx_revoked_at (revoked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_expires_revoked ON refresh_tokens(expires_at, revoked_at);

SELECT 'SUCCESS: refresh_tokens table created' AS STATUS;

-- 2. ADD TWO-FACTOR AUTHENTICATION SUPPORT
-- ============================================================================
-- Note: If columns already exist, you'll see warnings (not errors)
ALTER TABLE users 
ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0 AFTER preferred_locale;

ALTER TABLE users
ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_enabled;

CREATE INDEX idx_two_factor_enabled ON users(two_factor_enabled);

CREATE TABLE IF NOT EXISTS backup_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_used_at (used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'SUCCESS: 2FA columns and backup_codes table created' AS STATUS;

-- 3. CREATE SECURITY AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_category ENUM('AUTH', 'ACCESS', 'DATA', 'ADMIN', 'SECURITY') NOT NULL,
  event_action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  success TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_event_category (event_category),
  INDEX idx_created_at (created_at),
  INDEX idx_severity (severity),
  INDEX idx_success (success),
  INDEX idx_category_created (event_category, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_user_category_date ON security_audit_logs(user_id, event_category, created_at);
CREATE INDEX idx_failed_events ON security_audit_logs(success, created_at);

SELECT 'SUCCESS: security_audit_logs table created' AS STATUS;

-- 4. VERIFY ALL TABLES CREATED
-- ============================================================================
SHOW TABLES LIKE 'refresh_tokens';
SHOW TABLES LIKE 'backup_codes';
SHOW TABLES LIKE 'security_audit_logs';
SHOW COLUMNS FROM users LIKE 'two_factor%';

SELECT '=== ALL SECURITY MIGRATIONS COMPLETED SUCCESSFULLY ===' AS FINAL_STATUS;
