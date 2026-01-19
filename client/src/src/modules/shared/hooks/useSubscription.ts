import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

export type SubscriptionPermissions = {
  canCreateSong: boolean;
  canCreateLineup: boolean;
  canExport: boolean;
};

// Plan keys are dynamic (come from DB `plans.key`); keep "trial" as the default.
export type SubscriptionPlan = string;

export type SubscriptionModel = {
  status: "active" | "trial" | "expired";
  plan: SubscriptionPlan;
  expiresAt: Date | null;
  permissions: SubscriptionPermissions;
};

function parseExpiresAt(raw: unknown): Date | null {
  if (!raw) return null;
  try {
    const s = String(raw).trim();
    if (!s) return null;
    const normalized = s.includes("T") ? s : s.replace(" ", "T");
    const d = new Date(normalized);
    const ms = d.getTime();
    if (Number.isNaN(ms)) return null;
    return d;
  } catch {
    return null;
  }
}

// Normalize any raw subscription_type value into a stable plan key.
// Keep legacy/empty values as "trial" for backward compatibility.
export function normalizeSubscriptionType(value: unknown): SubscriptionPlan {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw || "trial";
}

/**
 * Central subscription resolver on the client.
 *
 * Source of truth:
 * - status: comes from server-resolved `subscription_status` via AuthContext
 * - plan: plan key from `subscription_type`
 * - expiresAt: parsed from `subscription_expires_at` for display only
 * - permissions: mirrors current server behavior (requireActiveSubscription)
 */
export function useSubscription(): SubscriptionModel | null {
  const { user, subscriptionStatus } = useAuth();

  if (!user) return null;

  const baseStatus = (subscriptionStatus ?? null) as
    | "active"
    | "trial"
    | "expired"
    | null;

  // Admin is always effectively active in the current system
  const status: "active" | "trial" | "expired" =
    user.role === "admin" ? "active" : baseStatus ?? "expired";

  const plan = normalizeSubscriptionType(user.subscription_type);

  const expiresAt = parseExpiresAt(user.subscription_expires_at);

  const isActiveLike = status === "active" || status === "trial";
  const isAdmin = user.role === "admin";

  const permissions: SubscriptionPermissions = {
    // In the current system, all mutating song actions are gated by
    // requireActiveSubscription (active/trial or admin).
    canCreateSong: isAdmin || isActiveLike,
    // Same for lineups.
    canCreateLineup: isAdmin || isActiveLike,
    // Export operations (download charts, etc.) are also behind the
    // same middleware today.
    canExport: isAdmin || isActiveLike,
  };

  return {
    status,
    plan,
    expiresAt,
    permissions,
  };
}
