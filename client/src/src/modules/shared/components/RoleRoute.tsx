import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

interface RoleRouteProps {
  children: React.ReactNode;
  denyRoles?: string[];
  redirectTo?: string;
}

/**
 * חוסם גישה למשתמשים עם role מסוים (denyRoles).
 * שים לב: מערכת התפקידים עצמה היא admin/manager/user בלבד; "guest"
 * הוא מצב יחסים (user_hosts) בצד השרת ולא role נפרד.
 * מבצע redirect ל-redirectTo אם המשתמש חסום.
 */
export function RoleRoute({
  children,
  denyRoles = [],
  redirectTo = "/",
}: RoleRouteProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && denyRoles.includes(user.role || "")) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}

interface GuestOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * חוסם גישה למשתמשים מחוברים (יש user).
 * אין role בשם "guest" – זהו מצב יחסי בלבד.
 * מבצע redirect ל-redirectTo אם המשתמש מחובר.
 */
export function GuestOnlyRoute({
  children,
  redirectTo = "/my",
}: GuestOnlyRouteProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user && user.id) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
