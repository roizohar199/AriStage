import { pool } from "../database/pool";
import {
  getUserSubscriptionState,
  markUserSubscriptionExpired,
} from "../modules/subscriptions/subscriptions.repository";
import { getTrialDays } from "./trialUtils";

export type BillingPeriod = "monthly" | "yearly";

export type UserSubscriptionSnapshot = {
  subscription_status: string | null;
  subscription_expires_at: Date | null;
};

export async function ensureUserSubscriptionFresh(
  userId: number,
): Promise<UserSubscriptionSnapshot> {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for ensureUserSubscriptionFresh");
  }

  const { subscription_status, subscription_expires_at } =
    await getUserSubscriptionState(userId);

  const expiresMs = subscription_expires_at
    ? new Date(subscription_expires_at as any).getTime()
    : NaN;
  const nowMs = Date.now();
  const isExpiryValidAndInFuture =
    !Number.isNaN(expiresMs) && nowMs <= expiresMs;

  // If user is marked active/trial but expiry passed, mark as expired in DB
  if (
    (subscription_status === "active" || subscription_status === "trial") &&
    !isExpiryValidAndInFuture
  ) {
    await markUserSubscriptionExpired(userId);
  }

  // Re-fetch a fresh snapshot after potential update
  const fresh = await getUserSubscriptionState(userId);

  return {
    subscription_status: fresh.subscription_status,
    subscription_expires_at: fresh.subscription_expires_at,
  };
}

export async function activateProForUser(
  params: { userId: number; billingPeriod: BillingPeriod },
  dbOverride?: any,
): Promise<void> {
  // Backward compatible wrapper
  return activatePlanForUser(
    {
      userId: params.userId,
      planKey: "pro",
      billingPeriod: params.billingPeriod,
    },
    dbOverride,
  );
}

export async function activatePlanForUser(
  params: { userId: number; planKey: string; billingPeriod: BillingPeriod },
  dbOverride?: any,
): Promise<void> {
  const { userId, billingPeriod, planKey } = params;
  const normalizedPlanKey = String(planKey ?? "").trim();

  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for activatePlanForUser");
  }

  if (billingPeriod !== "monthly" && billingPeriod !== "yearly") {
    throw new Error("Invalid billingPeriod for activatePlanForUser");
  }

  if (!normalizedPlanKey) {
    throw new Error("Invalid planKey for activatePlanForUser");
  }

  const days = billingPeriod === "monthly" ? 30 : 365;

  const db = dbOverride || pool;

  const [result] = await db.query(
    "UPDATE users SET subscription_type = ?, subscription_status = 'active', subscription_started_at = NOW(), subscription_expires_at = DATE_ADD(NOW(), INTERVAL ? DAY), updated_at = NOW() WHERE id = ?",
    [normalizedPlanKey, days, userId],
  );

  if (!result || !result.affectedRows) {
    throw new Error("Failed to activate subscription for user");
  }
}

// Activate a trial for a user using dynamic trial_days from settings
export async function activateTrialForUser(
  userId: number,
  dbOverride?: any,
): Promise<void> {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for activateTrialForUser");
  }
  const trialDays = await getTrialDays();
  const db = dbOverride || pool;
  const [result] = await db.query(
    "UPDATE users SET subscription_status = 'trial', subscription_started_at = NOW(), subscription_expires_at = DATE_ADD(NOW(), INTERVAL ? DAY), updated_at = NOW() WHERE id = ?",
    [trialDays, userId],
  );
  if (!result || !result.affectedRows) {
    throw new Error("Failed to activate trial for user");
  }
}
