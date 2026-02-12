import { pool } from "../../database/pool";

export async function getHealthSnapshot() {
  await pool.query("SELECT 1");
  return { ok: true, db: true };
}
