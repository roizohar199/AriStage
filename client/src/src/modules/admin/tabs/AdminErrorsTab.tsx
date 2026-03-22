import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BadgeCheck, Users } from "lucide-react";

import api, { getApiErrorMessage } from "@/modules/shared/lib/api.ts";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";
import { useTranslation } from "@/hooks/useTranslation.ts";

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

type ErrorRow = {
  id: number;
  message?: string;
  route?: string;
  user?: string;
  status?: string | number; // HTTP status code (e.g. 500)
  resolved?: boolean | number | string | null;
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
  setDashboardCards?: (cards: DashboardCard[]) => void;
};

export default function AdminErrorsTab({
  searchValue,
  setSearchValue,
  CardContainer,
  SmallBadge,
  setDashboardCards,
}: Props) {
  const confirm = useConfirm();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [errorsUnsupported, setErrorsUnsupported] = useState(false);

  const loadErrors = useCallback(async () => {
    try {
      setErrorsLoading(true);
      setErrorsUnsupported(false);
      const { data } = await api.get("/errors", {
        skipErrorToast: true,
      } as any);
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
        .includes(q),
    );
  }, [errors, searchValue]);

  const dashboard = useMemo(() => {
    const total = errors.length;
    const resolved = errors.filter((e) => {
      const r = e.resolved as any;
      return r === true || r === 1 || r === "1" || r === "true";
    }).length;
    const open = total - resolved;
    const shown = filteredErrors.length;
    return { total, open, resolved, shown };
  }, [errors, filteredErrors.length]);

  useEffect(() => {
    setDashboardCards?.([
      {
        icon: <AlertCircle size={32} />,
        value: dashboard.total,
        label: t("admin.errorsTab.dashboard.total"),
      },
      {
        icon: <AlertCircle size={32} />,
        value: dashboard.open,
        label: t("admin.errorsTab.dashboard.open"),
      },
      {
        icon: <BadgeCheck size={32} />,
        value: dashboard.resolved,
        label: t("admin.errorsTab.dashboard.resolved"),
      },
      {
        icon: <Users size={32} />,
        value: dashboard.shown,
        label: t("admin.errorsTab.dashboard.shown"),
      },
    ]);
  }, [
    setDashboardCards,
    dashboard.open,
    dashboard.resolved,
    dashboard.shown,
    dashboard.total,
    t,
  ]);

  const resolveError = async (errorId: number) => {
    const ok = await confirm({
      title: t("admin.errorsTab.confirm.resolveTitle"),
      message: t("admin.errorsTab.confirm.resolveMessage"),
    });
    if (!ok) return;

    try {
      await api.put(`/errors/${errorId}`, { resolved: true });
      await loadErrors();
    } catch (err: any) {
      if (err?.response?.status === 404) return;
      const msg = getApiErrorMessage(
        err,
        "admin.errorsTab.messages.resolveError",
      );
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-3">
      {errorsLoading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          {t("admin.errorsTab.loading")}
        </div>
      ) : errorsUnsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">
            {t("admin.errorsTab.unsupported")}
          </p>
          <p className="text-neutral-500 text-xs mt-1">
            {t("admin.errorsTab.endpointLabel")}
          </p>
        </div>
      ) : filteredErrors.length === 0 ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">
            {t("admin.errorsTab.empty")}
          </p>
          {searchValue.trim() ? (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="text-xs text-neutral-400 hover:text-neutral-200 mt-2"
            >
              {t("admin.errorsTab.clearSearch")}
            </button>
          ) : null}
        </div>
      ) : (
        filteredErrors.map((e) => {
          const isResolved =
            e.resolved === true ||
            e.resolved === 1 ||
            e.resolved === "1" ||
            e.resolved === "true";

          const stateLabel = isResolved
            ? t("admin.errorsTab.states.resolved")
            : t("admin.errorsTab.states.open");
          const httpStatusLabel =
            e.status != null && String(e.status).trim()
              ? `HTTP ${String(e.status).trim()}`
              : null;

          return (
            <CardContainer key={e.id}>
              <div className="flex-1 min-w-0 text-start">
                <h3 className="text-lg font-bold text-neutral-100 mb-1">
                  {e.message || t("admin.errorsTab.issueFallback")}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {e.route && <SmallBadge>{e.route}</SmallBadge>}
                  {e.user && (
                    <SmallBadge icon={<Users size={14} />}>{e.user}</SmallBadge>
                  )}
                  {httpStatusLabel ? (
                    <SmallBadge variant="neutral">{httpStatusLabel}</SmallBadge>
                  ) : null}
                  <SmallBadge
                    icon={<AlertCircle size={14} />}
                    variant={isResolved ? "success" : "danger"}
                  >
                    {stateLabel}
                  </SmallBadge>
                </div>
              </div>

              <div className="flex gap-6 flex-row-reverse items-center">
                <button
                  onClick={() => resolveError(e.id)}
                  disabled={isResolved}
                  className={`w-6 h-6 ${
                    !isResolved
                      ? "text-brand-primary hover:text-neutral-100"
                      : "text-neutral-500"
                  }`}
                  title={t("admin.errorsTab.actions.resolve")}
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
