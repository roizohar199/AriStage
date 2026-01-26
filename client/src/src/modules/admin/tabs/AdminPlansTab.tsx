import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  BadgeCheck,
  CreditCard,
  Layers,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash,
} from "lucide-react";
import BaseModal from "@/modules/shared/components/BaseModal";
import ConfirmModal from "@/modules/shared/confirm/ConfirmModal";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { useToast } from "@/modules/shared/components/ToastProvider";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import api from "@/modules/shared/lib/api.ts";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";
import { Input } from "@/modules/shared/components/FormControls";

// 1) Types
export type Plan = {
  id: number;
  key: string;
  name: string;
  description?: string;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: boolean;
};

type PlanUpsertInput = {
  key: string;
  name: string;
  description?: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: boolean;
};

type AdminPaymentRow = {
  id: number;
  full_name?: string | null;
  email?: string | null;
  plan?: string;
  amount?: number;
  status?: string;
  created_at?: string;
};

// 2) API helpers
async function getPlans(): Promise<Plan[]> {
  const { data } = await api.get("/admin/plans", {
    skipErrorToast: true,
  } as any);

  return Array.isArray(data) ? (data as Plan[]) : [];
}

async function createPlan(payload: PlanUpsertInput): Promise<Plan> {
  const { data } = await api.post("/admin/plans", payload, {
    skipErrorToast: true,
  } as any);

  return data as Plan;
}

async function updatePlan(id: number, payload: PlanUpsertInput): Promise<Plan> {
  const { data } = await api.put(`/admin/plans/${id}`, payload, {
    skipErrorToast: true,
  } as any);

  return data as Plan;
}

async function setPlanEnabled(id: number, enabled: boolean): Promise<Plan> {
  const { data } = await api.patch(`/admin/plans/${id}/enabled`, { enabled }, {
    skipErrorToast: true,
  } as any);

  return data as Plan;
}

async function deletePlan(id: number): Promise<void> {
  await api.delete(`/admin/plans/${id}`, {
    skipErrorToast: true,
  } as any);
}

async function getPayments(): Promise<AdminPaymentRow[]> {
  const { data } = await api.get("/admin/payments", {
    skipErrorToast: true,
  } as any);

  return Array.isArray(data) ? (data as AdminPaymentRow[]) : [];
}

function formatPaymentDate(raw?: string | null): string {
  if (!raw) return "—";
  try {
    const trimmed = String(raw).trim();
    if (!trimmed) return "—";

    const normalized = trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T");

    const d = new Date(normalized);
    const ms = d.getTime();
    if (Number.isNaN(ms)) return "—";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

// 4) Internal modal (PlanForm)
type PlanFormProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialPlan?: Plan | null;
  onSubmit: (payload: PlanUpsertInput) => Promise<void>;
  canEdit: boolean;
};

type PlanFormState = {
  key: string;
  name: string;
  description: string;
  currency: string;
  monthly_price: string;
  yearly_price: string;
  enabled: boolean;
};

function PlanForm({
  open,
  onClose,
  mode,
  initialPlan,
  onSubmit,
  canEdit,
}: PlanFormProps) {
  const initial: PlanFormState = useMemo(() => {
    const p = initialPlan;
    return {
      key: p?.key ?? "",
      name: p?.name ?? "",
      description: p?.description ?? "",
      currency: p?.currency ?? "ILS",
      monthly_price:
        typeof p?.monthly_price === "number" ? String(p.monthly_price) : "0",
      yearly_price:
        typeof p?.yearly_price === "number" ? String(p.yearly_price) : "0",
      enabled: p?.enabled ?? true,
    };
  }, [initialPlan]);

  const [form, setForm] = useState<PlanFormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setSubmitting(false);
    setError(null);
  }, [open, initial]);

  const title = mode === "create" ? "הוספת מסלול" : "עריכת מסלול";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setError(null);

    const key = form.key.trim();
    const name = form.name.trim();
    const currency = form.currency.trim();

    if (!key) return setError("שדה key הוא חובה");
    if (!name) return setError("שדה name הוא חובה");
    if (!currency) return setError("שדה currency הוא חובה");

    const monthly = Number(form.monthly_price);
    const yearly = Number(form.yearly_price);
    if (!Number.isFinite(monthly)) return setError("monthly_price לא תקין");
    if (!Number.isFinite(yearly)) return setError("yearly_price לא תקין");

    const payload: PlanUpsertInput = {
      key,
      name,
      description: form.description.trim() ? form.description.trim() : null,
      currency,
      monthly_price: Math.trunc(monthly),
      yearly_price: Math.trunc(yearly),
      enabled: !!form.enabled,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "שגיאה בשמירה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} title={title} maxWidth="max-w-lg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{title}</h2>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Input
              label="key"
              value={form.key}
              onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              disabled={!canEdit || submitting || mode === "edit"}
              placeholder="pro"
              className="mb-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Input
              label="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              disabled={!canEdit || submitting}
              placeholder="Pro"
              className="mb-0"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Input
            label="description"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            disabled={!canEdit || submitting}
            placeholder="אופציונלי"
            className="mb-0"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-2">
            <Input
              label="currency"
              value={form.currency}
              onChange={(e) =>
                setForm((p) => ({ ...p, currency: e.target.value }))
              }
              disabled={!canEdit || submitting}
              placeholder="ILS"
              className="mb-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Input
              label="monthly_price"
              type="number"
              value={form.monthly_price}
              onChange={(e) =>
                setForm((p) => ({ ...p, monthly_price: e.target.value }))
              }
              disabled={!canEdit || submitting}
              className="mb-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Input
              label="yearly_price"
              type="number"
              value={form.yearly_price}
              onChange={(e) =>
                setForm((p) => ({ ...p, yearly_price: e.target.value }))
              }
              disabled={!canEdit || submitting}
              className="mb-0"
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) =>
              setForm((p) => ({ ...p, enabled: e.target.checked }))
            }
            className="accent-brand-primary"
            disabled={!canEdit || submitting}
          />
          <span className="text-sm text-neutral-200">enabled</span>
        </label>

        <DesignActionButton type="submit" disabled={!canEdit || submitting}>
          {submitting ? "שומר..." : "שמור"}
        </DesignActionButton>
      </form>
    </BaseModal>
  );
}

export default function AdminPlansTab({
  setDashboardCards,
}: {
  setDashboardCards?: (cards: DashboardCard[]) => void;
}) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin";
  const { showToast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState<boolean>(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setError("אין הרשאה לצפייה במסלולים");
      } else {
        setError("שגיאה בטעינת מסלולים");
      }
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    let isMounted = true;

    const loadPayments = async () => {
      setPaymentsLoading(true);
      setPaymentsError(null);
      try {
        const data = await getPayments();
        if (!isMounted) return;
        setPayments(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Admin loadPayments failed", err);
        setPaymentsError("שגיאה בטעינת תשלומים");
        setPayments([]);
      } finally {
        if (isMounted) setPaymentsLoading(false);
      }
    };

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingPlan(null);
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setModalMode("edit");
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const submit = async (payload: PlanUpsertInput) => {
    if (!canEdit) return;

    if (modalMode === "create") {
      await createPlan(payload);
      await fetchPlans();
      showToast("מסלול נוסף", "success");
      return;
    }

    const id = editingPlan?.id;
    if (!id) return;

    await updatePlan(id, payload);
    await fetchPlans();
    showToast("מסלול עודכן", "success");
  };

  const toggleEnabled = async (plan: Plan) => {
    if (!canEdit) return;

    setTogglingId(plan.id);
    try {
      await setPlanEnabled(plan.id, !plan.enabled);
      await fetchPlans();
      showToast("עודכן", "success");
    } catch {
      showToast("שגיאה בעדכון enabled", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const disablePlan = async (plan: Plan) => {
    if (!canEdit) return;
    if (!plan.enabled) return;

    setTogglingId(plan.id);
    try {
      await setPlanEnabled(plan.id, false);
      await fetchPlans();
      showToast("המסלול הושבת", "success");
    } catch {
      showToast("שגיאה בהשבתת מסלול", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (plan: Plan) => {
    if (!canEdit) return;
    setPlanToDelete(plan);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    setTogglingId(planToDelete.id);
    try {
      await deletePlan(planToDelete.id);
      await fetchPlans();
      showToast("המסלול נמחק בהצלחה", "success");
    } catch {
      showToast("שגיאה במחיקת מסלול", "error");
    } finally {
      setTogglingId(null);
      setPlanToDelete(null);
    }
  };

  const dashboard = useMemo(() => {
    const totalPlans = plans.length;
    const enabledPlans = plans.filter((p) => p.enabled).length;

    const totalPayments = paymentsLoading ? "…" : payments.length;
    const successPayments = paymentsLoading
      ? "…"
      : payments.filter((p) => {
          const s = String(p.status ?? "").toLowerCase();
          return ["paid", "success", "succeeded", "completed", "ok"].includes(
            s,
          );
        }).length;

    return { totalPlans, enabledPlans, totalPayments, successPayments };
  }, [plans, payments, paymentsLoading]);

  useEffect(() => {
    setDashboardCards?.([
      {
        icon: <Layers size={32} />,
        value: dashboard.totalPlans,
        label: "מסלולים",
      },
      {
        icon: <ToggleRight size={32} />,
        value: dashboard.enabledPlans,
        label: "Enabled",
      },
      {
        icon: <CreditCard size={32} />,
        value: dashboard.totalPayments,
        label: "תשלומים",
      },
      {
        icon: <BadgeCheck size={32} />,
        value: dashboard.successPayments,
        label: "תשלומים מוצלחים",
      },
    ]);
  }, [
    setDashboardCards,
    dashboard.enabledPlans,
    dashboard.successPayments,
    dashboard.totalPayments,
    dashboard.totalPlans,
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-neutral-100">ניהול מסלולים</h3>
          {canEdit ? (
            <DesignActionButton onClick={openCreate} type="button">
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                הוסף מסלול
              </span>
            </DesignActionButton>
          ) : null}
        </div>

        {loading ? (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
            טוען מסלולים...
          </div>
        ) : error ? (
          <div className="bg-neutral-800 rounded-2xl p-6 text-center">
            <p className="text-neutral-400 text-sm">{error}</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-neutral-800 rounded-2xl p-6 text-center">
            <p className="text-neutral-400 text-sm">אין מסלולים להצגה</p>
          </div>
        ) : (
          <div className="bg-neutral-800 rounded-2xl p-4 overflow-x-auto">
            <table className="min-w-full text-sm text-start">
              <thead>
                <tr className="border-b border-neutral-700 text-neutral-300">
                  <th className="px-3 py-2 font-semibold">key</th>
                  <th className="px-3 py-2 font-semibold">name</th>
                  <th className="px-3 py-2 font-semibold">currency</th>
                  <th className="px-3 py-2 font-semibold">monthly</th>
                  <th className="px-3 py-2 font-semibold">yearly</th>
                  <th className="px-3 py-2 font-semibold">enabled</th>
                  <th className="px-3 py-2 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => {
                  const isToggling = togglingId === p.id;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-neutral-800 last:border-0"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-100">
                        {p.key}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-100">
                        {p.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                        {p.currency}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                        {p.monthly_price}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                        {p.yearly_price}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                        <span
                          className={
                            p.enabled
                              ? "text-brand-primary"
                              : "text-neutral-400"
                          }
                        >
                          {p.enabled ? "כן" : "לא"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          {canEdit ? (
                            <button
                              onClick={() => openEdit(p)}
                              className="w-7 h-7 text-neutral-100 hover:text-brand-primary"
                              title="עריכה"
                              type="button"
                            >
                              <Pencil size={18} />
                            </button>
                          ) : null}

                          {canEdit ? (
                            <button
                              onClick={() => handleDelete(p)}
                              className="w-7 h-7 text-neutral-100 hover:text-red-500"
                              title="מחיקה"
                              type="button"
                              disabled={isToggling}
                            >
                              <Trash size={18} />
                            </button>
                          ) : null}

                          {canEdit ? (
                            <button
                              onClick={() => disablePlan(p)}
                              className="text-neutral-100"
                              title="השבת מסלול"
                              type="button"
                              disabled={isToggling || !p.enabled}
                            >
                              השבת
                            </button>
                          ) : null}

                          {canEdit ? (
                            <button
                              onClick={() => toggleEnabled(p)}
                              title="הפעלה / כיבוי"
                              type="button"
                              disabled={isToggling}
                            >
                              {p.enabled ? (
                                <ToggleRight
                                  className="text-brand-primary"
                                  size={25}
                                />
                              ) : (
                                <ToggleLeft
                                  className="text-neutral-100 hover:text-brand-primary"
                                  size={25}
                                />
                              )}
                            </button>
                          ) : null}

                          {!canEdit ? (
                            <span className="text-xs text-neutral-500">
                              Read-only
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-neutral-100">תשלומים</h3>

        {paymentsLoading ? (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
            טוען תשלומים...
          </div>
        ) : paymentsError ? (
          <div className="bg-neutral-800 rounded-2xl p-6 text-center">
            <p className="text-neutral-400 text-sm">{paymentsError}</p>
          </div>
        ) : !payments.length ? (
          <div className="bg-neutral-800 rounded-2xl p-6 text-center">
            <p className="text-neutral-400 text-sm">אין תשלומים להצגה</p>
          </div>
        ) : (
          <div className="bg-neutral-800 rounded-2xl p-4 overflow-x-auto">
            <table className="min-w-full text-sm text-start">
              <thead>
                <tr className="border-b border-neutral-700 text-neutral-300">
                  <th className="px-3 py-2 font-semibold">משתמש</th>
                  <th className="px-3 py-2 font-semibold">אימייל</th>
                  <th className="px-3 py-2 font-semibold">סכום (ILS)</th>
                  <th className="px-3 py-2 font-semibold">מסלול</th>
                  <th className="px-3 py-2 font-semibold">סטטוס</th>
                  <th className="px-3 py-2 font-semibold">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-800 last:border-0"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-100">
                      {p.full_name || "—"}
                    </td>
                    <td
                      className="px-3 py-2 whitespace-nowrap text-neutral-300"
                      dir="ltr"
                    >
                      {p.email || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-100">
                      {typeof p.amount === "number" ? p.amount : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                      {p.plan || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-200">
                      {p.status || "—"}
                    </td>
                    <td
                      className="px-3 py-2 whitespace-nowrap text-neutral-400"
                      dir="ltr"
                    >
                      {formatPaymentDate(p.created_at ?? null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlanForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        initialPlan={editingPlan}
        onSubmit={submit}
        canEdit={canEdit}
      />

      <ConfirmModal
        open={!!planToDelete}
        title="מחיקת מסלול"
        message={`האם אתה בטוח שברצונך למחוק את המסלול "${planToDelete?.name}"? הפעולה אינה הפיכה.`}
        confirmLabel="מחק"
        cancelLabel="ביטול"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPlanToDelete(null)}
      />
    </div>
  );
}
