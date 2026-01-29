import { pool } from "../../database/pool.js";
import { AppError } from "../../core/errors.js";

export type SubscriptionSettings = {
  is_enabled: number;
  price_ils: number;
  trial_days: number;
};

export async function getSubscriptionSettings(): Promise<SubscriptionSettings> {
  const [rows] = await pool.query(
    "SELECT is_enabled, price_ils, trial_days FROM subscriptions_settings WHERE id = 1 LIMIT 1",
  );

  const settings = (rows as any[])[0];
  if (!settings) {
    throw new AppError(
      500,
      "Missing subscriptions_settings row (id=1)",
      undefined,
    );
  }

  return {
    is_enabled: Number(settings.is_enabled),
    price_ils: Number(settings.price_ils),
    trial_days: Number(settings.trial_days),
  };
}

export type UserSubscriptionState = {
  subscription_status: string | null;
  subscription_expires_at: Date | null;
  subscription_started_at: Date | null;
};

export async function getUserSubscriptionState(
  userId: number,
): Promise<UserSubscriptionState> {
  const [rows] = await pool.query(
    "SELECT subscription_status, subscription_expires_at, subscription_started_at FROM users WHERE id = ? LIMIT 1",
    [userId],
  );

  const user = (rows as any[])[0];
  if (!user) {
    throw new Error("User not found");
  }

  return {
    subscription_status: user.subscription_status ?? null,
    subscription_expires_at: user.subscription_expires_at ?? null,
    subscription_started_at: user.subscription_started_at ?? null,
  };
}

export async function markUserSubscriptionExpired(userId: number) {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for markUserSubscriptionExpired");
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
  // For now, return a single plan based on settings
  const settings = await getSubscriptionSettings();

  return [
    {
      tier: "Pro",
      monthlyPrice: settings.price_ils,
      yearlyPrice: settings.price_ils * 12,
      currency: "ILS",
    },
  ];
}
