import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import BaseModal from "./BaseModal.tsx";
import api from "@/modules/shared/lib/api.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useSubscription } from "@/modules/shared/hooks/useSubscription.ts";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

type BillingPeriod = "monthly" | "yearly";

type AvailablePlan = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: boolean;
};

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { subscriptionBlockedPayload, refreshUser } = useAuth();
  const subscription = useSubscription();

  const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] =
    useState<BillingPeriod>("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .get("/plans/available", { skipErrorToast: true } as any)
      .then(({ data }) => {
        if (!mounted) return;
        const nextPlans = Array.isArray(data) ? (data as AvailablePlan[]) : [];
        setPlans(nextPlans);

        // Keep selection if still exists; otherwise pick first.
        setSelectedPlanId((prev) => {
          if (prev && nextPlans.some((p) => p.id === prev)) return prev;
          return nextPlans[0]?.id ?? null;
        });
      })
      .catch(() => {
        if (!mounted) return;
        setPlans([]);
        setSelectedPlanId(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const expiryDate = formatDate(subscriptionBlockedPayload?.expires_at);
  const currentTier = subscription?.plan ?? "trial";

  const selectedPlan = useMemo(() => {
    if (!plans.length) return null;
    if (selectedPlanId) {
      return plans.find((p) => p.id === selectedPlanId) || null;
    }
    return plans[0] || null;
  }, [plans, selectedPlanId]);

  const monthlyPrice =
    selectedPlan && typeof selectedPlan.monthly_price === "number"
      ? selectedPlan.monthly_price
      : null;
  const yearlyPrice =
    selectedPlan && typeof selectedPlan.yearly_price === "number"
      ? selectedPlan.yearly_price
      : null;

  const handleUpgrade = async () => {
    if (submitting) return;
    if (!selectedPlan) {
      setError("אין מסלול זמין לשדרוג כרגע");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post("/payments/create", {
        plan: selectedPlan.key,
        billing_period: selectedBillingPeriod,
      } as any);

      const paymentId =
        (data && (data.paymentId || data.id || data.payment?.id)) || null;

      if (!paymentId) {
        throw new Error("Missing payment id from create response");
      }

      await api.post("/payments/mock-success", { paymentId } as any);

      // Ensure subscription status is refreshed from server
      try {
        await api.get("/subscriptions/me", { skipErrorToast: true } as any);
      } catch {
        // Best-effort only; refreshUser below is the source of truth.
      }

      await refreshUser();

      onClose();
    } catch (err) {
      console.error("Mock subscription upgrade failed", err);
      setError("אירעה שגיאה בשדרוג המנוי (בדיקה). נסה שוב.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      closeOnBackdropClick={!submitting}
      closeOnEsc={!submitting}
      showCloseButton={!submitting}
      padding="p-8"
    >
      <div className="text-center space-y-8">
        {/* Header with icon */}
        <div className="flex justify-center">
          <div className="bg-red-500/20 p-4 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-white">תקופת הניסיון הסתיימה</h2>

        {/* Current Status */}
        <div className="space-y-4">
          <div className="bg-neutral-800 rounded-xl p-4">
            <p className="text-sm text-neutral-400">המסלול הנוכחי שלך</p>
            <p className="text-lg font-semibold text-white mt-1">
              {currentTier}
            </p>
          </div>

          <div className="bg-neutral-800 rounded-xl p-4">
            <p className="text-sm text-neutral-400">תוקף המנוי הסתיים בתאריך</p>
            <p className="text-lg font-semibold text-white mt-1">
              {expiryDate}
            </p>
          </div>
        </div>

        {/* Upgrade Options */}
        {loading ? (
          <div className="bg-neutral-800 rounded-xl p-8">
            <p className="text-neutral-400">טוען מסלולים...</p>
          </div>
        ) : plans.length ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
              אפשרויות שדרוג
            </p>

            {/* Plans list (no filtering by user) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl p-6 border transition cursor-pointer ${
                      isSelected
                        ? "bg-neutral-800 border-brand-orange"
                        : "bg-neutral-800 border-neutral-700 hover:border-brand-orange/50"
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <h3 className="font-semibold text-white mb-1">
                      {plan.name}
                    </h3>
                    {plan.description ? (
                      <p className="text-xs text-neutral-500 mb-3">
                        {plan.description}
                      </p>
                    ) : (
                      <div className="mb-3" />
                    )}

                    <div className="text-sm text-neutral-200" dir="ltr">
                      {plan.currency} {plan.monthly_price} / month
                    </div>
                    <div className="text-sm text-neutral-300" dir="ltr">
                      {plan.currency} {plan.yearly_price} / year
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Billing period selection (applies to selected plan) */}
            {monthlyPrice !== null && yearlyPrice !== null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly */}
                <div
                  className={`rounded-xl p-6 border transition cursor-pointer ${
                    selectedBillingPeriod === "monthly"
                      ? "bg-neutral-800 border-brand-orange"
                      : "bg-neutral-800 border-neutral-700 hover:border-brand-orange/50"
                  }`}
                  onClick={() => setSelectedBillingPeriod("monthly")}
                >
                  <h3 className="font-semibold text-white mb-2">חודשי</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-white">
                      {monthlyPrice}
                    </span>
                    <span className="text-neutral-400 text-sm"> ₪ לחודש</span>
                  </div>
                </div>

                {/* Yearly */}
                <div
                  className={`bg-gradient-to-br rounded-xl p-6 border relative cursor-pointer ${
                    selectedBillingPeriod === "yearly"
                      ? "from-brand-orange/30 to-transparent border-brand-orange"
                      : "from-brand-orange/20 to-transparent border-brand-orange/50"
                  }`}
                  onClick={() => setSelectedBillingPeriod("yearly")}
                >
                  <div className="absolute top-2 right-2 bg-brand-orange text-black text-xs font-bold px-2 py-1 rounded">
                    {(() => {
                      const savings = monthlyPrice * 12 - yearlyPrice;
                      return savings > 0 ? `חיסכון ${savings} ₪` : "הכי משתלם";
                    })()}
                  </div>
                  <h3 className="font-semibold text-white mb-2">שנתי</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-white">
                      {yearlyPrice}
                    </span>
                    <span className="text-neutral-400 text-sm"> ₪ בשנה</span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {monthlyPrice} × 12 חודשים
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="bg-neutral-800 rounded-xl p-6">
            <p className="text-neutral-300">אין מסלולים זמינים כרגע.</p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          disabled={submitting || !selectedPlan}
          className="w-full px-6 py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
        >
          {submitting ? "מבצע שדרוג (בדיקה)..." : "שדרג מנוי"}
        </button>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
