-- ============================================
-- עדכון ידני של שמות משתמשים קיימים
-- ============================================
-- ⚠️ זה רק דוגמה - עדכן את השמות לפי הצורך שלך!

-- דוגמה: עדכון שם משתמש ספציפי
-- UPDATE users SET full_name = 'משה' WHERE id = 1;
-- UPDATE users SET full_name = 'יואב לוי' WHERE id = 2;
-- UPDATE users SET full_name = 'אור בן דוד' WHERE id = 3;
-- UPDATE users SET full_name = 'שי ביטון' WHERE id = 4;

-- או עדכון כל השמות בבת אחת (אם אתה יודע את הסדר)
-- UPDATE users SET full_name = CASE
--   WHEN id = 1 THEN 'משה'
--   WHEN id = 2 THEN 'יואב לוי'
--   WHEN id = 3 THEN 'אור בן דוד'
--   WHEN id = 4 THEN 'שי ביטון'
--   ELSE full_name
-- END;

-- בדיקה: הצג את כל המשתמשים
SELECT id, full_name, email FROM users ORDER BY id;

