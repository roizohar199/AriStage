import { pool } from "../database/pool";
import {
  findUserByProviderSubscriptionId,
  getUserSubscriptionState,
  markUserSubscriptionExpired,
  updateUserSubscriptionFields,
} from "../modules/subscriptions/subscriptions.repository";
import { getSubscriptionWindow } from "../modules/subscriptions/subscriptionWindow";
import { getTrialDays } from "./trialUtils";

export type BillingPeriod = "monthly" | "yearly";

export type UserSubscriptionSnapshot = {
  subscription_status: string | null;
  subscription_expires_at: Date | null;
  subscription_renews_at?: Date | null;
  subscription_cancel_at_period_end?: number;
  provider_subscription_id?: string | null;
};

export async function ensureUserSubscriptionFresh(
  userId: number,
): Promise<UserSubscriptionSnapshot> {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for ensureUserSubscriptionFresh");
  }

  const {
    subscription_status,
    subscription_started_at,
    subscription_expires_at,
  } = await getUserSubscriptionState(userId);
  const window = getSubscriptionWindow({
    subscription_started_at,
    subscription_expires_at,
  });

  if (
    (subscription_status === "active" || subscription_status === "trial") &&
    window.shouldMarkExpired
  ) {
    await markUserSubscriptionExpired(userId);
  }

  // Re-fetch a fresh snapshot after potential update
  const fresh = await getUserSubscriptionState(userId);

  return {
    subscription_status: fresh.subscription_status,
    subscription_expires_at: fresh.subscription_expires_at,
    subscription_renews_at: fresh.subscription_renews_at,
    subscription_cancel_at_period_end: fresh.subscription_cancel_at_period_end,
    provider_subscription_id: fresh.provider_subscription_id,
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
  params: {
    userId: number;
    planKey: string;
    billingPeriod: BillingPeriod;
    provider?: string | null;
    providerCustomerId?: string | null;
    providerSubscriptionId?: string | null;
    startedAt?: Date | string | null;
    renewsAt?: Date | string | null;
  },
  dbOverride?: any,
): Promise<void> {
  const {
    userId,
    billingPeriod,
    planKey,
    provider,
    providerCustomerId,
    providerSubscriptionId,
    startedAt,
    renewsAt,
  } = params;
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
  const startedAtDate = startedAt ? new Date(startedAt) : new Date();
  const renewsAtDate = renewsAt
    ? new Date(renewsAt)
    : new Date(startedAtDate.getTime() + days * 24 * 60 * 60 * 1000);

  const db = dbOverride || pool;

  await updateUserSubscriptionFields(
    userId,
    {
      subscription_type: normalizedPlanKey,
      subscription_status: "active",
      subscription_provider: provider ?? null,
      provider_customer_id: providerCustomerId ?? null,
      provider_subscription_id: providerSubscriptionId ?? null,
      subscription_started_at: startedAtDate,
      subscription_expires_at: renewsAtDate,
      subscription_renews_at: renewsAtDate,
      subscription_cancel_at_period_end: 0,
      subscription_cancelled_at: null,
    },
    db,
  );

  const [rows] = await db.query(
    "SELECT id FROM users WHERE id = ? AND subscription_status = 'active' LIMIT 1",
    [userId],
  );
  if (!Array.isArray(rows) || !(rows as any[]).length) {
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
  const startedAt = new Date();
  const expiresAt = new Date(
    startedAt.getTime() + trialDays * 24 * 60 * 60 * 1000,
  );
  await updateUserSubscriptionFields(
    userId,
    {
      subscription_status: "trial",
      subscription_provider: null,
      provider_customer_id: null,
      provider_subscription_id: null,
      subscription_started_at: startedAt,
      subscription_expires_at: expiresAt,
      subscription_renews_at: expiresAt,
      subscription_cancel_at_period_end: 0,
      subscription_cancelled_at: null,
    },
    db,
  );

  const [rows] = await db.query(
    "SELECT id FROM users WHERE id = ? AND subscription_status = 'trial' LIMIT 1",
    [userId],
  );
  if (!Array.isArray(rows) || !(rows as any[]).length) {
    throw new Error("Failed to activate trial for user");
  }
}

export async function markSubscriptionCancelledAtPeriodEnd(params: {
  userId: number;
  cancelledAt?: Date | string | null;
  renewsAt?: Date | string | null;
  provider?: string | null;
  providerSubscriptionId?: string | null;
}) {
  await updateUserSubscriptionFields(params.userId, {
    subscription_provider: params.provider ?? undefined,
    provider_subscription_id: params.providerSubscriptionId ?? undefined,
    subscription_cancel_at_period_end: 1,
    subscription_cancelled_at: params.cancelledAt ?? new Date(),
    subscription_renews_at: params.renewsAt ?? undefined,
  });
}

export async function findUserIdByProviderSubscriptionId(
  providerSubscriptionId: string,
): Promise<number | null> {
  const user = await findUserByProviderSubscriptionId(providerSubscriptionId);
  return user?.id ?? null;
}
