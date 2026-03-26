import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import BaseModal from "./BaseModal.tsx";
import api, { getApiErrorMessage } from "@/modules/shared/lib/api.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useSubscription } from "@/modules/shared/hooks/useSubscription.ts";
import { emitToast } from "@/modules/shared/lib/toastBus.js";
import { useTranslation } from "@/hooks/useTranslation.ts";

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
  monthly_enabled: boolean;
  yearly_enabled: boolean;
};

function isBillingPeriodAvailableForPlan(
  plan: Pick<
    AvailablePlan,
    "enabled" | "monthly_enabled" | "yearly_enabled"
  > | null,
  billingPeriod: BillingPeriod,
) {
  if (!plan || plan.enabled === false) {
    return false;
  }

  return billingPeriod === "yearly"
    ? plan.yearly_enabled
    : plan.monthly_enabled;
}

function getPreferredBillingPeriod(
  plan: AvailablePlan | null,
  preferred: BillingPeriod,
): BillingPeriod {
  if (!plan) {
    return preferred;
  }

  if (isBillingPeriodAvailableForPlan(plan, preferred)) {
    return preferred;
  }

  if (isBillingPeriodAvailableForPlan(plan, "monthly")) {
    return "monthly";
  }

  if (isBillingPeriodAvailableForPlan(plan, "yearly")) {
    return "yearly";
  }

  return preferred;
}

export default function UpgradeModal({
  open,
  onClose,
  initialBillingPeriod,
}: UpgradeModalProps) {
  const { t, locale } = useTranslation();
  const { subscriptionBlockedPayload, refreshUser, user, subscriptionStatus } =
    useAuth();
  const subscription = useSubscription();

  const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] =
    useState<BillingPeriod>("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [awaitingPayPalApproval, setAwaitingPayPalApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupWindowRef = useRef<Window | null>(null);
  const popupPollRef = useRef<number | null>(null);
  const popupCompletedRef = useRef(false);

  const clearPopupWatcher = () => {
    if (popupPollRef.current !== null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
  };

  const closePopupWindow = () => {
    clearPopupWatcher();
    const popupWindow = popupWindowRef.current;
    popupWindowRef.current = null;

    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }
  };

  const beginPopupWatcher = () => {
    clearPopupWatcher();
    popupPollRef.current = window.setInterval(() => {
      const popupWindow = popupWindowRef.current;
      if (!popupWindow) {
        clearPopupWatcher();
        return;
      }

      if (popupWindow.closed) {
        popupWindowRef.current = null;
        clearPopupWatcher();

        if (!popupCompletedRef.current) {
          setAwaitingPayPalApproval(false);
          setError(t("billing.paypal.popupClosed"));
        }
      }
    }, 500);
  };

  const openPayPalPopup = (approvalUrl: string) => {
    const width = 520;
    const height = 760;
    const left = Math.max(
      0,
      Math.round(window.screenX + (window.outerWidth - width) / 2),
    );
    const top = Math.max(
      0,
      Math.round(window.screenY + (window.outerHeight - height) / 2),
    );
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "resizable=yes",
      "scrollbars=yes",
      "toolbar=no",
      "menubar=no",
      "location=yes",
      "status=no",
    ].join(",");

    return window.open(approvalUrl, "paypal-subscription-approval", features);
  };

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
        const nextPlans = Array.isArray(data)
          ? (data as AvailablePlan[])
          : Array.isArray((data as any)?.plans)
            ? ((data as any).plans as AvailablePlan[])
            : [];
        setPlans(nextPlans);

        const firstEnabledPlanId =
          nextPlans.find(
            (p) =>
              isBillingPeriodAvailableForPlan(p, "monthly") ||
              isBillingPeriodAvailableForPlan(p, "yearly"),
          )?.id ?? null;

        // Keep selection if still exists; otherwise pick first.
        setSelectedPlanId((prev) => {
          if (
            prev &&
            nextPlans.some(
              (p) =>
                p.id === prev &&
                (isBillingPeriodAvailableForPlan(p, "monthly") ||
                  isBillingPeriodAvailableForPlan(p, "yearly")),
            )
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

  useEffect(() => {
    if (!open) {
      popupCompletedRef.current = false;
      setAwaitingPayPalApproval(false);
      clearPopupWatcher();
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const payload = event.data;
      if (!payload || payload.type !== "paypal-subscription-result") {
        return;
      }

      popupCompletedRef.current = true;
      closePopupWindow();
      setAwaitingPayPalApproval(false);

      if (payload.status === "success") {
        await refreshUser();
        if (payload.message) {
          emitToast(String(payload.message), "success");
        }
        onClose();
        return;
      }

      if (payload.status === "cancelled") {
        if (payload.message) {
          emitToast(String(payload.message), "warning");
        }
        setError(String(payload.message || t("billing.paypal.cancelled")));
        return;
      }

      if (payload.message) {
        emitToast(String(payload.message), "error");
      }
      setError(String(payload.message || t("billing.paypal.activateError")));
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearPopupWatcher();
    };
  }, [open, onClose, refreshUser, t]);

  const formatDate = (raw: unknown) => {
    if (!raw) return "—";
    try {
      const date = raw instanceof Date ? raw : new Date(String(raw));
      return date.toLocaleDateString(locale || "he-IL", {
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

  useEffect(() => {
    if (!open || !selectedPlan) {
      return;
    }

    const nextPeriod = getPreferredBillingPeriod(
      selectedPlan,
      selectedBillingPeriod,
    );

    if (nextPeriod !== selectedBillingPeriod) {
      setSelectedBillingPeriod(nextPeriod);
    }
  }, [open, selectedBillingPeriod, selectedPlan]);

  const handleUpgrade = async () => {
    if (submitting || awaitingPayPalApproval) return;
    if (!selectedPlan) {
      setError(t("billing.upgradeModal.noPlanAvailable"));
      return;
    }

    if (selectedPlan.enabled === false) {
      setError(t("billing.upgradeModal.planNotAvailable"));
      return;
    }

    if (!isBillingPeriodAvailableForPlan(selectedPlan, selectedBillingPeriod)) {
      setError(t("billing.upgradeModal.periodNotAvailable"));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post("/payments/create", {
        plan: selectedPlan.key,
        billing_period: selectedBillingPeriod,
        provider: "paypal",
        return_to: `${window.location.pathname}${window.location.search}`,
      } as any);

      const paymentId =
        (data && (data.paymentId || data.id || data.payment?.id)) || null;
      const approvalUrl =
        (data &&
          (data.approvalUrl ||
            data.approval_url ||
            data.links?.find?.((link: any) => link?.rel === "approve")
              ?.href)) ||
        null;

      if (data?.provider === "mock") {
        if (!paymentId) {
          throw new Error("Missing payment id from create response");
        }

        await api.post("/payments/mock-success", { paymentId } as any);

        try {
          await api.get("/subscriptions/me", { skipErrorToast: true } as any);
        } catch {
          // Best-effort only; refreshUser below is the source of truth.
        }

        await refreshUser();
        onClose();
        return;
      }

      if (!approvalUrl) {
        throw new Error("Missing PayPal approval url from create response");
      }

      popupCompletedRef.current = false;
      const popupWindow = openPayPalPopup(String(approvalUrl));
      if (!popupWindow) {
        throw new Error(t("billing.paypal.popupBlocked"));
      }

      popupWindowRef.current = popupWindow;
      setAwaitingPayPalApproval(true);
      beginPopupWatcher();
    } catch (err) {
      console.error("PayPal subscription upgrade failed", err);
      setError(
        getApiErrorMessage(
          err,
          "billing.upgradeModal.upgradeError",
          t("billing.upgradeModal.upgradeError"),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const title = isExpired
    ? t("billing.upgradeModal.titleExpired")
    : isTrial
      ? t("billing.upgradeModal.titleTrial")
      : t("billing.upgradeModal.titleUpgrade");

  const subtitle = isExpired
    ? t("billing.upgradeModal.subtitleExpired")
    : isTrial
      ? t("billing.upgradeModal.subtitleChoosePlan")
      : t("billing.upgradeModal.subtitleChoosePlan");

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
        label: t("billing.upgradeModal.billingMonthly"),
        amount: monthly,
        cadence: t("billing.upgradeModal.cadencePerMonth"),
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
      secondaryParts.push(
        t("billing.upgradeModal.monthlyEquivalent", {
          amount: monthlyEquivalent,
          currency,
        }),
      );
    }
    if (savings && savings > 0) {
      secondaryParts.push(
        t("billing.upgradeModal.savings", {
          amount: savings,
          currency,
        }),
      );
    }

    return {
      label: t("billing.upgradeModal.billingYearly"),
      amount: yearly,
      cadence: t("billing.upgradeModal.cadencePerYear"),
      secondary: secondaryParts.length ? secondaryParts.join(" • ") : null,
      currency,
    };
  }, [selectedPlan, selectedBillingPeriod, t]);

  const selectedPlanOnlyMonthly =
    !!selectedPlan &&
    isBillingPeriodAvailableForPlan(selectedPlan, "monthly") &&
    !isBillingPeriodAvailableForPlan(selectedPlan, "yearly");
  const selectedPlanOnlyYearly =
    !!selectedPlan &&
    isBillingPeriodAvailableForPlan(selectedPlan, "yearly") &&
    !isBillingPeriodAvailableForPlan(selectedPlan, "monthly");

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      closeOnBackdropClick={!submitting}
      closeOnEsc={!submitting}
      showCloseButton={!submitting}
      padding="p-8"
      containerClassName="bg-neutral-950"
    >
      <div className="space-y-6 text-start p-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 rounded-2xl p-3 border ${
                isExpired
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-brand-primary/10 border-brand-primary/20"
              }`}
            >
              <AlertTriangle
                className={`h-6 w-6 ${
                  isExpired ? "text-red-400" : "text-brand-primary"
                }`}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-100">{title}</h2>
              <p className="text-sm text-neutral-300 mt-1">{subtitle}</p>
            </div>
          </div>

          {/* Status pills */}
          <div className="flex flex-col items-end gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 px-3 py-2">
              <span className="text-xs text-neutral-400">
                {t("billing.upgradeModal.currentPlan")}
              </span>
              <span
                className="text-sm font-semibold text-neutral-100"
                dir="ltr"
              >
                {currentTier}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 px-3 py-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <span className="text-xs text-neutral-400">
                {isExpired
                  ? t("billing.upgradeModal.statusEnded")
                  : isTrial
                    ? t("billing.upgradeModal.statusTrialUntil")
                    : t("billing.upgradeModal.statusValidUntil")}
              </span>
              <span className="text-sm font-semibold text-neutral-100">
                {expiryDate}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Options */}
        {loading ? (
          <div className="bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800">
            <p className="text-neutral-400">{t("billing.loadingPlans")}</p>
          </div>
        ) : plans.length ? (
          <div className="space-y-5">
            {/* Plans list */}
            <div>
              <div className="text-xl font-semibold text-neutral-100">
                {t("billing.upgradeModal.choosePlan")}
              </div>
              <div className="text-sm text-neutral-500">
                {t("billing.upgradeModal.changeAnytime")}
              </div>
            </div>

            {/* Billing period segmented control */}
            <div className="flex items-center justify-between gap-4 border border-neutral-800 rounded-2xl p-2">
              <div>
                <div className="text-sm font-semibold text-neutral-300">
                  {t("billing.upgradeModal.billingPeriod")}
                </div>
                <div className="text-xs text-neutral-500">
                  {selectedPlanOnlyMonthly
                    ? t("billing.upgradeModal.onlyMonthlyAvailable")
                    : selectedPlanOnlyYearly
                      ? t("billing.upgradeModal.onlyYearlyAvailable")
                      : t("billing.upgradeModal.canChangeBeforePayment")}
                </div>
              </div>

              <div className="inline-flex rounded-2xl p-1 bg-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedBillingPeriod("monthly")}
                  disabled={
                    !isBillingPeriodAvailableForPlan(selectedPlan, "monthly")
                  }
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                    selectedBillingPeriod === "monthly"
                      ? "bg-neutral-100 text-neutral-950"
                      : "text-neutral-300 hover:text-neutral-100"
                  } ${
                    !isBillingPeriodAvailableForPlan(selectedPlan, "monthly")
                      ? "opacity-40 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {t("billing.upgradeModal.billingMonthly")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillingPeriod("yearly")}
                  disabled={
                    !isBillingPeriodAvailableForPlan(selectedPlan, "yearly")
                  }
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition ${
                    selectedBillingPeriod === "yearly"
                      ? "bg-neutral-100 text-neutral-950"
                      : "text-neutral-300 hover:text-neutral-100"
                  } ${
                    !isBillingPeriodAvailableForPlan(selectedPlan, "yearly")
                      ? "opacity-40 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {t("billing.upgradeModal.billingYearly")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isEnabled =
                  isBillingPeriodAvailableForPlan(plan, "monthly") ||
                  isBillingPeriodAvailableForPlan(plan, "yearly");
                const displayBillingPeriod = getPreferredBillingPeriod(
                  plan,
                  selectedBillingPeriod,
                );
                const primaryPrice =
                  displayBillingPeriod === "monthly"
                    ? plan.monthly_price
                    : plan.yearly_price;
                const cadence =
                  displayBillingPeriod === "monthly"
                    ? t("billing.upgradeModal.cadencePerMonth")
                    : t("billing.upgradeModal.cadencePerYear");

                return (
                  <button
                    type="button"
                    key={plan.id}
                    disabled={!isEnabled}
                    onClick={() => {
                      if (!isEnabled) return;
                      setSelectedPlanId(plan.id);
                    }}
                    className={`group relative w-full rounded-2xl border p-5 text-start transition ${
                      !isEnabled
                        ? "bg-neutral-900/40 border-neutral-800 opacity-60 cursor-not-allowed"
                        : isSelected
                          ? "bg-neutral-700/50 border-brand-primary"
                          : "bg-neutral-800 border-neutral-800 hover:border-brand-primary/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-xl p-2 border ${
                            isSelected
                              ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                              : "bg-neutral-950/30 border-neutral-800 text-neutral-300 group-hover:text-neutral-100"
                          }`}
                        >
                          {planIcon(plan)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-neutral-100">
                              {plan.name}
                            </h3>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-brand-primary text-neutral-100 text-xs font-bold px-2 py-1">
                                <Check className="h-3.5 w-3.5" />
                                {t("billing.upgradeModal.selected")}
                              </span>
                            ) : null}
                            {!isEnabled ? (
                              <span className="inline-flex items-center rounded-lg bg-neutral-800 text-neutral-200 text-xs font-semibold px-2 py-1">
                                {t("common.notAvailable")}
                              </span>
                            ) : isBillingPeriodAvailableForPlan(
                                plan,
                                "monthly",
                              ) &&
                              !isBillingPeriodAvailableForPlan(
                                plan,
                                "yearly",
                              ) ? (
                              <span className="inline-flex items-center rounded-lg bg-neutral-800 text-neutral-200 text-xs font-semibold px-2 py-1">
                                {t("billing.upgradeModal.onlyMonthlyAvailable")}
                              </span>
                            ) : isBillingPeriodAvailableForPlan(
                                plan,
                                "yearly",
                              ) &&
                              !isBillingPeriodAvailableForPlan(
                                plan,
                                "monthly",
                              ) ? (
                              <span className="inline-flex items-center rounded-lg bg-neutral-800 text-neutral-200 text-xs font-semibold px-2 py-1">
                                {t("billing.upgradeModal.onlyYearlyAvailable")}
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
                        <div className="text-xs text-neutral-400">
                          {t("billing.upgradeModal.total")}
                        </div>
                        <div className="text-xl font-bold text-neutral-100">
                          {plan.currency} {primaryPrice}
                        </div>
                        <div className="text-xs text-neutral-100/70 mt-1">
                          {cadence}
                        </div>
                      </div>
                    </div>

                    <div
                      className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500"
                      dir="ltr"
                    >
                      <span>
                        {t("billing.upgradeModal.pricePerMonthShort", {
                          currency: plan.currency,
                          price: plan.monthly_price,
                        })}
                      </span>
                      <span>
                        {t("billing.upgradeModal.pricePerYearShort", {
                          currency: plan.currency,
                          price: plan.yearly_price,
                        })}
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
                    <div className="text-sm font-semibold text-neutral-100">
                      {t("billing.upgradeModal.paymentSummary")}
                    </div>
                    <div className="text-xs text-neutral-100/70 mt-1">
                      {selectedPlan?.name} {billingSummary.label}
                    </div>
                    {billingSummary.secondary ? (
                      <div className="rounded-2xl bg-neutral-800/50 px-3 py-2 text-xs text-neutral-100 mt-2 font-bold">
                        {billingSummary.secondary}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-end">
                    <div className="text-xs text-neutral-100/70">
                      {t("billing.upgradeModal.amountDue")}
                    </div>
                    <div className="text-2xl font-bold text-neutral-100">
                      {billingSummary.currency} {billingSummary.amount}
                    </div>
                    <div className="text-xs text-neutral-100/70">
                      {billingSummary.cadence}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-[#1f5ea8]/30 bg-[linear-gradient(135deg,rgba(0,48,135,0.22),rgba(0,156,222,0.14))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center rounded-full border border-[#009cde]/35 bg-[#003087] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                    PayPal
                  </div>
                  <div className="mt-3 text-sm font-semibold text-neutral-100">
                    {t("billing.upgradeModal.paypalProviderTitle")}
                  </div>
                  <p className="mt-1 text-sm text-neutral-300">
                    {t("billing.upgradeModal.paypalProviderDescription")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {t("billing.upgradeModal.providerLabel")}
                  </div>
                  <div className="mt-1 text-xl font-black text-[#003087]">
                    Pay<span className="text-[#009cde]">Pal</span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-600">
                    {t("billing.upgradeModal.popupExperienceBadge")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/60 rounded-2xl p-6 border border-neutral-800">
            <p className="text-neutral-300">{t("billing.noPlansAvailable")}</p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          disabled={
            submitting ||
            awaitingPayPalApproval ||
            !selectedPlan ||
            !isBillingPeriodAvailableForPlan(
              selectedPlan,
              selectedBillingPeriod,
            )
          }
          className="w-full px-6 py-3 bg-brand-primary hover:bg-brand-primaryLight disabled:opacity-70 disabled:cursor-not-allowed text-neutral-100 font-semibold rounded-2xl transition-colors"
        >
          {submitting
            ? t("billing.upgradeModal.upgrading")
            : awaitingPayPalApproval
              ? t("billing.upgradeModal.awaitingPopupApproval")
              : billingSummary && billingSummary.amount !== null
                ? t("billing.upgradeModal.proceedToPaymentWithAmount", {
                    amount: billingSummary.amount,
                    currency: billingSummary.currency,
                    cadence: billingSummary.cadence,
                  })
                : t("billing.upgradeModal.proceedToPayment")}
        </button>

        <p className="text-xs text-neutral-500 text-center">
          {awaitingPayPalApproval
            ? t("billing.upgradeModal.paypalPopupNotice")
            : t("billing.upgradeModal.paypalRedirectNotice")}
        </p>

        {awaitingPayPalApproval ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {t("billing.upgradeModal.popupPendingHelp")}
          </div>
        ) : null}

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
