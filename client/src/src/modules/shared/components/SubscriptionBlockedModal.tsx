import { AlertTriangle } from "lucide-react";
import BaseModal from "./BaseModal.tsx";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useState, useEffect } from "react";
import api from "@/modules/shared/lib/api.ts";
import { useSubscription } from "@/modules/shared/hooks/useSubscription.ts";

interface SubscriptionPlan {
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
}

interface SubscriptionBlockedModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SubscriptionBlockedModal({
  open,
  onClose,
}: SubscriptionBlockedModalProps) {
  const { subscriptionBlockedPayload, user } = useAuth();
  const subscription = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    setLoading(true);

    api
      .get("/subscriptions/plans", { skipErrorToast: true } as any)
      .then(({ data }) => {
        if (!mounted) return;
        setPlans(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setPlans([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  // Format expiration date
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
  const plan = plans[0];

  const handleUpgrade = () => {
    // TODO: Implement payment flow
    console.log("Upgrade clicked - implement payment flow");
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-2xl"
      closeOnBackdropClick={false}
      closeOnEsc={true}
      showCloseButton={true}
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
        ) : plan ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
              אפשרויות שדרוג
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly plan */}
              <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 hover:border-brand-orange/50 transition">
                <h3 className="font-semibold text-white mb-2">מסלול חודשי</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    {plan.monthlyPrice}
                  </span>
                  <span className="text-neutral-400 text-sm"> ₪ לחודש</span>
                </div>
                <p className="text-xs text-neutral-500">
                  חידוש אוטומטי כל חודש
                </p>
              </div>

              {/* Yearly plan */}
              <div className="bg-gradient-to-br from-brand-orange/20 to-transparent rounded-xl p-6 border border-brand-orange/50 relative">
                <div className="absolute top-2 right-2 bg-brand-orange text-black text-xs font-bold px-2 py-1 rounded">
                  חיסכון {plan.monthlyPrice * 2} ₪
                </div>
                <h3 className="font-semibold text-white mb-2">מסלול שנתי</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    {plan.yearlyPrice}
                  </span>
                  <span className="text-neutral-400 text-sm"> ₪ בשנה</span>
                </div>
                <p className="text-xs text-neutral-500">
                  {plan.monthlyPrice} × 12 חודשים
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          className="w-full px-6 py-3 bg-brand-orange hover:bg-orange-600 text-black font-semibold rounded-lg transition-colors"
        >
          שדרג מנוי
        </button>
      </div>
    </BaseModal>
  );
}
