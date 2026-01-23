export type ThemeMode = "dark" | "light";

export function resolveThemeIndex(value: unknown): 0 | 1 {
  // Server stores `users.theme` which historically was treated as a string.
  // We support both numeric (0/1) and string ("dark"/"light" or "0"/"1").
  if (value === 1 || value === "1") return 1;
  if (typeof value === "string" && value.trim().toLowerCase() === "light") {
    return 1;
  }
  return 0;
}

export function resolveThemeMode(value: unknown): ThemeMode {
  return resolveThemeIndex(value) === 1 ? "light" : "dark";
}

export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement;
  root.dataset.theme = mode;
  // Ensure native inputs/scrollbars match the selected theme.
  root.style.colorScheme = mode;
}

export function applyThemeFromUser(user: any): void {
  const mode = resolveThemeMode(user?.theme ?? user?.themeIndex);
  applyThemeMode(mode);
}
