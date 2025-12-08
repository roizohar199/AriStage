import { pool } from "../../database/pool.js";

export async function countAll(table) {
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
  return rows[0].count;
}

export async function countWhere(table, column, value) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM ${table} WHERE ${column} = ?`,
    [value]
  );
  return rows[0].count;
}

