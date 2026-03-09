import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "@/modules/shared/lib/api.ts";
import {
  applyDocumentLocale,
  getBrowserLocaleFiltered,
} from "@/modules/shared/lib/locale";

export type I18nSettings = {
  default_locale: string;
  enabled_locales: string[];
  default_locale_mode: "browser" | "fixed";
};

type SystemSettingsContextValue = {
  loading: boolean;
  error: string | null;
  i18nSettings: I18nSettings;
  refresh: () => Promise<void>;
};

const SystemSettingsContext = createContext<SystemSettingsContextValue | null>(
  null,
);

const DEFAULT_I18N_SETTINGS: I18nSettings = {
  default_locale: "he-IL",
  enabled_locales: ["he-IL", "en-US"],
  default_locale_mode: "browser",
};

export function SystemSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [i18nSettings, setI18nSettings] = useState<I18nSettings>(
    DEFAULT_I18N_SETTINGS,
  );

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get cached settings first
      const cached = localStorage.getItem("ari_system_settings");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (
            parsed.default_locale &&
            Array.isArray(parsed.enabled_locales) &&
            (parsed.default_locale_mode === "browser" ||
              parsed.default_locale_mode === "fixed")
          ) {
            setI18nSettings(parsed as I18nSettings);
          }
        } catch {
          // Ignore cache parse errors
        }
      }

      // Fetch from API (public endpoint, no auth required)
      const { data } = await api.get("/system-settings/i18n", {
        skipErrorToast: true,
      } as any);

      const settings: I18nSettings = {
        default_locale: data.default_locale || "he-IL",
        enabled_locales: Array.isArray(data.enabled_locales)
          ? data.enabled_locales
          : ["he-IL", "en-US"],
        default_locale_mode:
          data.default_locale_mode === "fixed" ? "fixed" : "browser",
      };

      setI18nSettings(settings);

      // Cache for next load
      localStorage.setItem("ari_system_settings", JSON.stringify(settings));

      // If user locale is "auto" (or unset), apply the system default strategy.
      try {
        const rawUser = localStorage.getItem("ari_user");
        const user = rawUser ? (JSON.parse(rawUser) as any) : null;
        const rawPreferred = String(user?.preferred_locale ?? "").trim();
        const preferredLower = rawPreferred.toLowerCase();
        const hasExplicitPreferred =
          !!rawPreferred &&
          preferredLower !== "auto" &&
          preferredLower !== "null";

        if (!hasExplicitPreferred) {
          if (settings.default_locale_mode === "fixed") {
            applyDocumentLocale(settings.default_locale);
          } else {
            applyDocumentLocale(
              getBrowserLocaleFiltered(
                settings.enabled_locales,
                settings.default_locale,
              ),
            );
          }
        }
      } catch {
        // ignore
      }
    } catch (err: any) {
      // If API not available, use defaults
      setI18nSettings(DEFAULT_I18N_SETTINGS);
      const msg = err?.response?.data?.error || err?.message || null;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();

    // Listen for updates from admin
    const handleUpdate = () => {
      void fetchSettings();
    };

    window.addEventListener("system-settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("system-settings-updated", handleUpdate);
    };
  }, [fetchSettings]);

  const value: SystemSettingsContextValue = useMemo(() => {
    return {
      loading,
      error,
      i18nSettings,
      refresh: fetchSettings,
    };
  }, [loading, error, i18nSettings, fetchSettings]);

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings(): SystemSettingsContextValue {
  const ctx = useContext(SystemSettingsContext);
  if (!ctx) {
    throw new Error(
      "useSystemSettings must be used within SystemSettingsProvider",
    );
  }
  return ctx;
}
