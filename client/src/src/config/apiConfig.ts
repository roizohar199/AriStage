// Prefer env override.
// In dev, default to the LAN backend so Socket.IO/uploads also work.
// In prod, keep the existing behavior (same hostname, port 5000) unless overridden.
const DEV_API_ORIGIN_FALLBACK = "http://10.100.102.99:5000";

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (import.meta.env.DEV
    ? DEV_API_ORIGIN_FALLBACK
    : `${window.location.protocol}//${window.location.hostname}:5000`);

// Dev: use relative base so Vite can proxy `/api/*`.
// Prod: keep absolute origin-based URL.
export const API_BASE_URL = import.meta.env.DEV ? "/api" : `${API_ORIGIN}/api`;
