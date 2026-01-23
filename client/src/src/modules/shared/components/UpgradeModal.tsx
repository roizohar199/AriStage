import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import BaseModal from "./BaseModal.tsx";
import api from "@/modules/shared/lib/api.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useSubscription } from "@/modules/shared/hooks/useSubscription.ts";

type BillingPeriod = "monthly" | "yearly";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  initialBillingPeriod?: BillingPeriod;
}

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

export default function UpgradeModal({
  open,
  onClose,
  initialBillingPeriod,
}: UpgradeModalProps) {
  const { subscriptionBlockedPayload, refreshUser, user, subscriptionStatus } =
    useAuth();
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

    if (initialBillingPeriod) {
      setSelectedBillingPeriod(initialBillingPeriod);
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .get("/plans/available", { skipErrorToast: true } as any)
      .then(({ data }) => {
        if (!mounted) return;
        const nextPlans = Array.isArray(data) ? (data as AvailablePlan[]) : [];
        setPlans(nextPlans);

        const firstEnabledPlanId =
          nextPlans.find((p) => p.enabled !== false)?.id ?? null;

        // Keep selection if still exists; otherwise pick first.
        setSelectedPlanId((prev) => {
          if (
            prev &&
            nextPlans.some((p) => p.id === prev && p.enabled !== false)
          )
            return prev;
          return firstEnabledPlanId ?? nextPlans[0]?.id ?? null;
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
  }, [open, initialBillingPeriod]);

  const formatDate = (raw: unknown) => {
    if (!raw) return "—";
    try {
      const date = raw instanceof Date ? raw : new Date(String(raw));
      return date.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const effectiveStatus = subscription?.status ?? subscriptionStatus ?? null;
  const isTrial = effectiveStatus === "trial";
  const isExpired = effectiveStatus === "expired";

  const expiryDate = formatDate(
    subscriptionBlockedPayload?.expires_at ??
      user?.subscription_expires_at ??
      subscription?.expiresAt ??
      null,
  );
  const currentTier = subscription?.plan ?? "trial";

  const selectedPlan = useMemo(() => {
    if (!plans.length) return null;
    if (selectedPlanId) {
      return plans.find((p) => p.id === selectedPlanId) || null;
    }
    return plans[0] || null;
  }, [plans, selectedPlanId]);

  const isSelectedPlanEnabled = selectedPlan?.enabled !== false;

  const handleUpgrade = async () => {
    if (submitting) return;
    if (!selectedPlan) {
      setError("אין מסלול זמין לשדרוג כרגע");
      return;
    }

    if (selectedPlan.enabled === false) {
      setError("המסלול הנבחר אינו זמין כרגע");
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

  const title = isExpired
    ? "המנוי פג תוקף"
    : isTrial
      ? "את/ה בתקופת ניסיון"
      : "שדרוג מנוי";

  const subtitle = isExpired
    ? "כדי להמשיך להשתמש במערכת, יש לחדש מנוי"
    : isTrial
      ? "בחר/י מסלול וחזור/י לשימוש מלא במערכת"
      : "בחר/י מסלול וחזור/י לשימוש מלא במערכת";

  const planIcon = (plan: AvailablePlan) => {
    const key = `${plan.key} ${plan.name}`.toLowerCase();
    if (
      key.includes("pro") ||
      key.includes("premium") ||
      key.includes("plus")
    ) {
      return <Crown className="h-5 w-5" />;
    }
    if (
      key.includes("team") ||
      key.includes("studio") ||
      key.includes("business")
    ) {
      return <Sparkles className="h-5 w-5" />;
    }
    return <Zap className="h-5 w-5" />;
  };

  const billingSummary = useMemo(() => {
    if (!selectedPlan) return null;
    const currency = selectedPlan.currency;
    const monthly =
      typeof selectedPlan.monthly_price === "number"
        ? selectedPlan.monthly_price
        : null;
    const yearly =
      typeof selectedPlan.yearly_price === "number"
        ? selectedPlan.yearly_price
        : null;

    if (selectedBillingPeriod === "monthly") {
      return {
        label: "חודשי",
        amount: monthly,
        cadence: "לחודש",
        secondary: null as string | null,
        currency,
      };
    }

    const monthlyEquivalent =
      yearly && typeof yearly === "number" ? Math.round(yearly / 12) : null;
    const savings =
      monthly && yearly ? Math.max(0, monthly * 12 - yearly) : null;

    const secondaryParts: string[] = [];
    if (monthlyEquivalent !== null) {
      secondaryParts.push(`≈ ${monthlyEquivalent} ${currency} לחודש`);
    }
    if (savings && savings > 0) {
      secondaryParts.push(`חיסכון ${savings} ${currency}`);
    }

    return {
      label: "שנתי",
      amount: yearly,
      cadence: "לשנה",
      secondary: secondaryParts.length ? secondaryParts.join(" • ") : null,
      currency,
    };
  }, [selectedPlan, selectedBillingPeriod]);

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
      <div dir="rtl" className="space-y-6 text-right p-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 rounded-2xl p-3 border ${
                isExpired
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-brand-orange/10 border-brand-orange/20"
              }`}
            >
              <AlertTriangle
                className={`h-6 w-6 ${
                  isExpired ? "text-red-400" : "text-brand-orange"
                }`}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-sm text-neutral-300 mt-1">{subtitle}</p>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 px-3 py-2">
              <span className="text-xs text-neutral-400">מסלול נוכחי</span>
              <span className="text-sm font-semibold text-white" dir="ltr">
                {currentTier}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 px-3 py-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <span className="text-xs text-neutral-400">
                {isExpired ? "הסתיים" : isTrial ? "ניסיון עד" : "בתוקף עד"}
              </span>
              <span className="text-sm font-semibold text-white">
                {expiryDate}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        {loading ? (
          <div className="bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800">
            <p className="text-neutral-400">טוען מסלולים...</p>
          </div>
        ) : plans.length ? (
          <div className="space-y-5">
            {/* Plans list */}
            <div>
              <div className="text-xl font-semibold text-white">
                בחר/י מסלול
              </div>
              <div className="text-sm text-neutral-500">
                אפשר לבחור מסלול אחר בכל רגע
              </div>
            </div>

            {/* Billing period segmented control */}
            <div className="flex items-center justify-between gap-4 border border-neutral-800 rounded-2xl p-2">
              <div>
                <div className="text-sm font-semibold text-neutral-300">
                  תקופת חיוב
                </div>
                <div className="text-xs text-neutral-500">
                  ניתן לשנות לפני תשלום
                </div>
              </div>

              <div className="inline-flex rounded-2xl p-1 bg-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedBillingPeriod("monthly")}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                    selectedBillingPeriod === "monthly"
                      ? "bg-white text-black"
                      : "text-neutral-300 hover:text-white"
                  }`}
                >
                  חודשי
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillingPeriod("yearly")}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                    selectedBillingPeriod === "yearly"
                      ? "bg-white text-black"
                      : "text-neutral-300 hover:text-white"
                  }`}
                >
                  שנתי
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isEnabled = plan.enabled !== false;
                const primaryPrice =
                  selectedBillingPeriod === "monthly"
                    ? plan.monthly_price
                    : plan.yearly_price;
                const cadence =
                  selectedBillingPeriod === "monthly" ? "לחודש" : "לשנה";

                return (
                  <button
                    type="button"
                    key={plan.id}
                    disabled={!isEnabled}
                    onClick={() => {
                      if (!isEnabled) return;
                      setSelectedPlanId(plan.id);
                    }}
                    className={`group relative w-full rounded-2xl border p-5 text-right transition ${
                      !isEnabled
                        ? "bg-neutral-900/40 border-neutral-800 opacity-60 cursor-not-allowed"
                        : isSelected
                          ? "bg-neutral-700/50 border-brand-orange"
                          : "bg-neutral-800 border-neutral-800 hover:border-brand-orange/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-xl p-2 border ${
                            isSelected
                              ? "bg-brand-orange/10 border-brand-orange/30 text-brand-orange"
                              : "bg-neutral-950/30 border-neutral-800 text-neutral-300 group-hover:text-white"
                          }`}
                        >
                          {planIcon(plan)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">
                              {plan.name}
                            </h3>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-brand-orange text-black text-xs font-bold px-2 py-1">
                                <Check className="h-3.5 w-3.5" />
                                נבחר
                              </span>
                            ) : null}
                            {!isEnabled ? (
                              <span className="inline-flex items-center rounded-lg bg-neutral-800 text-neutral-200 text-xs font-semibold px-2 py-1">
                                לא זמין
                              </span>
                            ) : null}
                          </div>
                          {plan.description ? (
                            <p className="text-xs text-neutral-400 mt-1">
                              {plan.description}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-left" dir="ltr">
                        <div className="text-xs text-neutral-400">סה"כ</div>
                        <div className="text-xl font-bold text-white">
                          {plan.currency} {primaryPrice}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {cadence}
                        </div>
                      </div>
                    </div>

                    <div
                      className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500"
                      dir="ltr"
                    >
                      <span>
                        {plan.currency} {plan.monthly_price} / month
                      </span>
                      <span>
                        {plan.currency} {plan.yearly_price} / year
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Price summary */}
            {billingSummary && billingSummary.amount !== null ? (
              <div className="rounded-2xl bg-neutral-700 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      סיכום תשלום
                    </div>
                    <div className="text-xs text-white/70 mt-1">
                      {selectedPlan?.name} {billingSummary.label}
                    </div>
                    {billingSummary.secondary ? (
                      <div
                        className="rounded-2xl bg-neutral-800/50 px-3 py-2 text-xs text-white mt-2 font-bold"
                        dir="rtl"
                      >
                        {billingSummary.secondary}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-left" dir="rtl">
                    <div className="text-xs text-white/70">לתשלום</div>
                    <div className="text-2xl font-bold text-white">
                      {billingSummary.currency} {billingSummary.amount}
                    </div>
                    <div className="text-xs text-white/70">
                      {billingSummary.cadence}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800">
            <p className="text-neutral-300">אין מסלולים זמינים כרגע.</p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          disabled={submitting || !selectedPlan || !isSelectedPlanEnabled}
          className="w-full px-6 py-3 bg-brand-orange hover:bg-brand-orangeLight disabled:opacity-70 disabled:cursor-not-allowed text-black font-semibold rounded-2xl transition-colors"
        >
          {submitting
            ? "מבצע שדרוג (בדיקה)..."
            : billingSummary && billingSummary.amount !== null
              ? `המשך לתשלום - ${billingSummary.amount} ${billingSummary.currency} ${billingSummary.cadence}`
              : "המשך לתשלום"}
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
