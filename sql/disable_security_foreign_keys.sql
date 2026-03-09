-- Disable (drop) foreign key constraints for the security module tables.
-- Use when FK constraints break local/dev workflows.
-- NOTE: This lowers data integrity guarantees.

SET FOREIGN_KEY_CHECKS = 0;

SET @fk_sql := (
  SELECT GROUP_CONCAT(
    CONCAT(
      'ALTER TABLE `', tc.TABLE_NAME, '` DROP FOREIGN KEY `', tc.CONSTRAINT_NAME, '`'
    )
    SEPARATOR '; '
  )
  FROM information_schema.TABLE_CONSTRAINTS tc
  WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
    AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND tc.TABLE_NAME IN ('refresh_tokens', 'backup_codes', 'security_audit_logs')
);

SET @fk_sql := IFNULL(@fk_sql, 'SELECT "No security foreign keys found" AS status');

PREPARE stmt FROM @fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'DONE: security foreign keys disabled' AS status;
