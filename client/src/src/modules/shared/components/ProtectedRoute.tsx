import React, { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import api from "@/modules/shared/lib/api.ts";

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  subscription_type?: string;
}

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({ children, roles = [] }: ProtectedRouteProps): JSX.Element {
  const [ready, setReady] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);

  useEffect(() => {
    try {
      // 🔒 בדיקה אם יש נעילת ייצוג (מונע קפיצה בזמן שינוי משתמש)
      const authLock = localStorage.getItem("ari_auth_lock");
      if (authLock) {
        // לא טוען משתמש, לא בודק כלום — מונע זריקה ל-login
        setReady(true);
        return;
      }

      const rawUser = localStorage.getItem("ari_user");
      const storedUser = rawUser ? JSON.parse(rawUser) : null;
      const storedToken = localStorage.getItem("ari_token");

      const originalUser = localStorage.getItem("ari_original_user");
      setIsImpersonating(!!originalUser);

      // 🧠 הזרקת הטוקן
      if (storedToken) {
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      }

      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      }

      setReady(true);
    } catch (err) {
      console.error("ProtectedRoute error:", err);
      setReady(true);
    }
  }, []);

  /* -----------------------------------------
     ⏳ טעינה / נעילת ייצוג
  ----------------------------------------- */
  if (!ready) return null;

  // 🔒 בזמן impersonation lock → לא בודקים ולא זורקים
  if (localStorage.getItem("ari_auth_lock")) {
    return null;
  }

  /* -----------------------------------------
     ❌ לא מחובר כלל
  ----------------------------------------- */
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  /* -----------------------------------------
     ❌ הגבלת הרשאות — אבל לא בזמן ייצוג
  ----------------------------------------- */
  if (!isImpersonating && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  /* -----------------------------------------
     ✔ הכל תקין
  ----------------------------------------- */
  return children;
}
