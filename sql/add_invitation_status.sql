-- הוספת שדה invitation_status לטבלת users
-- הסטטוס יכול להיות: pending, accepted, rejected, null (אין הזמנה)

ALTER TABLE `users` 
ADD COLUMN `invitation_status` ENUM('pending', 'accepted', 'rejected') DEFAULT NULL 
AFTER `invited_by`;

-- עדכון כל המשתמשים הקיימים שיש להם invited_by ל-accepted (כי הם כבר הצטרפו)
UPDATE `users` 
SET `invitation_status` = 'accepted' 
WHERE `invited_by` IS NOT NULL AND `invitation_status` IS NULL;





