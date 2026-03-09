import { useCallback, useEffect, useState } from "react";
import { Globe, Languages, Settings } from "lucide-react";
import api from "@/modules/shared/lib/api.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { useToast } from "@/modules/shared/components/ToastProvider";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";
import { Select } from "@/modules/shared/components/FormControls";
import { useTranslation } from "@/hooks/useTranslation.ts";

type I18nSettings = {
  default_locale: string;
  enabled_locales: string[];
  default_locale_mode: "browser" | "fixed";
};

const AVAILABLE_LOCALES = [
  {
    value: "he-IL",
    labelKey: "systemSettings.languageHebrew",
    directionKey: "systemSettings.rtl",
  },
  {
    value: "en-US",
    labelKey: "systemSettings.languageEnglish",
    directionKey: "systemSettings.ltr",
  },
];

type Props = {
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  setDashboardCards?: (cards: DashboardCard[]) => void;
  [key: string]: unknown;
};

export default function AdminSystemSettingsTab({
  CardContainer,
  setDashboardCards,
}: Props) {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [settings, setSettings] = useState<I18nSettings>({
    default_locale: "he-IL",
    enabled_locales: ["he-IL", "en-US"],
    default_locale_mode: "browser",
  });
  const [originalSettings, setOriginalSettings] = useState<I18nSettings>({
    default_locale: "he-IL",
    enabled_locales: ["he-IL", "en-US"],
    default_locale_mode: "browser",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/system-settings/i18n");
      const loadedSettings: I18nSettings = {
        default_locale:
          typeof data.default_locale === "string" && data.default_locale
            ? data.default_locale
            : "he-IL",
        enabled_locales: Array.isArray(data.enabled_locales)
          ? (data.enabled_locales as string[])
          : ["he-IL", "en-US"],
        default_locale_mode:
          data.default_locale_mode === "fixed" ? "fixed" : "browser",
      };
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
    } catch (err: any) {
      console.error("Failed to load system settings:", err);
      showToast(t("systemSettings.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const hasChanges =
    settings.default_locale !== originalSettings.default_locale ||
    settings.default_locale_mode !== originalSettings.default_locale_mode ||
    JSON.stringify(settings.enabled_locales.sort()) !==
      JSON.stringify(originalSettings.enabled_locales.sort());

  const save = async () => {
    // Validation: default locale must be enabled
    if (!settings.enabled_locales.includes(settings.default_locale)) {
      showToast(t("systemSettings.defaultMustBeEnabled"), "error");
      return;
    }

    // Validation: at least one locale must be enabled
    if (settings.enabled_locales.length === 0) {
      showToast(t("systemSettings.atLeastOneLocale"), "error");
      return;
    }

    setSaving(true);
    try {
      await api.put("/admin/system-settings/i18n", {
        default_locale: settings.default_locale,
        enabled_locales: settings.enabled_locales,
        default_locale_mode: settings.default_locale_mode,
      });

      setOriginalSettings(settings);
      showToast(t("systemSettings.settingsSaved"), "success");

      // Dispatch event so other components can react
      window.dispatchEvent(new CustomEvent("system-settings-updated"));
    } catch (err: any) {
      console.error("Failed to save system settings:", err);
      const errorMsg =
        err.response?.data?.error || t("systemSettings.saveFailed");
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleLocale = (locale: string) => {
    if (settings.enabled_locales.includes(locale)) {
      // If trying to disable default locale, show error
      if (settings.default_locale === locale) {
        showToast(t("systemSettings.cannotDisableDefault"), "error");
        return;
      }
      // Disable locale
      setSettings({
        ...settings,
        enabled_locales: settings.enabled_locales.filter((l) => l !== locale),
      });
    } else {
      // Enable locale
      setSettings({
        ...settings,
        enabled_locales: [...settings.enabled_locales, locale],
      });
    }
  };

  const reset = () => {
    setSettings(originalSettings);
  };

  // Dashboard cards
  useEffect(() => {
    const localeLabel =
      settings.default_locale === "he-IL"
        ? t("systemSettings.languageHebrew")
        : settings.default_locale === "en-US"
          ? t("systemSettings.languageEnglish")
          : settings.default_locale;

    const defaultLabel =
      settings.default_locale_mode === "fixed"
        ? localeLabel
        : t("systemSettings.defaultModeBrowser");

    setDashboardCards?.([
      {
        icon: <Settings size={32} />,
        value: defaultLabel,
        label: t("systemSettings.defaultLocale"),
      },
      {
        icon: <Languages size={32} />,
        value: settings.enabled_locales.length,
        label: t("systemSettings.enabledLocales"),
      },
      {
        icon: <Globe size={32} />,
        value: t("systemSettings.enabled"),
        label: t("systemSettings.browserDetection"),
      },
    ]);
  }, [
    setDashboardCards,
    settings.default_locale,
    settings.default_locale_mode,
    settings.enabled_locales.length,
    t,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-neutral-400">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="text-neutral-100 font-bold">
              {t("systemSettings.i18n")}
            </div>
            <div className="text-xs text-neutral-400">
              {t("systemSettings.i18nDescription")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <DesignActionButton
                type="button"
                onClick={reset}
                disabled={saving}
                variant="cancel"
              >
                {t("systemSettings.cancelChanges")}
              </DesignActionButton>
            )}
            <DesignActionButton
              type="button"
              onClick={save}
              disabled={!hasChanges || saving}
            >
              {saving ? t("common.saving") : t("systemSettings.saveSettings")}
            </DesignActionButton>
          </div>
        </div>
      </div>

      {/* Language Configuration */}
      <CardContainer>
        <div className="space-y-6">
          {/* Default Mode Selector */}
          <div>
            <Select
              label={t("systemSettings.defaultMode")}
              value={settings.default_locale_mode}
              disabled={saving}
              options={[
                {
                  value: "browser",
                  label: t("systemSettings.defaultModeBrowser"),
                },
                {
                  value: "fixed",
                  label: t("systemSettings.defaultModeFixed"),
                },
              ]}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  default_locale_mode: value === "fixed" ? "fixed" : "browser",
                })
              }
            />
            <div className="text-xs text-neutral-400 mt-1">
              {t("systemSettings.defaultModeHelp")}
            </div>
          </div>

          {/* Default Locale Selector */}
          <div>
            <Select
              label={
                settings.default_locale_mode === "fixed"
                  ? t("systemSettings.defaultLocale")
                  : t("systemSettings.fallbackLocale")
              }
              value={settings.default_locale}
              disabled={saving}
              options={AVAILABLE_LOCALES.filter((loc) =>
                settings.enabled_locales.includes(loc.value),
              ).map((loc) => ({
                value: loc.value,
                label: t(loc.labelKey),
              }))}
              onChange={(value) =>
                setSettings({ ...settings, default_locale: value })
              }
            />
            <div className="text-xs text-neutral-400 mt-1">
              {settings.default_locale_mode === "fixed"
                ? t("systemSettings.defaultLocaleHelpFixed")
                : t("systemSettings.fallbackLocaleHelp")}
            </div>
          </div>

          {/* Enabled Locales */}
          <div>
            <div className="text-sm font-semibold text-neutral-200 mb-3">
              {t("systemSettings.enabledLocales")}
            </div>
            <div className="space-y-3">
              {AVAILABLE_LOCALES.map((locale) => {
                const isEnabled = settings.enabled_locales.includes(
                  locale.value,
                );
                const isDefault = settings.default_locale === locale.value;

                return (
                  <div
                    key={locale.value}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      isEnabled
                        ? "bg-neutral-800 border-neutral-700"
                        : "bg-neutral-900 border-neutral-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Globe
                        size={24}
                        className={
                          isEnabled ? "text-brand-primary" : "text-neutral-600"
                        }
                      />
                      <div>
                        <div className="font-semibold text-neutral-100">
                          {t(locale.labelKey)}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {t(locale.directionKey)} • {locale.value}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDefault && (
                        <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded">
                          {t("systemSettings.defaultLocaleLabel")}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleLocale(locale.value)}
                        disabled={saving}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                          isEnabled
                            ? "bg-brand-primary text-white hover:bg-brand-primary/90"
                            : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                        }`}
                      >
                        {isEnabled
                          ? t("systemSettings.enabled")
                          : t("systemSettings.disabled")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser Detection Info */}
          <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
            <div className="flex items-start gap-3">
              <Globe size={20} className="text-brand-primary mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-neutral-200 mb-1">
                  {t("systemSettings.browserDetection")}
                </div>
                <div className="text-xs text-neutral-400">
                  {t("systemSettings.browserDetectionInfo")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContainer>
    </div>
  );
}
