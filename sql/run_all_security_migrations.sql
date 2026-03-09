-- Security Module Database Migrations
-- Run this file from MySQL command line: source run_all_security_migrations.sql;
-- Or from command line: mysql -u root -p ari_stage < run_all_security_migrations.sql

-- Show current database
SELECT DATABASE() AS current_database;

-- 1. Create refresh_tokens table
SOURCE create_refresh_tokens_table.sql;
SELECT 'SUCCESS: refresh_tokens table created' AS status;

-- 2. Add 2FA columns to users table and create backup_codes table
SOURCE add_two_factor_authentication.sql;
SELECT 'SUCCESS: 2FA columns and backup_codes table created' AS status;

-- 3. Create security_audit_logs table
SOURCE create_security_audit_logs.sql;
SELECT 'SUCCESS: security_audit_logs table created' AS status;

-- Show all tables
SHOW TABLES;

-- Verify table structures
DESCRIBE refresh_tokens;
DESCRIBE backup_codes;
DESCRIBE security_audit_logs;
SHOW COLUMNS FROM users LIKE 'two_factor%';

SELECT '=== All security migrations completed successfully ===' AS final_status;
