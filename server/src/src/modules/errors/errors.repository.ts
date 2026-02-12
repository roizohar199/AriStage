import { pool } from "../../database/pool";

export type SystemErrorRow = {
  id: number;
  message: string | null;
  route: string | null;
  user: string | null;
  status: string | null;
  resolved: number | boolean | null;
  created_at: string | null;
};

export async function listSystemErrors(
  limit: number,
): Promise<SystemErrorRow[]> {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit || 50)));

  const [rows] = await pool.query(
    `SELECT id, message, route, user, status, resolved, created_at
     FROM system_errors
     ORDER BY created_at DESC
     LIMIT ?`,
    [safeLimit],
  );

  return Array.isArray(rows) ? (rows as any) : [];
}

export async function setSystemErrorResolved(
  id: number,
  resolved: boolean,
): Promise<boolean> {
  const [result]: any = await pool.query(
    `UPDATE system_errors SET resolved = ? WHERE id = ?`,
    [resolved ? 1 : 0, id],
  );

  return Boolean(result?.affectedRows);
}

export async function insertSystemError(input: {
  message: string;
  route?: string | null;
  user?: string | null;
  status?: number | null;
  stack?: string | null;
}) {
  const statusValue =
    typeof input.status === "number" && Number.isFinite(input.status)
      ? input.status
      : null;

  await pool.query(
    `INSERT INTO system_errors (message, route, user, status, stack, resolved, created_at)
     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
    [
      input.message?.slice(0, 1000) || "Unknown error",
      input.route?.slice(0, 512) || null,
      input.user?.slice(0, 512) || null,
      statusValue,
      input.stack ? input.stack.slice(0, 8000) : null,
    ],
  );
}
