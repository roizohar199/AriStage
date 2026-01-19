import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, Users } from "lucide-react";

import api from "@/modules/shared/lib/api.ts";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

type ErrorRow = {
  id: number;
  message?: string;
  route?: string;
  user?: string;
  status?: string;
  resolved?: boolean;
  created_at?: string;
};

type Props = {
  searchValue: string;
  setSearchValue: (value: string) => void;
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  SmallBadge: React.ComponentType<{
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: SmallBadgeVariant;
  }>;
};

export default function AdminErrorsTab({
  searchValue,
  setSearchValue,
  CardContainer,
  SmallBadge,
}: Props) {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [errorsUnsupported, setErrorsUnsupported] = useState(false);

  const loadErrors = useCallback(async () => {
    try {
      setErrorsLoading(true);
      setErrorsUnsupported(false);
      const { data } = await api.get("/errors", { skipErrorToast: true } as any);
      setErrors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 404) setErrorsUnsupported(true);
      console.error("Admin loadErrors failed", err);
      setErrors([]);
    } finally {
      setErrorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  const filteredErrors = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return errors;
    return errors.filter((e) =>
      `${e.message || ""} ${e.route || ""} ${e.user || ""} ${e.status || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [errors, searchValue]);

  const resolveError = async (errorId: number) => {
    const ok = await confirm({
      title: "סגירת תקלה",
      message: "לסמן תקלה כ-resolved?",
    });
    if (!ok) return;

    try {
      await api.put(`/errors/${errorId}`, { resolved: true });
      await loadErrors();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast("TODO: backend endpoint required: PUT /errors/:id", "info");
        return;
      }
      const msg = err?.response?.data?.message || "שגיאה בסגירת התקלה";
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-3">
      {errorsLoading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען תקלות...
        </div>
      ) : errorsUnsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">TODO: backend endpoint required</p>
          <p className="text-neutral-500 text-xs mt-1">GET /errors</p>
        </div>
      ) : filteredErrors.length === 0 ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">אין תקלות להצגה</p>
          {searchValue.trim() ? (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="text-xs text-neutral-400 hover:text-neutral-200 mt-2"
            >
              נקה חיפוש
            </button>
          ) : null}
        </div>
      ) : (
        filteredErrors.map((e) => {
          const status =
            e.status || (e.resolved ? "resolved" : "open") || "open";
          const isOpen = status === "open" || e.resolved === false;

          return (
            <CardContainer key={e.id}>
              <div className="flex-1 min-w-0 text-right">
                <h3 className="text-lg font-bold text-white mb-1">
                  {e.message || "תקלה"}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {e.route && <SmallBadge>{e.route}</SmallBadge>}
                  {e.user && (
                    <SmallBadge icon={<Users size={14} />}>{e.user}</SmallBadge>
                  )}
                  <SmallBadge
                    icon={<AlertCircle size={14} />}
                    variant={isOpen ? "danger" : "success"}
                  >
                    {status}
                  </SmallBadge>
                </div>
              </div>

              <div className="flex gap-6 flex-row-reverse items-center">
                <button
                  onClick={() => resolveError(e.id)}
                  disabled={!isOpen}
                  className={`w-6 h-6 ${
                    isOpen
                      ? "text-brand-orange hover:text-white"
                      : "text-neutral-500"
                  }`}
                  title="resolve"
                  type="button"
                >
                  <BadgeCheck size={20} />
                </button>
              </div>
            </CardContainer>
          );
        })
      )}
    </div>
  );
}
