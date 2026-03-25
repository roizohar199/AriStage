import { pool } from "../../database/pool";

export type SystemLogRow = {
  id?: number;
  level?: string | null;
  action: string | null;
  message?: string | null;
  context?: string | null;
  userId?: number | null;
  createdAt?: string | null;
  created_at?: string | null;
  user?: string | null;
  entity?: string | null;
  meta?: string | null;
};

export async function listSystemLogs(limit: number): Promise<SystemLogRow[]> {
  const safeLimit = Math.max(
    1,
    Math.min(500, Math.floor(Number(limit || 100))),
  );

  // Preferred schema
  try {
    const [rows] = await pool.query(
      "SELECT id, level, action, message, context, userId, createdAt FROM system_logs ORDER BY createdAt DESC LIMIT ?",
      [safeLimit],
    );
    return Array.isArray(rows) ? (rows as any) : [];
  } catch {
    // Fallback schema
    const [rows] = await pool.query(
      "SELECT id, action, user, entity, meta, created_at FROM system_logs ORDER BY created_at DESC LIMIT ?",
      [safeLimit],
    );
    return Array.isArray(rows) ? (rows as any) : [];
  }
}
