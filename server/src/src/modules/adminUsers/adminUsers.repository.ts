import { pool } from "../../database/pool.js";

export type AdminUserListRow = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  created_at: Date | string | null;
  last_seen_at: Date | string | null;
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
  let sql =
    "SELECT id, email, full_name, role, created_at, last_seen_at FROM users ORDER BY created_at DESC";

  if (Number.isFinite(limit) && (limit as number) > 0) {
    sql += " LIMIT ?";
    values.push(limit);

    if (Number.isFinite(offset) && (offset as number) >= 0) {
      sql += " OFFSET ?";
      values.push(offset);
    }
  }

  try {
    const [rows] = await pool.query(sql, values);
    return rows as AdminUserListRow[];
  } catch (err: any) {
    // Backwards compatibility: if DB hasn't been migrated yet.
    if (err?.code === "ER_BAD_FIELD_ERROR") {
      const fallbackValues: any[] = [];
      let fallbackSql =
        "SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC";

      if (Number.isFinite(limit) && (limit as number) > 0) {
        fallbackSql += " LIMIT ?";
        fallbackValues.push(limit);

        if (Number.isFinite(offset) && (offset as number) >= 0) {
          fallbackSql += " OFFSET ?";
          fallbackValues.push(offset);
        }
      }

      const [fallbackRows] = await pool.query(fallbackSql, fallbackValues);
      return (fallbackRows as any[]).map((r) => ({
        ...r,
        last_seen_at: null,
      })) as AdminUserListRow[];
    }
    throw err;
  }
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
  const values: any[] = [];

  if (payload.subscription_status !== undefined) {
    clauses.push("subscription_status = ?");
    values.push(payload.subscription_status);
  }

  if (payload.subscription_expires_at !== undefined) {
    clauses.push("subscription_expires_at = ?");
    values.push(payload.subscription_expires_at);
  }

  if (!clauses.length) return 0;

  clauses.push("updated_at = NOW()");
  values.push(userId);

  const sql = `UPDATE users SET ${clauses.join(", ")} WHERE id = ?`;
  if (!/\bWHERE\s+id\s*=\s*\?/i.test(sql)) {
    throw new Error("Unsafe subscription update query (missing WHERE id = ?)");
  }

  const [result] = await pool.query(sql, values);
  return (result as any).affectedRows || 0;
}

export const adminUsersRepository = {
  listUsers,
  getUserSubscription,
  updateUserSubscription,
};
