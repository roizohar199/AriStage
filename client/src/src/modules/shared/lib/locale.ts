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

export function resolveEffectiveLocaleFromUser(user: any): string {
  const preferred = normalizeLocale(user?.preferred_locale);
  return preferred || getBrowserLocale();
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
