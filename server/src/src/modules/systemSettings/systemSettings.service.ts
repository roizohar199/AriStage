import * as repository from "./systemSettings.repository.js";

/**
 * System Settings Service
 * Business logic for system configuration management
 */

// BCP-47 locale format validation (e.g., "he-IL", "en-US")
const LOCALE_REGEX = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

// Supported locales in the system
const SUPPORTED_LOCALES = ["he-IL", "en-US"];

// Default locale selection mode
// - "browser": follow the user's browser language (within enabled_locales)
// - "fixed": always use default_locale as the system default
const SUPPORTED_LOCALE_MODES = ["browser", "fixed"] as const;
type LocaleMode = (typeof SUPPORTED_LOCALE_MODES)[number];

/**
 * Get all system settings (optionally by category)
 */
export async function getSystemSettings(category?: string) {
  return repository.listSettings(category);
}

/**
 * Get i18n-specific settings (default locale, enabled locales)
 */
export async function getI18nSettings() {
  const settings = await repository.getSettings([
    "default_locale",
    "enabled_locales",
    "default_locale_mode",
  ]);

  const defaultLocale = settings.default_locale || "he-IL";
  const enabledLocalesRaw = settings.enabled_locales || '["he-IL","en-US"]';

  let enabledLocales: string[];
  try {
    enabledLocales = JSON.parse(enabledLocalesRaw);
    if (!Array.isArray(enabledLocales)) {
      enabledLocales = ["he-IL", "en-US"];
    }
  } catch {
    enabledLocales = ["he-IL", "en-US"];
  }

  const modeRaw = (settings as any).default_locale_mode;
  const defaultLocaleMode: LocaleMode = SUPPORTED_LOCALE_MODES.includes(
    modeRaw as any,
  )
    ? (modeRaw as LocaleMode)
    : "browser";

  return {
    default_locale: defaultLocale,
    enabled_locales: enabledLocales,
    default_locale_mode: defaultLocaleMode,
  };
}

/**
 * Validate locale string (BCP-47 format)
 */
function isValidLocale(locale: string): boolean {
  return LOCALE_REGEX.test(locale) && SUPPORTED_LOCALES.includes(locale);
}

function isValidLocaleMode(mode: unknown): mode is LocaleMode {
  return (
    typeof mode === "string" &&
    (SUPPORTED_LOCALE_MODES as readonly string[]).includes(mode)
  );
}

/**
 * Update default locale
 */
export async function setDefaultLocale(locale: string) {
  // Validate locale format
  if (!isValidLocale(locale)) {
    throw new Error("systemSettings.invalidLocale");
  }

  // Ensure locale is enabled
  const { enabled_locales } = await getI18nSettings();
  if (!enabled_locales.includes(locale)) {
    throw new Error("systemSettings.localeNotEnabled");
  }

  await repository.setSetting(
    "default_locale",
    locale,
    "Default system language (BCP-47 format)",
    "i18n",
  );
}

/**
 * Update enabled locales
 */
export async function setEnabledLocales(locales: string[]) {
  // Validate array
  if (!Array.isArray(locales) || locales.length === 0) {
    throw new Error("systemSettings.emptyEnabledLocales");
  }

  // Validate each locale
  for (const locale of locales) {
    if (!isValidLocale(locale)) {
      throw new Error("systemSettings.invalidEnabledLocale");
    }
  }

  // Remove duplicates
  const uniqueLocales = Array.from(new Set(locales));

  // Ensure default locale is enabled
  const { default_locale } = await getI18nSettings();
  if (!uniqueLocales.includes(default_locale)) {
    throw new Error("systemSettings.defaultLocaleMustBeEnabled");
  }

  await repository.setSetting(
    "enabled_locales",
    JSON.stringify(uniqueLocales),
    "Available languages for users (JSON array)",
    "i18n",
  );
}

/**
 * Update multiple i18n settings atomically
 */
export async function updateI18nSettings(data: {
  default_locale?: string;
  enabled_locales?: string[];
  default_locale_mode?: LocaleMode;
}) {
  const current = await getI18nSettings();

  const newDefaultLocale = data.default_locale ?? current.default_locale;
  const newEnabledLocales = data.enabled_locales ?? current.enabled_locales;
  const newDefaultLocaleMode =
    data.default_locale_mode ??
    (current as any).default_locale_mode ??
    "browser";

  if (!isValidLocaleMode(newDefaultLocaleMode)) {
    throw new Error("systemSettings.invalidDefaultLocaleMode");
  }

  // Validate default locale
  if (!isValidLocale(newDefaultLocale)) {
    throw new Error("systemSettings.invalidLocale");
  }

  // Validate enabled locales
  if (!Array.isArray(newEnabledLocales) || newEnabledLocales.length === 0) {
    throw new Error("systemSettings.emptyEnabledLocales");
  }

  for (const locale of newEnabledLocales) {
    if (!isValidLocale(locale)) {
      throw new Error("systemSettings.invalidEnabledLocale");
    }
  }

  // Remove duplicates
  const uniqueEnabledLocales = Array.from(new Set(newEnabledLocales));

  // Ensure default is enabled
  if (!uniqueEnabledLocales.includes(newDefaultLocale)) {
    throw new Error("systemSettings.defaultLocaleMustBeEnabled");
  }

  // Update both settings
  await repository.setSetting(
    "enabled_locales",
    JSON.stringify(uniqueEnabledLocales),
    "Available languages for users (JSON array)",
    "i18n",
  );

  await repository.setSetting(
    "default_locale",
    newDefaultLocale,
    "Default system language (BCP-47 format)",
    "i18n",
  );

  await repository.setSetting(
    "default_locale_mode",
    newDefaultLocaleMode,
    'Default language mode: "browser" (dynamic) or "fixed"',
    "i18n",
  );
}
