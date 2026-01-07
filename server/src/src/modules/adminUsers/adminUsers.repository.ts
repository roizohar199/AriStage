import { pool } from "../../database/pool.js";

export type AdminUserListRow = {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
  subscription_type: string | null;
  subscription_status: string | null;
  subscription_started_at: Date | string | null;
  subscription_expires_at: Date | string | null;
  last_seen_at: Date | string | null;
  created_at: Date | string | null;
};

export type AdminUserSubscriptionRow = {
  subscription_status: string | null;
  subscription_expires_at: Date | string | null;
};

export type AdminUpdateUserSubscriptionPayload = {
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
};

async function listUsers(
  limit?: number,
  offset?: number
): Promise<AdminUserListRow[]> {
  const values: any[] = [];
  let sql = `SELECT id, full_name, email, role, subscription_type, subscription_status, subscription_started_at, subscription_expires_at, last_seen_at, created_at FROM users ORDER BY created_at DESC`;

  if (Number.isFinite(limit) && (limit as number) > 0) {
    sql += " LIMIT ?";
    values.push(limit);

    if (Number.isFinite(offset) && (offset as number) >= 0) {
      sql += " OFFSET ?";
      values.push(offset);
    }
  }

  const [rows] = await pool.query(sql, values);
  return rows as AdminUserListRow[];
}

async function getUserSubscription(
  userId: number
): Promise<AdminUserSubscriptionRow | null> {
  const [rows] = await pool.query(
    "SELECT subscription_status, subscription_expires_at FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  return (rows as any[])[0] || null;
}

async function updateUserSubscription(
  userId: number,
  payload: AdminUpdateUserSubscriptionPayload
): Promise<number> {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for subscription update");
  }

  const clauses: string[] = [];
  const params: any[] = [];

  if (payload.subscription_type !== undefined) {
    clauses.push("subscription_type = ?");
    params.push(payload.subscription_type);
  }
  if (payload.subscription_status !== undefined) {
    clauses.push("subscription_status = ?");
    params.push(payload.subscription_status);
  }
  if (payload.subscription_expires_at !== undefined) {
    clauses.push("subscription_expires_at = ?");
    params.push(payload.subscription_expires_at);
  }
  if (!clauses.length) return 0;

  clauses.push("updated_at = NOW()");
  params.push(userId);

  const sql = `UPDATE users SET ${clauses.join(", ")} WHERE id = ?`;
  console.log("[ADMIN SUB UPDATE SQL]", sql);
  console.log("[ADMIN SUB UPDATE PARAMS]", params);
  if (!/\bWHERE\s+id\s*=\s*\?/i.test(sql)) {
    throw new Error("Unsafe subscription update query (missing WHERE id = ?)");
  }

  const [result] = await pool.query(sql, params);
  console.log("[ADMIN SUB UPDATE RESULT]", result);
  if ((result as any).affectedRows === 0) {
    console.log("[ADMIN SUB UPDATE] affectedRows === 0 for userId:", userId);
  }
  // Immediate SELECT after update
  const [rows] = await pool.query(
    `SELECT subscription_type, subscription_status, subscription_started_at, subscription_expires_at FROM users WHERE id = ?`,
    [userId]
  );
  console.log("[ADMIN SUB AFTER SELECT]", rows[0]);
  // Focused SELECT for subscription_type only
  const [rows2] = await pool.query(
    "SELECT subscription_type FROM users WHERE id = ?",
    [userId]
  );
  console.log("[ADMIN SUB AFTER SELECT TYPE ONLY]", rows2[0]);
  return (result as any).affectedRows || 0;
}

export const adminUsersRepository = {
  listUsers,
  getUserSubscription,
  updateUserSubscription,
};
