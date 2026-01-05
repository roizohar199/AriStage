import { pool } from "../../database/pool.js";

export type UpdateUserSubscriptionPayload = {
  subscription_type?: string;
  subscription_status?: string;
  subscription_expires_at?: string | null;
};

export async function updateUserSubscription(
  userId: number,
  payload: UpdateUserSubscriptionPayload
) {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for subscription update");
  }

  const clauses: string[] = [];
  const values: any[] = [];

  if (payload.subscription_type !== undefined) {
    clauses.push("subscription_type = ?");
    values.push(payload.subscription_type);
  }

  if (payload.subscription_status !== undefined) {
    clauses.push("subscription_status = ?");
    values.push(payload.subscription_status);
  }

  if (payload.subscription_expires_at !== undefined) {
    clauses.push("subscription_expires_at = ?");
    values.push(payload.subscription_expires_at);
  }

  if (!clauses.length) {
    return 0;
  }

  clauses.push("updated_at = NOW()");
  values.push(userId);

  const sql = `UPDATE users SET ${clauses.join(", ")} WHERE id = ?`;
  // Safety net: never run UPDATE without WHERE
  if (!/\bWHERE\s+id\s*=\s*\?/i.test(sql)) {
    throw new Error("Unsafe subscription update query (missing WHERE id = ?)");
  }

  const [result] = await pool.query(sql, values);

  return (result as any).affectedRows || 0;
}

export async function getUserSubscriptionFields(userId: number) {
  const [rows] = await pool.query(
    "SELECT id, email, role, subscription_type, subscription_status, subscription_expires_at FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  return (rows as any[])[0] || null;
}

export async function listUsers() {
  const [rows] = await pool.query(
    "SELECT id, full_name, email, role, subscription_status, subscription_type, subscription_started_at, subscription_expires_at, created_at FROM users ORDER BY created_at DESC"
  );
  return rows as any[];
}
