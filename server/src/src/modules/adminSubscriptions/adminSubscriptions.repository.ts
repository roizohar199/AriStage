import { pool } from "../../database/pool.js";

export type AdminSubscriptionListRow = {
  userId: number;
  email: string;
  subscription_status: string | null;
  subscription_expires_at: Date | string | null;
};

async function listSubscriptions(
  limit?: number,
  offset?: number
): Promise<AdminSubscriptionListRow[]> {
  const values: any[] = [];
  let sql =
    "SELECT id AS userId, email, subscription_status, subscription_expires_at FROM users ORDER BY id DESC";

  if (Number.isFinite(limit) && (limit as number) > 0) {
    sql += " LIMIT ?";
    values.push(limit);

    if (Number.isFinite(offset) && (offset as number) >= 0) {
      sql += " OFFSET ?";
      values.push(offset);
    }
  }

  const [rows] = await pool.query(sql, values);
  return rows as AdminSubscriptionListRow[];
}

export const adminSubscriptionsRepository = {
  listSubscriptions,
};
