import { AppError } from "../core/errors";
import { env } from "../config/env";
import {
  getSubscriptionSettings,
  getUserSubscriptionState,
  markUserSubscriptionExpired,
} from "../modules/subscriptions/subscriptions.repository";

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

  console.log(
    "[TEMP][SUBSCRIPTION] requireActiveSubscription",
    req.method,
    req.path,
    req.body,
    "user:",
    req.user,
  );
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
      return next(new AppError(401, "Unauthorized", undefined));
    }

    const { subscription_status, subscription_expires_at } =
      await getUserSubscriptionState(userId);

    const expiresAtIso = toIsoOrNull(subscription_expires_at);
    const expiresMs = subscription_expires_at
      ? new Date(subscription_expires_at as any).getTime()
      : NaN;
    const nowMs = Date.now();

    const isExpiryValidAndInFuture =
      !Number.isNaN(expiresMs) && nowMs <= expiresMs;

    // Active subscription requires a future expiration date
    if (subscription_status === "active") {
      if (isExpiryValidAndInFuture) {
        return next();
      }

      await markUserSubscriptionExpired(userId);

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
    }

    // Trial behaves the same: allowed while expiry is in the future
    if (subscription_status === "trial") {
      if (isExpiryValidAndInFuture) {
        return next();
      }

      await markUserSubscriptionExpired(userId);

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
