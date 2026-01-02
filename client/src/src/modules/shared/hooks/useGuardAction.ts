import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { emitToast } from "@/modules/shared/lib/toastBus.ts";
import { useSubscription } from "@/modules/shared/hooks/useSubscription.ts";

/**
 * Guard helper to check if an action is allowed based on subscription status.
 *
 * @param action - The callback function to execute if action is allowed
 * @param options - Configuration options
 * @returns A function that checks subscription status before executing the action
 *
 * @example
 * const handleAddSong = guardAction(() => {
 *   // Add song logic
 * });
 */
export function useGuardAction() {
  const { subscriptionBlocked, subscriptionStatus, user } = useAuth();
  const subscription = useSubscription();

  return function guardAction<T extends (...args: any[]) => any>(
    action: T,
    options?: {
      message?: string;
      onBlocked?: () => void;
    }
  ): T {
    return ((...args: Parameters<T>) => {
      // Admin is never blocked
      if (user?.role === "admin") {
        return action(...args);
      }

      // If subscription is blocked or permissions do not allow the action,
      // prevent it. We keep existing behavior but route the status decision
      // through the centralized subscription model when available.
      const status = subscriptionStatus ?? user?.subscription_status ?? null;
      const isStatusAllowed = status === "active" || status === "trial";

      const hasSubscriptionPermission =
        subscription?.permissions.canCreateSong ?? isStatusAllowed;

      if (subscriptionBlocked || !hasSubscriptionPermission) {
        const message = options?.message || "פעולה זו זמינה רק עם מנוי פעיל";

        // Show toast notification
        emitToast(message, "warning");

        window.openUpgradeModal?.();

        if (options?.onBlocked) {
          options.onBlocked();
        }

        return;
      }

      // Subscription is active, execute action
      return action(...args);
    }) as T;
  };
}
