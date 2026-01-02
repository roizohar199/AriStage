import { pool } from "../../database/pool.js";
import { isElevatedRole } from "../../types/roles.js";

// ✔ משוך את המשתמש כולל השדות החדשים
export async function getCurrentUser(id) {
  const [rows] = await pool.query(
    "SELECT id, full_name, email, role, theme, artist_role, avatar, subscription_type, subscription_status, subscription_started_at, subscription_expires_at FROM users WHERE id=?",
    [id]
  );
  return rows[0];
}

// ⭐ עדכון פרטי משתמש כולל תמונה ותיאור תפקיד
export async function updateSettings(id, fields) {
  const clauses: string[] = [];
  const values: any[] = [];

  // ⭐ full_name יכול להיות "" או טקסט → נבדוק אחרת
  if (fields.full_name !== undefined) {
    clauses.push("full_name = ?");
    values.push(fields.full_name);
  }

  if (fields.email !== undefined) {
    clauses.push("email = ?");
    values.push(fields.email);
  }

  if (fields.theme !== undefined) {
    clauses.push("theme = ?");
    values.push(fields.theme);
  }

  // ⭐ תיאור אמן (artist_role)
  if (fields.artist_role !== undefined) {
    clauses.push("artist_role = ?");
    values.push(fields.artist_role);
  }

  // ⭐ תמונה — שדרוג: אם ערך null → לא לעדכן
  if (fields.avatar !== undefined) {
    clauses.push("avatar = ?");
    values.push(fields.avatar);
  }

  if (clauses.length === 0) {
    return 0; // לא נשלחו נתונים לעדכון
  }

  const sql = `
    UPDATE users 
    SET ${clauses.join(", ")}, updated_at = NOW()
    WHERE id = ?
  `;

  values.push(id);

  const [result] = await pool.query(sql, values);
  return result.affectedRows;
}

// ✔ שינוי סיסמה
export async function updatePassword(id, hash) {
  await pool.query(
    "UPDATE users SET password_hash=?, updated_at=NOW() WHERE id=?",
    [hash, id]
  );
}

// ✔ רשימת משתמשים
export async function listUsers(role, userId) {
  let query =
    "SELECT id, full_name, email, role, subscription_type, subscription_status, subscription_started_at, subscription_expires_at, created_at FROM users";
  const params: any[] = [];

  // Only admin/manager are considered elevated. Any unknown role is
  // treated as a regular artist (scoped like "user").
  if (!isElevatedRole(role)) {
    query += " WHERE id = ?";
    params.push(userId);
  }

  query += " ORDER BY id DESC";
  const [rows] = await pool.query(query, params);
  return rows;
}

// ✔ בדיקת קיום מייל
export async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0];
}

// ✔ יצירת משתמש
export async function insertUser(data) {
  await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, subscription_type, subscription_status, subscription_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.full_name,
      data.email,
      data.password_hash,
      data.role,
      data.subscription_type,
      data.subscription_status ?? null,
      data.subscription_expires_at ?? null,
    ]
  );
}

// ✔ עדכון משתמש ע"י מנהל
export async function updateUserRecord(id, data) {
  const userId = Number(id);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for updateUserRecord");
  }

  const clauses: string[] = [];
  const values: any[] = [];

  if (data.full_name !== undefined) {
    clauses.push("full_name=?");
    values.push(data.full_name);
  }
  if (data.role !== undefined) {
    clauses.push("role=?");
    values.push(data.role);
  }
  if (data.subscription_type !== undefined) {
    clauses.push("subscription_type=?");
    values.push(data.subscription_type);
  }
  if (data.subscription_status !== undefined) {
    clauses.push("subscription_status=?");
    values.push(data.subscription_status);
  }
  if (data.subscription_started_at !== undefined) {
    clauses.push("subscription_started_at=?");
    values.push(data.subscription_started_at);
  }
  if (data.subscription_expires_at !== undefined) {
    clauses.push("subscription_expires_at=?");
    values.push(data.subscription_expires_at);
  }

  if (!clauses.length) return;

  await pool.query(
    `UPDATE users SET ${clauses.join(", ")}, updated_at=NOW() WHERE id=?`,
    [...values, userId]
  );
}

// ✔ מחיקה
export async function deleteUserById(id) {
  await pool.query("DELETE FROM users WHERE id=?", [id]);
}

// ✔ מציאה לפי ID
export async function findUserById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}

// ⭐ מי הזמין אותי → רשימת מארחים (רק אם ההזמנה אושרה)
export async function findMyCollection(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.subscription_type, u.avatar, u.artist_role
     FROM users u
     INNER JOIN user_hosts uh ON u.id = uh.host_id
     WHERE uh.guest_id = ? AND uh.invitation_status = 'accepted'`,
    [userId]
  );
  return rows; // מחזיר רשימה במקום משתמש אחד
}

// ⭐ הזמנות ממתינות לאישור
export async function findPendingInvitations(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.subscription_type, u.avatar, u.artist_role, uh.invitation_status
     FROM users u
     INNER JOIN user_hosts uh ON u.id = uh.host_id
     WHERE uh.guest_id = ? AND uh.invitation_status = 'pending'`,
    [userId]
  );
  return rows; // מחזיר רשימת הזמנות ממתינות
}

// ⭐ מי מחובר אליי → רשימה
export async function findConnectedToMe(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.role, u.subscription_type, u.avatar, u.artist_role, uh.invitation_status
     FROM users u
     INNER JOIN user_hosts uh ON u.id = uh.guest_id
     WHERE uh.host_id = ? AND uh.invitation_status = 'accepted'`,
    [userId]
  );
  return rows;
}

// ⭐ הזמנת אמן - הוספה לטבלת user_hosts
export async function inviteArtist(artistId, hostId) {
  const [result] = await pool.query(
    `INSERT INTO user_hosts (guest_id, host_id, invitation_status)
     VALUES (?, ?, 'pending')
     ON DUPLICATE KEY UPDATE invitation_status = 'pending'`,
    [artistId, hostId]
  );
  return result.affectedRows > 0;
}

// ⭐ ביטול הזמנה - מחיקה מטבלת user_hosts
export async function uninviteArtist(artistId, hostId) {
  const [result] = await pool.query(
    "DELETE FROM user_hosts WHERE guest_id = ? AND host_id = ?",
    [artistId, hostId]
  );
  return result.affectedRows > 0;
}

// ⭐ אורח מבטל את השתתפותו במאגר - מחיקה מטבלת user_hosts
export async function leaveCollection(artistId, hostId: number | null = null) {
  if (hostId) {
    // ביטול השתתפות במארח ספציפי
    const [result] = await pool.query(
      "DELETE FROM user_hosts WHERE guest_id = ? AND host_id = ?",
      [artistId, hostId]
    );
    return result.affectedRows > 0;
  } else {
    // ביטול כל ההשתתפויות (אם לא צוין מארח ספציפי)
    const [result] = await pool.query(
      "DELETE FROM user_hosts WHERE guest_id = ?",
      [artistId]
    );
    return result.affectedRows > 0;
  }
}

// ⭐ אישור הזמנה
export async function acceptInvitationStatus(artistId, hostId) {
  const [result] = await pool.query(
    "UPDATE user_hosts SET invitation_status = 'accepted' WHERE guest_id = ? AND host_id = ? AND invitation_status = 'pending'",
    [artistId, hostId]
  );
  return result.affectedRows > 0;
}

// ⭐ דחיית הזמנה
export async function rejectInvitationStatus(artistId, hostId) {
  const [result] = await pool.query(
    "DELETE FROM user_hosts WHERE guest_id = ? AND host_id = ? AND invitation_status = 'pending'",
    [artistId, hostId]
  );
  return result.affectedRows > 0;
}

// ⭐ בדיקה אם משתמש הוא אורח - מחזיר רשימת מארחים
export async function isGuest(userId) {
  const [rows] = await pool.query(
    "SELECT host_id FROM user_hosts WHERE guest_id = ? AND invitation_status = 'accepted'",
    [userId]
  );
  return rows.map((row) => row.host_id); // מחזיר רשימת מארחים
}

// ⭐ בדיקה אם משתמש הוא מארח (יש לו אמנים שהוזמנו)
export async function isHost(userId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) as count FROM user_hosts WHERE host_id = ? AND invitation_status = 'accepted'",
    [userId]
  );
  return Boolean((rows[0]?.count || 0) > 0);
}

// ⭐ שמירת הזמנה במייל
export async function saveInvitation(email, hostId, token) {
  // בדיקה אם יש הזמנה קיימת לאותו אימייל
  const [existing] = await pool.query(
    "SELECT id FROM user_invitations WHERE email = ? AND host_id = ? AND is_used = 0",
    [email, hostId]
  );

  if (existing.length > 0) {
    // עדכון הזמנה קיימת
    await pool.query(
      "UPDATE user_invitations SET token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY), created_at = NOW() WHERE id = ?",
      [token, existing[0].id]
    );
    return existing[0].id;
  } else {
    // יצירת הזמנה חדשה
    const [result] = await pool.query(
      "INSERT INTO user_invitations (email, host_id, token, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
      [email, hostId, token]
    );
    return result.insertId;
  }
}

// ⭐ מציאת הזמנה לפי token
export async function findInvitationByToken(token) {
  const [rows] = await pool.query(
    "SELECT * FROM user_invitations WHERE token = ? AND is_used = 0 AND expires_at > NOW()",
    [token]
  );
  return rows[0] || null;
}

// ⭐ סימון הזמנה כמשומשת
export async function markInvitationAsUsed(token) {
  await pool.query("UPDATE user_invitations SET is_used = 1 WHERE token = ?", [
    token,
  ]);
}
