import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation.ts";

interface UseAdminDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAdminData<T = any>(
  apiFn: (...args: any[]) => Promise<any>,
  ...args: any[]
): UseAdminDataResult<T> {
  const { t } = useTranslation();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIndex = useRef(0);

  const refresh = useCallback(() => {
    refreshIndex.current++;
    setData(null);
    setError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    apiFn(...args)
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          setError(t("admin.messages.noPermission"));
        } else {
          setError(
            err?.response?.data?.message || err.message || t("common.error"),
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFn, refreshIndex.current, t, ...args]);

  return { data, loading, error, refresh };
}
