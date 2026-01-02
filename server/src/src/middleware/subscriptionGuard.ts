import { requireActiveSubscription } from "./subscription.js";

// Thin wrapper around the existing subscription middleware.
// NOTE: We intentionally keep the existing behavior (HTTP 402 +
// code "SUBSCRIPTION_REQUIRED") to avoid breaking the current
// client logic. This guard can be extended in the future if we
// decide to introduce a distinct SUBSCRIPTION_EXPIRED flow.
export function subscriptionGuard(req: any, res: any, next: any) {
  return requireActiveSubscription(req, res, next);
}
