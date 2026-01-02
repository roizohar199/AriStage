import { ReactNode } from "react";
import ProtectedRoute from "@/modules/shared/components/ProtectedRoute";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export default function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  return <ProtectedRoute roles={["admin"]}>{children}</ProtectedRoute>;
}
