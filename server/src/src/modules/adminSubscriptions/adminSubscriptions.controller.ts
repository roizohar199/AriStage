import { asyncHandler } from "../../core/asyncHandler.js";
import { AppError } from "../../core/errors.js";
import {
  getAdminSubscriptionSettings,
  listUsersWithSubscriptionStatus,
  updateAdminSubscriptionSettings,
} from "./adminSubscriptions.repository.js";

export const adminSubscriptionsController = {
  getSettings: asyncHandler(async (_req: any, res: any) => {
    const settings = await getAdminSubscriptionSettings();
    if (!settings) {
      throw new AppError(
        500,
        "Missing subscriptions_settings row (id=1)",
        undefined
      );
    }
    res.json(settings);
  }),

  updateSettings: asyncHandler(async (req: any, res: any) => {
    const { price_ils, is_enabled } = req.body || {};

    const affected = await updateAdminSubscriptionSettings({
      price_ils,
      is_enabled,
    });
    if (!affected) {
      // still return current settings for simplicity
    }

    const settings = await getAdminSubscriptionSettings();
    if (!settings) {
      throw new AppError(
        500,
        "Missing subscriptions_settings row (id=1)",
        undefined
      );
    }

    res.json(settings);
  }),

  listUsers: asyncHandler(async (_req: any, res: any) => {
    const users = await listUsersWithSubscriptionStatus();
    res.json(users);
  }),
};
