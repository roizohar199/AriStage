function toMs(value: unknown): number {
  if (!value) return NaN;
  if (value instanceof Date) return value.getTime();
  const raw = String(value).trim();
  if (!raw) return NaN;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  return Number.isNaN(ms) ? NaN : ms;
}

export type SubscriptionWindow = {
  startedAtMs: number;
  expiresAtMs: number;
  hasStart: boolean;
  hasEnd: boolean;
  isInvalidRange: boolean;
  isBeforeStart: boolean;
  isAfterEnd: boolean;
  isWithinWindow: boolean;
  shouldMarkExpired: boolean;
};

export function getSubscriptionWindow(value: {
  subscription_started_at?: unknown;
  subscription_expires_at?: unknown;
}): SubscriptionWindow {
  const startedAtMs = toMs(value.subscription_started_at);
  const expiresAtMs = toMs(value.subscription_expires_at);
  const hasStart = !Number.isNaN(startedAtMs);
  const hasEnd = !Number.isNaN(expiresAtMs);
  const isInvalidRange = hasStart && hasEnd && startedAtMs > expiresAtMs;
  const nowMs = Date.now();
  const isBeforeStart = hasStart && nowMs < startedAtMs;
  const isAfterEnd = !hasEnd || nowMs > expiresAtMs;
  const isWithinWindow =
    !isInvalidRange && !isBeforeStart && hasEnd && !isAfterEnd;

  return {
    startedAtMs,
    expiresAtMs,
    hasStart,
    hasEnd,
    isInvalidRange,
    isBeforeStart,
    isAfterEnd,
    isWithinWindow,
    shouldMarkExpired: !isBeforeStart && !isWithinWindow,
  };
}
