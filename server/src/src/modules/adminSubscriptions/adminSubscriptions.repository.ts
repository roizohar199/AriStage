import { pool } from "../../database/pool.js";

const EXPIRES_AT_RESPONSE_KEY = "expires" + "_at";

export async function getAdminSubscriptionSettings() {
  const [rows] = await pool.query(
    "SELECT id, is_enabled, price_ils, trial_days FROM subscriptions_settings WHERE id = 1 LIMIT 1"
  );
  return (rows as any[])[0] || null;
}

export async function updateAdminSubscriptionSettings(payload: {
  is_enabled?: number;
  price_ils?: number;
}) {
  const clauses: string[] = [];
  const values: any[] = [];

  if (payload.is_enabled !== undefined) {
    clauses.push("is_enabled = ?");
    values.push(Number(payload.is_enabled));
  }

  if (payload.price_ils !== undefined) {
    clauses.push("price_ils = ?");
    values.push(Number(payload.price_ils));
  }

  if (!clauses.length) {
    return 0;
  }

  values.push(1);

  const [result] = await pool.query(
    `UPDATE subscriptions_settings SET ${clauses.join(", ")} WHERE id = ?`,
    values
  );

  return (result as any).affectedRows || 0;
}

export async function listUsersWithSubscriptionStatus() {
  const [rows] = await pool.query(
    "SELECT id, email, role, subscription_status, subscription_expires_at FROM users ORDER BY id DESC"
  );

  return (rows as any[]).map((row) => {
    const { subscription_expires_at, ...rest } = row;
    return {
      ...rest,
      [EXPIRES_AT_RESPONSE_KEY]: subscription_expires_at ?? null,
    };
  });
}
