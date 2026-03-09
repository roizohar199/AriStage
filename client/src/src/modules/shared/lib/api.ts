import axios from "axios";
import { API_BASE_URL } from "@/config/apiConfig";
import { emitToast } from "./toastBus.ts";
import { isEffectiveOffline } from "@/modules/shared/lib/offlineMode";
import { getTranslation, type Locale } from "@/locales/index.js";
import { getDocumentLocale } from "@/modules/shared/lib/locale";
import {
  authLogoutEvent,
  subscriptionBlockedEvent,
} from "@/modules/shared/contexts/AuthContext.tsx";

function resolveUiLocale(): Locale {
  try {
    const raw = getDocumentLocale();
    return raw && String(raw).toLowerCase().startsWith("en")
      ? "en-US"
      : "he-IL";
  } catch {
    return "he-IL";
  }
}

function t(
  path: string,
  params?: Record<string, string | number>,
  fallback?: string,
): string {
  return getTranslation(resolveUiLocale(), path, params, fallback);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* -----------------------------------------------------
   🎟️ הזרקת הטוקן אוטומטית בכל בקשה
----------------------------------------------------- */
api.interceptors.request.use((config) => {
  try {
    // ⛔ Offline mode: avoid hanging network calls.
    // Allow explicit opt-out per request via `allowWhenOffline`.
    const allowWhenOffline = (config as any)?.allowWhenOffline === true;
    if (isEffectiveOffline() && !allowWhenOffline) {
      const method = (config.method || "get").toLowerCase();
      const isReadOnly =
        method === "get" || method === "head" || method === "options";

      // ✅ Allow read-only requests so Workbox can respond from cache when available.
      if (!isReadOnly) {
        emitToast(t("offline.actionBlocked"), "error");
        return Promise.reject(
          Object.assign(new Error("OFFLINE_MODE"), { code: "OFFLINE_MODE" }),
        );
      }
    }

    let token = localStorage.getItem("ari_token");

    // אם אין טוקן – אולי אנחנו בייצוג ול-ari_user יש טוקן משולב
    if (!token) {
      const raw = localStorage.getItem("ari_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) token = parsed.token;
      }
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  } catch (err) {
    console.error("❌ Token read error:", err);
    return config;
  }
});

/* -----------------------------------------------------
   🟩 Toast הצלחה
----------------------------------------------------- */
function handleSuccessToast(response: any): void {
  const config = response.config;

  if (config.skipSuccessToast) return;

  const { method } = config;
  const isMutation =
    method === "post" || method === "put" || method === "delete";

  if (!isMutation) return;

  const data = response.data;

  const msg =
    data?.message ||
    data?.msg ||
    (data?.success ? t("success.completed") : null) ||
    t("success.completed");

  emitToast(msg, "success");
}

/* -----------------------------------------------------
   ❌ טיפול בשגיאות — עדין ומותאם לייצוג משתמש
----------------------------------------------------- */
api.interceptors.response.use(
  (response) => {
    handleSuccessToast(response);
    return response;
  },

  (err) => {
    const config = err.config || {};

    // Explicit offline short-circuit
    if (err?.code === "OFFLINE_MODE") {
      return Promise.reject(err);
    }

    // ✅ Subscription blocked (Payment Required)
    // Handle before skipErrorToast so bootstrap calls can still set blocked state.
    if (
      err?.response?.status === 402 &&
      err?.response?.data?.code === "SUBSCRIPTION_REQUIRED"
    ) {
      subscriptionBlockedEvent.dispatchEvent(
        new CustomEvent("blocked", { detail: err.response.data }),
      );
      return Promise.reject(err);
    }

    // דילוג על שגיאות לפי בקשה
    if (config.skipErrorToast) return Promise.reject(err);

    // 🔹 שגיאות מהשרת
    if (err.response) {
      const { status } = err.response;

      // =============================
      // 🔥 תיקון הקריטי — 401 כזה לא מוחק ייצוג !
      // =============================

      if (status === 401) {
        // אם יש טוקן מקורי → אנחנו בייצוג → לא מוחקים כלום
        if (localStorage.getItem("ari_original_token")) {
          emitToast(t("auth.impersonationTokenExpired"), "error");
          return Promise.reject(err);
        }

        // Dev relaxed mode: do not force logout/redirect on 401.
        // This lowers security but prevents disruptive disconnect loops locally.
        const isDev = Boolean((import.meta as any)?.env?.DEV);
        if (isDev) {
          emitToast(t("auth.sessionExpiredReLogin"), "error");
          return Promise.reject(err);
        }

        // התחברות רגילה — מוחקים
        emitToast(t("auth.sessionExpiredReLogin"), "error");

        localStorage.removeItem("ari_token");
        localStorage.removeItem("ari_user");

        // Dispatch logout event to update AuthContext
        authLogoutEvent.dispatchEvent(new Event("logout"));

        // אל תמחק את כל ה־localStorage שאולי מכיל דברים קריטיים
        // רק פריטי התחברות

        window.location.href = "/login";
        return;
      }

      if (status === 403) emitToast(t("errors.forbiddenAction"), "error");

      if (status === 404) emitToast(t("errors.notFound"), "error");

      if (status >= 500) emitToast(t("errors.serverTryLater"), "error");
    }

    // Timeout
    else if (err.code === "ECONNABORTED") {
      emitToast(t("errors.timeout"), "error");
    }

    // בעיית רשת
    else {
      emitToast(t("errors.networkCheck"), "error");
    }

    return Promise.reject(err);
  },
);

export default api;
