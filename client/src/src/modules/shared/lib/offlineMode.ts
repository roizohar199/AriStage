type OfflineSnapshot = {
  isBrowserOnline: boolean;
  isForcedOffline: boolean;
  isEffectiveOffline: boolean;
};

const STORAGE_KEY = "ari_forced_offline";

const listeners = new Set<(s: OfflineSnapshot) => void>();

function safeGetForcedOffline(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function safeSetForcedOffline(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
}

let isForcedOffline = safeGetForcedOffline();
let isBrowserOnline =
  typeof navigator !== "undefined" ? navigator.onLine : true;

export function getOfflineSnapshot(): OfflineSnapshot {
  return {
    isBrowserOnline,
    isForcedOffline,
    isEffectiveOffline: isForcedOffline || !isBrowserOnline,
  };
}

export function setForcedOffline(next: boolean): void {
  isForcedOffline = next;
  safeSetForcedOffline(next);
  notify();
}

export function toggleForcedOffline(): void {
  setForcedOffline(!isForcedOffline);
}

export function isEffectiveOffline(): boolean {
  return getOfflineSnapshot().isEffectiveOffline;
}

export function subscribeOffline(
  listener: (s: OfflineSnapshot) => void,
): () => void {
  listeners.add(listener);
  listener(getOfflineSnapshot());
  return () => listeners.delete(listener);
}

function notify(): void {
  const snap = getOfflineSnapshot();
  for (const l of listeners) l(snap);
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isBrowserOnline = true;
    notify();
  });

  window.addEventListener("offline", () => {
    isBrowserOnline = false;
    notify();
  });
}
