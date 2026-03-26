import { getSubscriptionWindow } from "./subscriptionWindow";

export type ResolvedSubscriptionStatus = "active" | "trial" | "expired";

/**
 * Resolve a stable subscription status for the client.
 *
 * Rules:
 * - "active" only when subscription_status is active AND expiry is in the future
 * - "trial" only when subscription_status is trial AND trial_end_date (or subscription_expires_at) is in the future
 * - otherwise "expired"
 */
export function resolveSubscriptionStatus(
  user: any,
): ResolvedSubscriptionStatus {
  if (!user) return "expired";

  // Admin is never blocked by subscription enforcement.
  if (user.role === "admin") return "active";

  const rawStatus = user.subscription_status
    ? String(user.subscription_status)
    : "";
  const status = rawStatus.toLowerCase();
  const window = getSubscriptionWindow({
    subscription_started_at: user.subscription_started_at,
    subscription_expires_at:
      user.trial_end_date ?? user.subscription_expires_at,
  });

  if (status === "active") {
    return window.isWithinWindow ? "active" : "expired";
  }

  if (status === "trial") {
    return window.isWithinWindow ? "trial" : "expired";
  }

  return "expired";
}
