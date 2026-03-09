-- Create security audit logs table for comprehensive security monitoring

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

-- Create index for common queries
CREATE INDEX idx_user_category_date ON security_audit_logs(user_id, event_category, created_at);
CREATE INDEX idx_failed_events ON security_audit_logs(success, created_at);
