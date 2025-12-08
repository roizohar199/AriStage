import { pool } from "../../database/pool.js";

export async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0];
}

export async function createUser({
  full_name,
  email,
  password_hash,
  role,
  subscription_type,
  artist_role,
  avatar,
}) {
  const [result] = await pool.query(
    `
    INSERT INTO users 
      (full_name, email, password_hash, role, subscription_type, artist_role, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      full_name,
      email,
      password_hash,
      role,
      subscription_type,
      artist_role,
      avatar,
    ]
  );

  // ⭐ מחזיר את ה־ID של המשתמש החדש
  return result.insertId;
}

export async function saveResetToken(userId, token, expiresAt) {
  await pool.query(
    "UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?",
    [token, expiresAt, userId]
  );
}

export async function findUserByResetToken(token) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_expires > ? LIMIT 1",
    [token, Date.now()]
  );
  return rows[0];
}

export async function updatePassword(userId, password_hash) {
  await pool.query(
    `
    UPDATE users 
    SET password_hash = ?, reset_token = NULL, reset_expires = NULL 
    WHERE id = ?
    `,
    [password_hash, userId]
  );
}
