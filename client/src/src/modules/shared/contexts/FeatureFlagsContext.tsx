import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "@/modules/shared/lib/api.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

export type ClientFeatureFlagRow = {
  key: string;
  enabled?: boolean | number | null;
  description?: string | null;
};

type FeatureFlagsContextValue = {
  loading: boolean;
  error: string | null;
  flags: Record<string, boolean>;
  isEnabled: (key: string, defaultValue?: boolean) => boolean;
  refresh: () => Promise<void>;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  return Boolean(v);
}

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await api.get("/feature-flags/client", {
        skipErrorToast: true,
      } as any);

      const rows = Array.isArray(data) ? (data as ClientFeatureFlagRow[]) : [];
      const map: Record<string, boolean> = {};
      for (const row of rows) {
        const key = String(row?.key || "").trim();
        if (!key) continue;
        map[key] = toBool(row.enabled);
      }
      setFlags(map);
    } catch (err: any) {
      // If not available yet, treat as "all enabled" by default.
      setFlags({});
      const msg = err?.response?.data?.message || err?.message || null;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth bootstrap. If user isn't authenticated, keep defaults.
    if (authLoading) return;
    if (!user?.id) {
      setFlags({});
      setError(null);
      return;
    }
    void fetchFlags();
  }, [authLoading, user?.id, fetchFlags]);

  const value: FeatureFlagsContextValue = useMemo(() => {
    return {
      loading,
      error,
      flags,
      isEnabled: (key: string, defaultValue = true) => {
        const k = String(key || "").trim();
        if (!k) return defaultValue;
        if (Object.prototype.hasOwnProperty.call(flags, k)) return !!flags[k];
        return defaultValue;
      },
      refresh: fetchFlags,
    };
  }, [loading, error, flags, fetchFlags]);

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  }
  return ctx;
}

