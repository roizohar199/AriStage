import React, {
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
  subscription_type?: string;
};

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
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

// Global logout event bus
export const authLogoutEvent = new EventTarget();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState<boolean>(false);

  const refreshUser = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/me", { skipErrorToast: true });
      setUser(data || null);
      // Sync with localStorage
      try {
        localStorage.setItem("ari_user", JSON.stringify(data || {}));
      } catch {}
    } catch {
      // If API fails, fallback to stored user
      setUser(readStoredUser());
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    // Save token first
    localStorage.setItem("ari_token", token);
    // Then fetch and set user data
    await refreshUser();
  };

  const logout = () => {
    // Clear state first
    setUser(null);
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
        handleLogout as EventListener
      );
    };
  }, []);

  // Initial user fetch on mount
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/users/me", { skipErrorToast: true })
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data || null);
        try {
          localStorage.setItem("ari_user", JSON.stringify(data || {}));
        } catch {}
      })
      .catch(() => {
        if (!mounted) return;
        setUser(readStoredUser());
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
      value={{ user, loading, setUser, login, logout, refreshUser }}
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
