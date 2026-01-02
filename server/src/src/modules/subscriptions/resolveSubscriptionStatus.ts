export type ResolvedSubscriptionStatus = "active" | "trial" | "expired";

function toMs(value: unknown): number {
  if (!value) return NaN;
  if (value instanceof Date) return value.getTime();
  const raw = String(value).trim();
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  return Number.isNaN(ms) ? NaN : ms;
}

/**
 * Resolve a stable subscription status for the client.
 *
 * Rules:
 * - "active" only when subscription_status is active AND expiry is in the future
 * - "trial" only when subscription_status is trial AND trial_end_date (or subscription_expires_at) is in the future
 * - otherwise "expired"
 */
export function resolveSubscriptionStatus(
  user: any
): ResolvedSubscriptionStatus {
  if (!user) return "expired";

  // Admin is never blocked by subscription enforcement.
  if (user.role === "admin") return "active";

  const rawStatus = user.subscription_status
    ? String(user.subscription_status)
    : "";
  const status = rawStatus.toLowerCase();

  // Support future schema naming without breaking current DB.
  const expiresAt = (user.trial_end_date ??
    user.subscription_expires_at) as any;
  const expiresMs = toMs(expiresAt);
  const isExpiryValidAndInFuture =
    !Number.isNaN(expiresMs) && Date.now() <= expiresMs;

  if (status === "active") {
    return isExpiryValidAndInFuture ? "active" : "expired";
  }

  if (status === "trial") {
    return isExpiryValidAndInFuture ? "trial" : "expired";
  }

  return "expired";
}
