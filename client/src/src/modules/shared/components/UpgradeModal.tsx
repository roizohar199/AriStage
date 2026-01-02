import { useEffect, useState } from "react";
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

type SubscriptionSettings = {
  is_enabled: number;
  price_ils: number;
  trial_days: number;
};

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { subscriptionBlockedPayload, refreshUser } = useAuth();
  const subscription = useSubscription();

  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBillingPeriod, setSelectedBillingPeriod] =
    useState<BillingPeriod>("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setLoading(true);

    api
      .get("/subscriptions/settings", { skipErrorToast: true } as any)
      .then(({ data }) => {
        if (!mounted) return;
        setSettings(data || null);
      })
      .catch(() => {
        if (!mounted) return;
        setSettings(null);
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

  const monthlyPrice =
    settings && typeof settings.price_ils === "number"
      ? settings.price_ils
      : null;
  const yearlyPrice = monthlyPrice !== null ? monthlyPrice * 12 : null;

  const handleUpgrade = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post("/payments/create", {
        plan: "pro",
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
            <p className="text-neutral-400">טוען מחירים...</p>
          </div>
        ) : monthlyPrice !== null && yearlyPrice !== null ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
              אפשרויות שדרוג
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly plan */}
              <div
                className={`rounded-xl p-6 border transition cursor-pointer ${
                  selectedBillingPeriod === "monthly"
                    ? "bg-neutral-800 border-brand-orange"
                    : "bg-neutral-800 border-neutral-700 hover:border-brand-orange/50"
                }`}
                onClick={() => setSelectedBillingPeriod("monthly")}
              >
                <h3 className="font-semibold text-white mb-2">מסלול חודשי</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    {monthlyPrice}
                  </span>
                  <span className="text-neutral-400 text-sm"> ₪ לחודש</span>
                </div>
                <p className="text-xs text-neutral-500">
                  חידוש אוטומטי כל חודש
                </p>
              </div>

              {/* Yearly plan */}
              <div
                className={`bg-gradient-to-br rounded-xl p-6 border relative cursor-pointer ${
                  selectedBillingPeriod === "yearly"
                    ? "from-brand-orange/30 to-transparent border-brand-orange"
                    : "from-brand-orange/20 to-transparent border-brand-orange/50"
                }`}
                onClick={() => setSelectedBillingPeriod("yearly")}
              >
                <div className="absolute top-2 right-2 bg-brand-orange text-black text-xs font-bold px-2 py-1 rounded">
                  {monthlyPrice !== null
                    ? `חיסכון ${monthlyPrice * 2} ₪`
                    : "הכי משתלם"}
                </div>
                <h3 className="font-semibold text-white mb-2">מסלול שנתי</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    {yearlyPrice}
                  </span>
                  <span className="text-neutral-400 text-sm"> ₪ בשנה</span>
                </div>
                {monthlyPrice !== null && (
                  <p className="text-xs text-neutral-500">
                    {monthlyPrice} × 12 חודשים
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          disabled={submitting}
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
