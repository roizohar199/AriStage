import axios from "axios";
import { emitToast } from "./toastBus.ts";

// כתובת השרת ברשת הפנימית שלך
const LOCAL_SERVER_IP = "10.0.0.99";

// קובע את ה-baseURL לפי המכשיר שנכנס
function getBaseURL(): string {
  // אם זה פרודקשן
  if (import.meta.env.MODE === "production") {
    return "https://lightpink-tiger-187044.hostingersite.com/api";
  }

  // אם נפתחה מה-LOCALHOST
  if (window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }

  // אם נכנסת מה-IP הפנימי
  if (window.location.hostname === LOCAL_SERVER_IP) {
    return `http://${LOCAL_SERVER_IP}:5000/api`;
  }

  // fallback — אם יש מקרה מוזר
  return "http://localhost:5000/api";
}

const api = axios.create({
  baseURL: getBaseURL(),
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
    (data?.success ? "בוצע בהצלחה!" : null) ||
    "בוצע בהצלחה!";

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

    // דילוג על שגיאות לפי בקשה
    if (config.skipErrorToast) return Promise.reject(err);

    // 🔹 שגיאות מהשרת
    if (err.response) {
      const { status, data } = err.response;

      // =============================
      // 🔥 תיקון הקריטי — 401 כזה לא מוחק ייצוג !
      // =============================

      if (status === 401) {
        // אם יש טוקן מקורי → אנחנו בייצוג → לא מוחקים כלום
        if (localStorage.getItem("ari_original_token")) {
          emitToast("הטוקן של המשתמש שאתה מייצג פג תוקף", "error");
          return Promise.reject(err);
        }

        // התחברות רגילה — מוחקים
        emitToast("פג תוקף ההתחברות – התחבר מחדש", "error");

        localStorage.removeItem("ari_token");
        localStorage.removeItem("ari_user");

        // אל תמחק את כל ה־localStorage שאולי מכיל דברים קריטיים
        // רק פריטי התחברות

        window.location.href = "/login";
        return;
      }

      if (status === 403) emitToast("אין לך הרשאה לבצע פעולה זו", "error");

      if (status === 404) emitToast("לא נמצא", "error");

      if (status >= 500) emitToast("שגיאת שרת — נסה שוב מאוחר יותר", "error");
    }

    // Timeout
    else if (err.code === "ECONNABORTED") {
      emitToast("⏰ Timeout — השרת לא הגיב בזמן", "error");
    }

    // בעיית רשת
    else {
      emitToast("❌ שגיאת רשת — בדוק חיבור", "error");
    }

    return Promise.reject(err);
  }
);

export default api;
