import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

export function AdminGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Auth loading is handled globally by AppBootstrap/Splash,
  // but keep this guard resilient.
  if (loading) {
    return null;
  }

  // ProtectedRoute should handle unauthenticated redirects.
  // If user is missing here, just send them home.
  if (!user?.id) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
