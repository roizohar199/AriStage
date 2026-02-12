import { pool } from "../../database/pool";
import { isElevatedRole } from "../../types/roles";

export async function listFiles(
  role,
  userId,
  opts?: {
    userId?: number;
  },
) {
  let query =
    "SELECT f.*, u.full_name AS owner_name, u.email AS owner_email FROM files f JOIN users u ON u.id = f.user_id";
  const params: any[] = [];

  // Only admin/manager are considered elevated. Any unknown role is
  // treated as a regular artist (scoped like "user").
  if (!isElevatedRole(role)) {
    query += " WHERE f.user_id = ?";
    params.push(userId);
  } else if (opts?.userId && Number.isFinite(opts.userId)) {
    query += " WHERE f.user_id = ?";
    params.push(opts.userId);
  }

  query += " ORDER BY f.id DESC";
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function insertFile(data) {
  const [result] = await pool.query(
    "INSERT INTO files (user_id, file_name, file_url, file_type) VALUES (?, ?, ?, ?)",
    [data.user_id, data.file_name, data.file_url, data.file_type],
  );
  return result.insertId;
}

export async function updateFile(id, data) {
  const [result] = await pool.query(
    "UPDATE files SET file_name = ?, file_type = ? WHERE id = ?",
    [data.file_name, data.file_type, id],
  );
  return result.affectedRows;
}

export async function deleteFile(id) {
  const [result] = await pool.query("DELETE FROM files WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function fileBelongsToUser(id, userId) {
  const [rows] = await pool.query(
    "SELECT id FROM files WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  return rows.length > 0;
}

export async function findFileById(id) {
  const [rows] = await pool.query("SELECT * FROM files WHERE id = ?", [id]);
  return rows[0];
}
