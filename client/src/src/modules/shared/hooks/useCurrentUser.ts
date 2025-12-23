import { useEffect, useState } from "react";
import api from "@/modules/shared/lib/api.js";

function readStoredUser() {
  try {
    const raw = localStorage.getItem("ari_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id?: number;
  email?: string;
  full_name?: string;
  role?: string;
  avatar?: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/users/me", { skipErrorToast: true })
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data || null);
        // optionally sync localStorage
        try {
          localStorage.setItem("ari_user", JSON.stringify(data || {}));
        } catch {}
      })
      .catch(() => {
        if (!mounted) return;
        setUser(readStoredUser());
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading };
}
