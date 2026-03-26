import { asyncHandler } from "../../core/asyncHandler";
import {
  expireActiveTrials,
  getSubscriptionSettings,
  getSubscriptionPlans,
} from "./subscriptions.repository";
import { ensureUserSubscriptionFresh } from "../../services/subscriptionService";
import { resolveSubscriptionStatus } from "./resolveSubscriptionStatus";
import { pool } from "../../database/pool";
import { tRequest } from "../../i18n/serverI18n";

export const subscriptionsController = {
  getPublic: asyncHandler(async (req, res) => {
    const settings = await getSubscriptionSettings();
    res.json({
      is_enabled: settings.is_enabled,
      price_ils: settings.price_ils,
      trial_days: settings.trial_days,
      trial_enabled: settings.trial_enabled,
    });
  }),

  getSettings: asyncHandler(async (_req, res) => {
    const settings = await getSubscriptionSettings();
    res.json({
      is_enabled: settings.is_enabled,
      price_ils: settings.price_ils,
      trial_days: settings.trial_days,
      trial_enabled: settings.trial_enabled,
    });
  }),

  getPlans: asyncHandler(async (req, res) => {
    const plans = await getSubscriptionPlans();
    res.json(plans);
  }),

  me: asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.id);

    if (!userId) {
      return res
        .status(401)
        .json({ error: tRequest(req, "auth.notAuthenticated") });
    }

    // Ensure DB state is fresh (may mark expired if past expiry)
    await ensureUserSubscriptionFresh(userId);

    const [rows] = await pool.query(
      "SELECT role, subscription_type, subscription_status, subscription_provider, provider_subscription_id, subscription_expires_at, subscription_started_at, subscription_renews_at, subscription_cancel_at_period_end, subscription_cancelled_at FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    const user = (rows as any[])[0];
    if (!user) {
      return res
        .status(404)
        .json({ error: tRequest(req, "auth.userNotFound") });
    }

    let resolvedStatus = user.subscription_status;
    // Admin is authoritative — do not auto-resolve if set by admin
    if (user.role !== "admin") {
      resolvedStatus = resolveSubscriptionStatus(user);
    }

    // Fetch trial_days from settings if user is in trial
    let trial_days: number | undefined = undefined;
    if (resolvedStatus === "trial") {
      const settings = await getSubscriptionSettings();
      trial_days = settings.trial_days;
    }

    res.json({
      subscription_type: user.subscription_type ?? null,
      subscription_status: resolvedStatus,
      subscription_provider: user.subscription_provider ?? null,
      provider_subscription_id: user.provider_subscription_id ?? null,
      subscription_expires_at: user.subscription_expires_at ?? null,
      subscription_started_at: user.subscription_started_at ?? null,
      subscription_renews_at: user.subscription_renews_at ?? null,
      subscription_cancel_at_period_end:
        Number(user.subscription_cancel_at_period_end ?? 0) === 1,
      subscription_cancelled_at: user.subscription_cancelled_at ?? null,
      trial_days,
      isActive: resolvedStatus === "active",
      isExpired: resolvedStatus === "expired",
    });
  }),

  updateSettings: asyncHandler(async (req, res) => {
    const previousSettings = await getSubscriptionSettings();
    const { price_ils, is_enabled, trial_days, trial_enabled } = req.body || {};
    // Minimal update query
    const clauses: string[] = [];
    const values: any[] = [];
    if (price_ils !== undefined) {
      clauses.push("price_ils = ?");
      values.push(Number(price_ils));
    }
    if (is_enabled !== undefined) {
      clauses.push("is_enabled = ?");
      values.push(Number(is_enabled));
    }
    if (trial_days !== undefined) {
      clauses.push("trial_days = ?");
      values.push(Number(trial_days));
    }
    if (trial_enabled !== undefined) {
      clauses.push("trial_enabled = ?");
      values.push(Number(trial_enabled));
    }
    if (!clauses.length) {
      return res
        .status(400)
        .json({ error: tRequest(req, "subscriptions.noFieldsToUpdate") });
    }
    values.push(1); // id=1
    await import("../../database/pool").then(async ({ pool }) => {
      await pool.query(
        `UPDATE subscriptions_settings SET ${clauses.join(", ")} WHERE id = ?`,
        values,
      );
    });

    if (
      trial_enabled !== undefined &&
      Number(previousSettings.trial_enabled) === 1 &&
      Number(trial_enabled) === 0
    ) {
      await expireActiveTrials();
    }

    const updated = await getSubscriptionSettings();
    res.json(updated);
  }),
};
