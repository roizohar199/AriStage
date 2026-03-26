import { pool } from "../../database/pool";
import { AppError } from "../../core/errors";
import { tServer } from "../../i18n/serverI18n";
import { listEnabledPlans } from "../plans/plans.repository";

export type SubscriptionSettings = {
  is_enabled: number;
  price_ils: number;
  trial_days: number;
  trial_enabled: number;
};

export async function getSubscriptionSettings(): Promise<SubscriptionSettings> {
  const [rows] = await pool.query(
    "SELECT is_enabled, price_ils, trial_days, trial_enabled FROM subscriptions_settings WHERE id = 1 LIMIT 1",
  );

  const settings = (rows as any[])[0];
  if (!settings) {
    throw new AppError(
      500,
      tServer("he-IL", "subscriptions.settingsRowMissing"),
      undefined,
    );
  }

  return {
    is_enabled: Number(settings.is_enabled),
    price_ils: Number(settings.price_ils),
    trial_days: Number(settings.trial_days),
    trial_enabled: Number(settings.trial_enabled ?? 1),
  };
}

export type UserSubscriptionState = {
  subscription_status: string | null;
  subscription_provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  subscription_expires_at: Date | null;
  subscription_started_at: Date | null;
  subscription_renews_at: Date | null;
  subscription_cancel_at_period_end: number;
  subscription_cancelled_at: Date | null;
};

export async function getUserSubscriptionState(
  userId: number,
): Promise<UserSubscriptionState> {
  const [rows] = await pool.query(
    "SELECT subscription_status, subscription_provider, provider_customer_id, provider_subscription_id, subscription_expires_at, subscription_started_at, subscription_renews_at, subscription_cancel_at_period_end, subscription_cancelled_at FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const user = (rows as any[])[0];
  if (!user) {
    throw new Error(tServer("he-IL", "auth.userNotFound"));
  }

  return {
    subscription_status: user.subscription_status ?? null,
    subscription_provider: user.subscription_provider ?? null,
    provider_customer_id: user.provider_customer_id ?? null,
    provider_subscription_id: user.provider_subscription_id ?? null,
    subscription_expires_at: user.subscription_expires_at ?? null,
    subscription_started_at: user.subscription_started_at ?? null,
    subscription_renews_at: user.subscription_renews_at ?? null,
    subscription_cancel_at_period_end: Number(
      user.subscription_cancel_at_period_end ?? 0,
    ),
    subscription_cancelled_at: user.subscription_cancelled_at ?? null,
  };
}

export async function findUserByProviderSubscriptionId(
  providerSubscriptionId: string,
): Promise<{ id: number } | null> {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE provider_subscription_id = ? LIMIT 1",
    [providerSubscriptionId],
  );

  const row = (rows as any[])[0];
  if (!row) {
    return null;
  }

  return { id: Number(row.id) };
}

export async function updateUserSubscriptionFields(
  userId: number,
  fields: {
    subscription_type?: string | null;
    subscription_status?: string | null;
    subscription_provider?: string | null;
    provider_customer_id?: string | null;
    provider_subscription_id?: string | null;
    subscription_started_at?: Date | string | null;
    subscription_expires_at?: Date | string | null;
    subscription_renews_at?: Date | string | null;
    subscription_cancel_at_period_end?: number | boolean;
    subscription_cancelled_at?: Date | string | null;
  },
  dbOverride?: any,
) {
  const db = dbOverride || pool;
  const clauses: string[] = [];
  const values: unknown[] = [];

  const entries = Object.entries(fields) as Array<[string, unknown]>;
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    clauses.push(`${key} = ?`);
    values.push(value);
  }

  if (!clauses.length) {
    return;
  }

  clauses.push("updated_at = NOW()");

  await db.query(`UPDATE users SET ${clauses.join(", ")} WHERE id = ?`, [
    ...values,
    userId,
  ]);
}

export async function expireActiveTrials(): Promise<number> {
  const [result] = await pool.query(
    "UPDATE users SET subscription_status = 'expired', updated_at = NOW() WHERE subscription_status = 'trial'",
  );

  return Number((result as any)?.affectedRows ?? 0);
}

export async function markUserSubscriptionExpired(userId: number) {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error(tServer("he-IL", "subscriptions.invalidUserIdForExpiry"));
  }
  await pool.query(
    "UPDATE users SET subscription_status = 'expired', updated_at = NOW() WHERE id = ?",
    [userId],
  );
}

export type SubscriptionPlan = {
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
};

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const plans = await listEnabledPlans();
  return plans.map((plan) => ({
    tier: plan.name,
    monthlyPrice: Number(plan.monthly_price),
    yearlyPrice: Number(plan.yearly_price),
    currency: plan.currency,
  }));
}
