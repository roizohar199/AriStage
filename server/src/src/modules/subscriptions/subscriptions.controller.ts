import { asyncHandler } from "../../core/asyncHandler";
import {
  getSubscriptionSettings,
  getSubscriptionPlans,
} from "./subscriptions.repository";
import { ensureUserSubscriptionFresh } from "../../services/subscriptionService";
import { resolveSubscriptionStatus } from "./resolveSubscriptionStatus";
import { pool } from "../../database/pool";

export const subscriptionsController = {
  getPublic: asyncHandler(async (req, res) => {
    const settings = await getSubscriptionSettings();
    res.json({
      is_enabled: settings.is_enabled,
      price_ils: settings.price_ils,
      trial_days: settings.trial_days,
    });
  }),

  getSettings: asyncHandler(async (_req, res) => {
    const settings = await getSubscriptionSettings();
    res.json({
      is_enabled: settings.is_enabled,
      price_ils: settings.price_ils,
      trial_days: settings.trial_days,
    });
  }),

  getPlans: asyncHandler(async (req, res) => {
    const plans = await getSubscriptionPlans();
    res.json(plans);
  }),

  me: asyncHandler(async (req: any, res) => {
    const userId = Number(req.user?.id);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Ensure DB state is fresh (may mark expired if past expiry)
    await ensureUserSubscriptionFresh(userId);

    const [rows] = await pool.query(
      "SELECT role, subscription_type, subscription_status, subscription_expires_at, subscription_started_at FROM users WHERE id = ? LIMIT 1",
      [userId],
    );

    const user = (rows as any[])[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
      subscription_expires_at: user.subscription_expires_at ?? null,
      subscription_started_at: user.subscription_started_at ?? null,
      trial_days,
      isActive: resolvedStatus === "active",
      isExpired: resolvedStatus === "expired",
    });
  }),

  updateSettings: asyncHandler(async (req, res) => {
    const { price_ils, is_enabled, trial_days } = req.body || {};
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
    if (!clauses.length) {
      return res.status(400).json({ error: "No fields to update" });
    }
    values.push(1); // id=1
    await import("../../database/pool").then(async ({ pool }) => {
      await pool.query(
        `UPDATE subscriptions_settings SET ${clauses.join(", ")} WHERE id = ?`,
        values,
      );
    });
    const updated = await getSubscriptionSettings();
    res.json(updated);
  }),
};
