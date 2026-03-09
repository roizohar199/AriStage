function normalizeLocale(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (s.toLowerCase() === "auto") return null;
  // Normalize common variants: he_IL -> he-IL
  return s.replace(/_/g, "-");
}

export type TextDirection = "ltr" | "rtl";

export function resolveDirFromLocale(locale: string): TextDirection {
  const lc = String(locale || "")
    .trim()
    .toLowerCase();
  // Minimal set for now. Expand later if needed.
  if (
    lc.startsWith("he") ||
    lc.startsWith("ar") ||
    lc.startsWith("fa") ||
    lc.startsWith("ur")
  ) {
    return "rtl";
  }
  return "ltr";
}

// Requirement: Hebrew scrollbar RIGHT, English scrollbar LEFT.
// Cross-browser reliable approach: set the scroll container direction opposite
// (RTL containers typically put the scrollbar on the left; LTR on the right).
export function resolveScrollbarContainerDirFromLocale(
  locale: string,
): TextDirection {
  const contentDir = resolveDirFromLocale(locale);
  return contentDir === "rtl" ? "ltr" : "rtl";
}

export function getDocumentLocale(): string {
  const root = document.documentElement;
  return (
    normalizeLocale(root.dataset.locale) ||
    normalizeLocale(root.lang) ||
    getBrowserLocale()
  );
}

export function getBrowserLocale(): string {
  try {
    const languages = (navigator as any)?.languages as unknown;
    if (Array.isArray(languages) && languages.length > 0) {
      const first = normalizeLocale(languages[0]);
      if (first) return first;
    }
    const fallback = normalizeLocale((navigator as any)?.language);
    if (fallback) return fallback;
  } catch {
    // ignore
  }
  return "he-IL";
}

/**
 * Get effective browser locale filtered by enabled locales.
 * If browser language is not in enabled list, returns default locale.
 */
export function getBrowserLocaleFiltered(
  enabledLocales: string[],
  defaultLocale: string = "he-IL",
): string {
  const browserLocale = getBrowserLocale();

  // Check if browser locale is enabled
  if (enabledLocales.includes(browserLocale)) {
    return browserLocale;
  }

  // Try to match language without region (e.g., "en" matches "en-US")
  const browserLang = browserLocale.split("-")[0];
  const matchingLocale = enabledLocales.find(
    (locale) => locale.split("-")[0] === browserLang,
  );

  if (matchingLocale) {
    return matchingLocale;
  }

  // Fallback to default locale
  return defaultLocale;
}

export function resolveEffectiveLocaleFromUser(user: any): string {
  const preferred = normalizeLocale(user?.preferred_locale);
  if (preferred) return preferred;

  // If user has chosen "auto" (or has no preference), the system default
  // should follow the browser locale, but only within the enabled locales list.
  const fallbackEnabledLocales = ["he-IL", "en-US"];
  const fallbackDefaultLocale = "he-IL";

  try {
    if (typeof window !== "undefined") {
      const cached = window.localStorage?.getItem("ari_system_settings");
      if (cached) {
        const parsed = JSON.parse(cached) as any;
        const enabled = Array.isArray(parsed?.enabled_locales)
          ? parsed.enabled_locales.filter((x: any) => typeof x === "string")
          : null;
        const defaultLocale =
          typeof parsed?.default_locale === "string" && parsed.default_locale
            ? parsed.default_locale
            : null;

        const mode =
          parsed?.default_locale_mode === "fixed" ? "fixed" : "browser";

        const enabledLocales =
          enabled && enabled.length > 0 ? enabled : fallbackEnabledLocales;
        const effectiveDefaultLocale = defaultLocale || fallbackDefaultLocale;

        if (mode === "fixed") {
          return enabledLocales.includes(effectiveDefaultLocale)
            ? effectiveDefaultLocale
            : fallbackDefaultLocale;
        }

        return getBrowserLocaleFiltered(enabledLocales, effectiveDefaultLocale);
      }
    }
  } catch {
    // ignore
  }

  return getBrowserLocaleFiltered(
    fallbackEnabledLocales,
    fallbackDefaultLocale,
  );
}

export function applyDocumentLocale(locale: string): void {
  const root = document.documentElement;
  root.lang = locale;
  root.dataset.locale = locale;

  // Full direction switching is now enabled.
  // If you want to force RTL temporarily, change this back to: root.dir = "rtl";
  root.dir = resolveDirFromLocale(locale);
}

export function applyLocaleFromUser(user: any): void {
  applyDocumentLocale(resolveEffectiveLocaleFromUser(user));
}
