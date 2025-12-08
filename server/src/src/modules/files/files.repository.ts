import { pool } from "../../database/pool.js";

export async function listFiles(role, userId) {
  let query = "SELECT * FROM files";
  const params = [];

  if (role === "user") {
    query += " WHERE user_id = ?";
    params.push(userId);
  }

  query += " ORDER BY id DESC";
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function insertFile(data) {
  const [result] = await pool.query(
    "INSERT INTO files (user_id, file_name, file_url, file_type) VALUES (?, ?, ?, ?)",
    [data.user_id, data.file_name, data.file_url, data.file_type]
  );
  return result.insertId;
}

export async function updateFile(id, data) {
  const [result] = await pool.query(
    "UPDATE files SET file_name = ?, file_type = ? WHERE id = ?",
    [data.file_name, data.file_type, id]
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
    [id, userId]
  );
  return rows.length > 0;
}

export async function findFileById(id) {
  const [rows] = await pool.query("SELECT * FROM files WHERE id = ?", [id]);
  return rows[0];
}

