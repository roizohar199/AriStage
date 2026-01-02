import { asyncHandler } from "../../core/asyncHandler.js";
import {
  getSubscriptionSettings,
  getSubscriptionPlans,
} from "./subscriptions.repository.js";

export const subscriptionsController = {
  getPublic: asyncHandler(async (req, res) => {
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

  updateSettings: asyncHandler(async (req, res) => {
    const { price_ils, is_enabled } = req.body || {};
    // Minimal update query
    const clauses = [];
    const values = [];
    if (price_ils !== undefined) {
      clauses.push("price_ils = ?");
      values.push(Number(price_ils));
    }
    if (is_enabled !== undefined) {
      clauses.push("is_enabled = ?");
      values.push(Number(is_enabled));
    }
    if (!clauses.length) {
      return res.status(400).json({ error: "No fields to update" });
    }
    values.push(1); // id=1
    await import("../../database/pool.js").then(async ({ pool }) => {
      await pool.query(
        `UPDATE subscriptions_settings SET ${clauses.join(", ")} WHERE id = ?`,
        values
      );
    });
    const updated = await getSubscriptionSettings();
    res.json(updated);
  }),
};
