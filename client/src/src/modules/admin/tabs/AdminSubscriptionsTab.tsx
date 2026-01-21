import React from "react";
import { Mail, BadgeCheck, Users, Clock } from "lucide-react";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import type { AdminUser } from "../pages/Admin";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";

type SubscriptionEdit = {
  subscription_type: string;
  subscription_status: string;
  subscription_started_at: string;
  subscription_expires_at: string;
};

function parseDateMs(raw?: string | null): number | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  return Number.isNaN(ms) ? null : ms;
}

type AdminSubscriptionsTabProps = {
  users: AdminUser[];
  usersLoading: boolean;
  usersUnsupported: boolean;
  searchValue: string;
  subscriptionEdits: Record<number, SubscriptionEdit>;
  setSubscriptionEdits: React.Dispatch<
    React.SetStateAction<Record<number, SubscriptionEdit>>
  >;
  editingSubscriptionUserId: number | null;
  setEditingSubscriptionUserId: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  reload: () => Promise<void>;
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  SmallBadge: React.ComponentType<{
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: "neutral" | "brand" | "success" | "danger";
  }>; // match actual prop type
  formatSubscriptionDate: (raw?: string | null) => string;
  toDateTimeLocalInput: (raw?: string | null) => string;
  normalizeSubscriptionType: (raw?: string | null) => string;
  showToast: (
    msg: string,
    type?: "success" | "info" | "error" | "warning",
  ) => void;
  api: any;
  setDashboardCards?: (cards: DashboardCard[]) => void;
};

const AdminSubscriptionsTab: React.FC<AdminSubscriptionsTabProps> = ({
  users,
  usersLoading,
  usersUnsupported,
  searchValue,
  subscriptionEdits,
  setSubscriptionEdits,
  editingSubscriptionUserId,
  setEditingSubscriptionUserId,
  reload,
  CardContainer,
  SmallBadge,
  formatSubscriptionDate,
  toDateTimeLocalInput,
  normalizeSubscriptionType,
  showToast,
  api,
  setDashboardCards,
}) => {
  const [plans, setPlans] = React.useState<
    { id: number; key: string; name: string; enabled: boolean }[]
  >([]);

  const dashboardStats = React.useMemo(() => {
    const total = users.length;

    const isTrial = (u: AdminUser) => {
      const t = String(u.subscription_type ?? "trial")
        .trim()
        .toLowerCase();
      return !t || t === "trial";
    };

    const paid = users.filter((u) => !isTrial(u)).length;
    const trial = users.filter((u) => isTrial(u)).length;

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const expiringSoon = users.filter((u) => {
      if (isTrial(u)) return false;
      const ms = parseDateMs(u.subscription_expires_at ?? null);
      if (ms == null) return false;
      const diff = ms - now;
      return diff >= 0 && diff <= sevenDaysMs;
    }).length;

    return { total, paid, trial, expiringSoon };
  }, [users]);

  React.useLayoutEffect(() => {
    setDashboardCards?.([
      { icon: <Users size={32} />, value: dashboardStats.total, label: 'סה"כ' },
      {
        icon: <BadgeCheck size={32} />,
        value: dashboardStats.paid,
        label: "מנויים (לא trial)",
      },
      {
        icon: <Users size={32} />,
        value: dashboardStats.trial,
        label: "trial",
      },
      {
        icon: <Clock size={32} />,
        value: dashboardStats.expiringSoon,
        label: "פג תוקף בקרוב (7 ימים)",
      },
    ]);
  }, [
    setDashboardCards,
    dashboardStats.expiringSoon,
    dashboardStats.paid,
    dashboardStats.total,
    dashboardStats.trial,
  ]);

  React.useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      // Prefer admin plans (includes disabled). Fallback to public available plans.
      try {
        const { data } = await api.get("/admin/plans", {
          skipErrorToast: true,
        } as any);
        const next = Array.isArray(data) ? data : [];
        if (mounted) setPlans(next);
        return;
      } catch {
        // ignore
      }

      try {
        const { data } = await api.get("/plans/available", {
          skipErrorToast: true,
        } as any);
        const next = Array.isArray(data) ? data : [];
        if (mounted) setPlans(next);
      } catch {
        if (mounted) setPlans([]);
      }
    };

    void loadPlans();

    return () => {
      mounted = false;
    };
  }, [api]);

  const planOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: "trial", label: "trial" },
    ];
    const seen = new Set<string>(["trial"]);

    for (const p of plans) {
      const key = String(p?.key ?? "").trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const name = String(p?.name ?? "").trim();
      const enabled = Boolean(p?.enabled);
      options.push({
        value: key,
        label: `${name || key} (${key})${enabled ? "" : " (disabled)"}`,
      });
    }

    return options;
  }, [plans]);

  return (
    <div className="space-y-3">
      {usersLoading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען מנויים...
        </div>
      ) : usersUnsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <BadgeCheck size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">Admin endpoint missing</p>
          <p className="text-neutral-500 text-xs mt-1">GET /admin/users</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <BadgeCheck size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">אין נתונים להצגה</p>
          <p className="text-neutral-500 text-xs mt-1">GET /admin/users</p>
        </div>
      ) : (
        users
          .filter((u) => {
            const q = searchValue.trim().toLowerCase();
            if (!q) return true;
            return `${u.full_name || ""} ${u.email} ${
              u.subscription_type || ""
            }`
              .toLowerCase()
              .includes(q);
          })
          .map((u) => {
            const isEditing = editingSubscriptionUserId === u.id;
            const rawStatus = u.subscription_status;
            const statusLabel =
              typeof rawStatus === "string" && rawStatus.trim()
                ? rawStatus
                : "—";
            const startedLabel = formatSubscriptionDate(
              u.subscription_started_at ?? null,
            );
            const expiresLabel = formatSubscriptionDate(
              u.subscription_expires_at ?? null,
            );
            const baseSubForm: SubscriptionEdit = {
              subscription_type: normalizeSubscriptionType(u.subscription_type),
              subscription_status:
                typeof rawStatus === "string" && rawStatus.trim()
                  ? rawStatus
                  : "",
              subscription_started_at: u.subscription_started_at || "",
              subscription_expires_at: u.subscription_expires_at || "",
            };
            const subForm = subscriptionEdits[u.id] ?? baseSubForm;
            return (
              <CardContainer key={`sub-${u.id}`}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {u.full_name || "משתמש ללא שם"}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <SmallBadge icon={<Mail size={14} />}>{u.email}</SmallBadge>
                    <SmallBadge icon={<BadgeCheck size={14} />} variant="brand">
                      {normalizeSubscriptionType(u.subscription_type)}
                    </SmallBadge>
                    <SmallBadge>{statusLabel}</SmallBadge>
                    <SmallBadge>{startedLabel}</SmallBadge>
                    <SmallBadge>{expiresLabel}</SmallBadge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-start">
                  {!isEditing ? (
                    <DesignActionButton
                      type="button"
                      onClick={() => {
                        setEditingSubscriptionUserId(u.id);
                        setSubscriptionEdits((prev) => ({
                          ...prev,
                          [u.id]: baseSubForm,
                        }));
                      }}
                    >
                      ערוך מנוי
                    </DesignActionButton>
                  ) : (
                    <>
                      <label className="text-xs text-neutral-300 font-bold">
                        מסלול מנוי
                      </label>
                      <select
                        value={subForm.subscription_type}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSubscriptionEdits((prev) => {
                            const current = prev[u.id] ?? baseSubForm;
                            return {
                              ...prev,
                              [u.id]: {
                                ...current,
                                subscription_type: value,
                              },
                            };
                          });
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm"
                      >
                        {!planOptions.some(
                          (o) => o.value === subForm.subscription_type,
                        ) ? (
                          <option value={subForm.subscription_type}>
                            {subForm.subscription_type} (legacy)
                          </option>
                        ) : null}
                        {planOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <label className="text-xs text-neutral-300 font-bold mt-2">
                        סטטוס מנוי
                      </label>
                      <select
                        value={subForm.subscription_status}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSubscriptionEdits((prev) => {
                            const current = prev[u.id] ?? baseSubForm;
                            return {
                              ...prev,
                              [u.id]: {
                                ...current,
                                subscription_status: value,
                              },
                            };
                          });
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm"
                      >
                        <option value="active">active</option>
                        <option value="trial">trial</option>
                        <option value="expired">expired</option>
                      </select>
                      <label className="text-xs text-neutral-300 font-bold mt-2">
                        תאריכי מנוי (start / end)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <input
                          type="datetime-local"
                          placeholder="subscription_started_at"
                          value={toDateTimeLocalInput(
                            subForm.subscription_started_at || "",
                          )}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSubscriptionEdits((prev) => {
                              const current = prev[u.id] ?? baseSubForm;
                              return {
                                ...prev,
                                [u.id]: {
                                  ...current,
                                  subscription_started_at: value,
                                },
                              };
                            });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-xs"
                        />
                        <input
                          type="datetime-local"
                          placeholder="subscription_expires_at"
                          value={toDateTimeLocalInput(
                            subForm.subscription_expires_at || "",
                          )}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSubscriptionEdits((prev) => {
                              const current = prev[u.id] ?? baseSubForm;
                              return {
                                ...prev,
                                [u.id]: {
                                  ...current,
                                  subscription_expires_at: value,
                                },
                              };
                            });
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-xs"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <DesignActionButton
                          type="button"
                          onClick={async () => {
                            try {
                              // Build full payload, convert empty strings to null for date fields
                              const payload: any = {
                                subscription_type: subForm.subscription_type,
                                subscription_status:
                                  subForm.subscription_status,
                                subscription_started_at:
                                  subForm.subscription_started_at === ""
                                    ? null
                                    : subForm.subscription_started_at,
                                subscription_expires_at:
                                  subForm.subscription_expires_at === ""
                                    ? null
                                    : subForm.subscription_expires_at,
                              };
                              await api.put(
                                `/admin/users/${u.id}/subscription`,
                                payload,
                              );
                              showToast("Subscription updated", "success");
                              setEditingSubscriptionUserId(null);
                              await reload();
                            } catch (err: any) {
                              const msg =
                                err?.response?.data?.message ||
                                "שגיאה בעדכון מנוי";
                              showToast(msg, "error");
                            }
                          }}
                        >
                          שמור מנוי
                        </DesignActionButton>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSubscriptionUserId(null);
                            setSubscriptionEdits((prev) => {
                              const next = { ...prev };
                              delete next[u.id];
                              return next;
                            });
                          }}
                          className="text-xs text-neutral-400 hover:text-neutral-200"
                        >
                          ביטול
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        שינוי זה מעדכן רק שדות מנוי של המשתמש (plan/status/
                        start/end) ולא משנה מחירי מסלולים.
                      </p>
                    </>
                  )}
                </div>
              </CardContainer>
            );
          })
      )}
    </div>
  );
};

export default AdminSubscriptionsTab;
