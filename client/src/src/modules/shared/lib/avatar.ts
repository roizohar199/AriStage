export function getAvatarInitial(
  input: string | null | undefined,
  fallback: string = "A",
): string {
  const s = String(input ?? "").trim();
  if (!s) return fallback;

  // Prefer first letter/number (supports Hebrew/English and other scripts)
  const match = s.match(/[\p{L}\p{N}]/u);
  const ch = match?.[0] ?? Array.from(s)[0];
  if (!ch) return fallback;

  // Uppercase is relevant mostly for Latin scripts; for Hebrew it stays the same.
  return ch.toLocaleUpperCase();
}
