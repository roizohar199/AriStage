import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import api from "@/modules/shared/lib/api.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({
  children,
  roles = [],
}: ProtectedRouteProps): ReactNode {
  const { user, loading } = useAuth();

  let token: string | null = null;
  try {
    token = localStorage.getItem("ari_token");
  } catch {
    token = null;
  }

  const isImpersonating = !!localStorage.getItem("ari_original_user");
  const authLock = localStorage.getItem("ari_auth_lock");

  // Keep existing behavior: set default auth header when token exists.
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  /* -----------------------------------------
     ⏳ טעינה / נעילת ייצוג
  ----------------------------------------- */
  if (loading) return null;

  // 🔒 בזמן impersonation lock → לא בודקים ולא זורקים
  if (authLock) {
    return null;
  }

  /* -----------------------------------------
     ❌ לא מחובר כלל
  ----------------------------------------- */
  // B) no user OR no token → redirect to /login
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  /* -----------------------------------------
     ❌ הגבלת הרשאות — אבל לא בזמן ייצוג
  ----------------------------------------- */
  if (
    !isImpersonating &&
    roles.length > 0 &&
    !roles.includes((user.role ?? "") as string)
  ) {
    return <Navigate to="/home" replace />;
  }

  /* -----------------------------------------
     ✔ הכל תקין
  ----------------------------------------- */
  return children;
}
