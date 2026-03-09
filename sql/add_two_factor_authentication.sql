-- Add Two-Factor Authentication support to users table

ALTER TABLE users 
ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0 AFTER preferred_locale,
ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_enabled;

-- Create index for 2FA queries
CREATE INDEX idx_two_factor_enabled ON users(two_factor_enabled);

-- Create backup codes table for 2FA recovery
CREATE TABLE IF NOT EXISTS backup_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_used_at (used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
