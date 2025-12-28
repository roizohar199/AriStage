import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

export type CurrentUser = {
  id?: number;
  email?: string;
  full_name?: string;
  role?: string;
  avatar?: string | null;
};

/**
 * Hook that returns current user state from AuthContext.
 * @deprecated Consider using useAuth() directly for full context access including logout.
 */
export function useCurrentUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}
