// Localization Index
import { he } from "./he.js";
import { en } from "./en.js";

export type Locale = "he-IL" | "en-US";

export type TranslationKey = keyof typeof he;

// Export individual translations
export { he, en };

// Translation map
export const translations = {
  "he-IL": he,
  "en-US": en,
} as const;

// Get translation object for a specific locale
export function getTranslations(locale: Locale) {
  return translations[locale] || translations["he-IL"];
}

// Helper function to get nested translation value with parameter substitution
export function getTranslation(
  locale: Locale,
  path: string,
  params?: Record<string, string | number>,
  fallback?: string,
): string {
  const t = getTranslations(locale);
  const keys = path.split(".");

  let value: any = t;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = value[key];
    } else {
      return fallback || path;
    }
  }

  let result = typeof value === "string" ? value : fallback || path;

  // Replace parameters like {days}, {name}, etc.
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
    });
  }

  return result;
}

// Create a translation function for a specific locale
export function createT(locale: Locale) {
  return (path: string, params?: Record<string, string | number> | string) => {
    // Support both old signature (path, fallback) and new signature (path, params)
    if (typeof params === "string") {
      return getTranslation(locale, path, undefined, params);
    }
    return getTranslation(locale, path, params);
  };
}

// Type-safe translation accessor
export type TranslationTree = typeof he;

// Export default for convenience
export default {
  he,
  en,
  translations,
  getTranslations,
  getTranslation,
  createT,
};
