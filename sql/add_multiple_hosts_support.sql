-- ============================================
-- תמיכה בריבוי מארחים - מעבר מ-invited_by לטבלת יחסים
-- ============================================

-- יצירת טבלת יחסים בין אורחים למארחים
CREATE TABLE IF NOT EXISTS `user_hosts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guest_id` int(11) NOT NULL,
  `host_id` int(11) NOT NULL,
  `invitation_status` ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_guest_host` (`guest_id`, `host_id`),
  KEY `guest_id` (`guest_id`),
  KEY `host_id` (`host_id`),
  CONSTRAINT `user_hosts_ibfk_1` FOREIGN KEY (`guest_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_hosts_ibfk_2` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- העברת נתונים קיימים מ-invited_by לטבלה החדשה
INSERT INTO `user_hosts` (`guest_id`, `host_id`, `invitation_status`)
SELECT 
  id as guest_id,
  invited_by as host_id,
  COALESCE(invitation_status, 'accepted') as invitation_status
FROM `users`
WHERE `invited_by` IS NOT NULL
ON DUPLICATE KEY UPDATE 
  `invitation_status` = VALUES(`invitation_status`);

-- הוספת אינדקסים לשיפור ביצועים
CREATE INDEX idx_guest_status ON `user_hosts` (`guest_id`, `invitation_status`);
CREATE INDEX idx_host_status ON `user_hosts` (`host_id`, `invitation_status`);

