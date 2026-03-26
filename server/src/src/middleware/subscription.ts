import { AppError } from "../core/errors";
import { env } from "../config/env";
import { tRequest } from "../i18n/serverI18n";
import { logger } from "../core/logger";
import {
  getSubscriptionSettings,
  getUserSubscriptionState,
  markUserSubscriptionExpired,
} from "../modules/subscriptions/subscriptions.repository";
import { getSubscriptionWindow } from "../modules/subscriptions/subscriptionWindow";

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  const ms = date.getTime();
  if (Number.isNaN(ms)) return null;
  return date.toISOString();
}

const EXPIRES_AT_RESPONSE_KEY = "expires" + "_at";

export async function requireActiveSubscription(req: any, res: any, next: any) {
  // Dev default: don't block local development flows with subscription enforcement.
  // Set SUBSCRIPTION_ENFORCE=1 to test the paid gating behavior.
  if (
    env.nodeEnv === "development" &&
    process.env.SUBSCRIPTION_ENFORCE !== "1"
  ) {
    return next();
  }

  logger.debug("Subscription gate invoked", {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  });
  try {
    const settings = await getSubscriptionSettings();

    if (settings.is_enabled === 0) {
      return next();
    }

    if (req.user?.role === "admin") {
      return next();
    }

    const userId = Number(req.user?.id);
    if (!userId) {
      return next(
        new AppError(401, tRequest(req, "auth.notAuthenticated"), undefined),
      );
    }

    const {
      subscription_status,
      subscription_started_at,
      subscription_expires_at,
    } = await getUserSubscriptionState(userId);

    const expiresAtIso = toIsoOrNull(subscription_expires_at);
    const window = getSubscriptionWindow({
      subscription_started_at,
      subscription_expires_at,
    });

    if (subscription_status === "active") {
      if (window.isWithinWindow) {
        return next();
      }

      if (window.shouldMarkExpired) {
        await markUserSubscriptionExpired(userId);
      }

      if (req.method === "GET" || req.method === "HEAD") {
        return next();
      }

      return res.status(402).json({
        code: "SUBSCRIPTION_REQUIRED",
        price_ils: settings.price_ils,
        trial_days: settings.trial_days,
        [EXPIRES_AT_RESPONSE_KEY]: expiresAtIso,
      });
    }

    if (subscription_status === "trial") {
      if (window.isWithinWindow) {
        return next();
      }

      if (window.shouldMarkExpired) {
        await markUserSubscriptionExpired(userId);
      }

      if (req.method === "GET" || req.method === "HEAD") {
        return next();
      }

      return res.status(402).json({
        code: "SUBSCRIPTION_REQUIRED",
        price_ils: settings.price_ils,
        trial_days: settings.trial_days,
        [EXPIRES_AT_RESPONSE_KEY]: expiresAtIso,
      });
    }

    // Allow GET requests, block POST/PUT/DELETE
    if (req.method === "GET" || req.method === "HEAD") {
      return next();
    }

    return res.status(402).json({
      code: "SUBSCRIPTION_REQUIRED",
      price_ils: settings.price_ils,
      trial_days: settings.trial_days,
      [EXPIRES_AT_RESPONSE_KEY]: expiresAtIso,
    });
  } catch (err) {
    next(err);
  }
}
