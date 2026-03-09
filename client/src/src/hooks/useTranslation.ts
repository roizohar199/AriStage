// useTranslation Hook
import { useMemo, useState, useEffect } from "react";
import { getTranslations, createT, type Locale } from "@/locales/index.js";
import { useSystemSettings } from "@/modules/shared/contexts/SystemSettingsContext.tsx";
import { getDocumentLocale } from "@/modules/shared/lib/locale.js";

/**
 * React hook for translations
 * Automatically uses current system locale
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, locale, translations } = useTranslation();
 *
 *   return (
 *     <div>
 *       <h1>{t("common.save")}</h1>
 *       <button>{translations.common.cancel}</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTranslation() {
  const { i18nSettings } = useSystemSettings();

  // State to force re-computation when locale changes
  const [localeVersion, setLocaleVersion] = useState(0);

  // Listen for locale/user updates
  useEffect(() => {
    const handleUpdate = () => {
      setLocaleVersion((v) => v + 1);
    };

    window.addEventListener("user-updated", handleUpdate);
    window.addEventListener("system-settings-updated", handleUpdate);

    return () => {
      window.removeEventListener("user-updated", handleUpdate);
      window.removeEventListener("system-settings-updated", handleUpdate);
    };
  }, []);

  // Get current locale from document or fallback to default
  const locale = useMemo(() => {
    const docLocale = getDocumentLocale();
    // Ensure locale is one of our supported locales
    if (docLocale === "he-IL" || docLocale === "en-US") {
      return docLocale as Locale;
    }
    // Fallback to system default
    return (i18nSettings.default_locale as Locale) || "he-IL";
  }, [i18nSettings.default_locale, localeVersion]);

  // Get translation object
  const translations = useMemo(() => getTranslations(locale), [locale]);

  // Create translation function
  const t = useMemo(() => createT(locale), [locale]);

  return {
    t,
    locale,
    translations,
    isRTL: locale === "he-IL",
    isLTR: locale === "en-US",
  };
}

export default useTranslation;
