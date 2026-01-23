import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/modules/shared/lib/api.js";

export type CurrentUser = {
  id?: number;
  email?: string;
  full_name?: string;
  role?: string;
  avatar?: string | null;
  theme?: number | string | null;
  subscription_type?: string;
  subscription_status?: string;
  subscription_expires_at?: string | null;
};

export type ResolvedSubscriptionStatus = "active" | "trial" | "expired";

export type SubscriptionBlockedPayload = {
  code: "SUBSCRIPTION_REQUIRED";
  price_ils?: number;
  trial_days?: number;
  expires_at?: string | null;
};

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  subscriptionStatus: ResolvedSubscriptionStatus | null;
  subscriptionBlocked: boolean;
  subscriptionBlockedPayload: SubscriptionBlockedPayload | null;
  setUser: (user: CurrentUser | null) => void;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("ari_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  try {
    let token = localStorage.getItem("ari_token");
    if (token) return token;

    const raw = localStorage.getItem("ari_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ? String(parsed.token) : null;
  } catch {
    return null;
  }
}

function normalizeResolvedStatus(
  value: unknown,
): ResolvedSubscriptionStatus | null {
  if (!value) return null;
  const s = String(value).toLowerCase();
  if (s === "active" || s === "trial" || s === "expired") return s;
  return null;
}

// Global logout event bus
export const authLogoutEvent = new EventTarget();

// Global subscription-block event bus (dispatched from api interceptor)
export const subscriptionBlockedEvent = new EventTarget();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<ResolvedSubscriptionStatus | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<boolean>(
    () => {
      try {
        return localStorage.getItem("ari_subscription_blocked") === "1";
      } catch {
        return false;
      }
    },
  );
  const [subscriptionBlockedPayload, setSubscriptionBlockedPayload] =
    useState<SubscriptionBlockedPayload | null>(() => {
      try {
        const raw = localStorage.getItem("ari_subscription_blocked_payload");
        return raw ? (JSON.parse(raw) as SubscriptionBlockedPayload) : null;
      } catch {
        return null;
      }
    });

  const setBlocked = (
    blocked: boolean,
    payload: SubscriptionBlockedPayload | null,
  ) => {
    setSubscriptionBlocked(blocked);
    setSubscriptionBlockedPayload(payload);
    try {
      if (blocked) {
        localStorage.setItem("ari_subscription_blocked", "1");
        localStorage.setItem(
          "ari_subscription_blocked_payload",
          JSON.stringify(payload || null),
        );
      } else {
        localStorage.removeItem("ari_subscription_blocked");
        localStorage.removeItem("ari_subscription_blocked_payload");
      }
    } catch {}
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/me", {
        skipErrorToast: true,
      } as any);
      setUser(data || null);

      // subscriptionStatus must come from server response only.
      const nextStatus = normalizeResolvedStatus(data?.subscription_status);
      setSubscriptionStatus(nextStatus);

      const shouldBlock =
        data?.role !== "admin" &&
        nextStatus !== "active" &&
        nextStatus !== "trial";

      // Keep existing behavior for active/trial, but persist expired on refresh.
      const nextPayload = shouldBlock
        ? ({
            code: "SUBSCRIPTION_REQUIRED",
            ...(subscriptionBlockedPayload ?? {}),
            expires_at:
              subscriptionBlockedPayload?.expires_at ??
              data?.subscription_expires_at ??
              null,
          } as SubscriptionBlockedPayload)
        : null;
      setBlocked(shouldBlock, nextPayload);

      // Sync with localStorage
      try {
        localStorage.setItem("ari_user", JSON.stringify(data || {}));
      } catch {}
    } catch (err: any) {
      const isSubscriptionBlocked =
        err?.response?.status === 402 &&
        err?.response?.data?.code === "SUBSCRIPTION_REQUIRED";

      if (isSubscriptionBlocked) {
        setBlocked(true, err.response.data as SubscriptionBlockedPayload);
        // 402 ≠ logout: Load user from localStorage to keep them logged in
        const storedUser = readStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
        return;
      }

      // If API fails for other reasons, fallback to stored user
      const storedUser = readStoredUser();
      setUser(storedUser);

      // Last resort when offline: use previously stored server status if exists.
      // This does NOT set a default; it only reuses a persisted value.
      if (subscriptionStatus === null) {
        setSubscriptionStatus(
          normalizeResolvedStatus(storedUser?.subscription_status),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    // Save token first
    localStorage.setItem("ari_token", token);
    setBlocked(false, null);
    // Then fetch and set user data
    await refreshUser();
  };

  const logout = () => {
    // Clear state first
    setUser(null);
    setBlocked(false, null);
    // Then clear storage
    localStorage.removeItem("ari_user");
    localStorage.removeItem("ari_token");
  };

  // Listen for global logout events (e.g., from api interceptor)
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    authLogoutEvent.addEventListener("logout", handleLogout as EventListener);

    return () => {
      authLogoutEvent.removeEventListener(
        "logout",
        handleLogout as EventListener,
      );
    };
  }, []);

  // Listen for subscription-block events
  useEffect(() => {
    const handleBlocked = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | SubscriptionBlockedPayload
        | undefined;
      setBlocked(true, detail || null);
    };

    subscriptionBlockedEvent.addEventListener(
      "blocked",
      handleBlocked as EventListener,
    );

    return () => {
      subscriptionBlockedEvent.removeEventListener(
        "blocked",
        handleBlocked as EventListener,
      );
    };
  }, []);

  // Initial user fetch on mount
  useEffect(() => {
    let mounted = true;

    const token = readStoredToken();
    if (!token) {
      // Not authenticated – don't block boot on subscription status.
      setSubscriptionStatus(null);
      return;
    }

    setLoading(true);
    api
      .get("/users/me", { skipErrorToast: true } as any)
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data || null);
        const nextStatus = normalizeResolvedStatus(data?.subscription_status);
        setSubscriptionStatus(nextStatus);
        const shouldBlock =
          data?.role !== "admin" &&
          nextStatus !== "active" &&
          nextStatus !== "trial";
        const nextPayload = shouldBlock
          ? ({
              code: "SUBSCRIPTION_REQUIRED",
              ...(subscriptionBlockedPayload ?? {}),
              expires_at:
                subscriptionBlockedPayload?.expires_at ??
                data?.subscription_expires_at ??
                null,
            } as SubscriptionBlockedPayload)
          : null;
        setBlocked(shouldBlock, nextPayload);
        try {
          localStorage.setItem("ari_user", JSON.stringify(data || {}));
        } catch {}
      })
      .catch((err: any) => {
        if (!mounted) return;
        const isSubscriptionBlocked =
          err?.response?.status === 402 &&
          err?.response?.data?.code === "SUBSCRIPTION_REQUIRED";

        if (isSubscriptionBlocked) {
          setBlocked(true, err.response.data as SubscriptionBlockedPayload);
          setUser(readStoredUser());
          return;
        }

        const storedUser = readStoredUser();
        setUser(storedUser);
        setSubscriptionStatus(
          normalizeResolvedStatus(storedUser?.subscription_status),
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        subscriptionStatus,
        subscriptionBlocked,
        subscriptionBlockedPayload,
        setUser,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
