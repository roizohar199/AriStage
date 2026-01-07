-- Add admin "Last Seen" support
-- Run once on your database:
--   mysql -u root -p ari_stage < sql/add_last_seen_at.sql

ALTER TABLE users
  ADD COLUMN last_seen_at DATETIME NULL;
