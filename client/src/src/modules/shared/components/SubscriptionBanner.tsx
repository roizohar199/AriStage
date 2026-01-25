import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import api from "@/modules/shared/lib/api.js";

type SubscriptionPlan = {
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
};

export default function SubscriptionBanner() {
  const { subscriptionBlocked, user } = useAuth();
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    if (!subscriptionBlocked || user?.role === "admin") {
      setPrice(null);
      setPriceLoading(false);
      return;
    }

    let mounted = true;
    setPriceLoading(true);

    (api as any)
      .get("/subscriptions/plans", { skipErrorToast: true })
      .then(({ data }: any) => {
        if (!mounted) return;
        const plans = (Array.isArray(data) ? data : []) as SubscriptionPlan[];
        const monthly = plans[0]?.monthlyPrice;
        setPrice(typeof monthly === "number" ? monthly : null);
      })
      .catch(() => {
        if (!mounted) return;
        setPrice(null);
      })
      .finally(() => {
        if (mounted) setPriceLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [subscriptionBlocked, user?.role]);

  // Don't show for admins or if not blocked
  if (!subscriptionBlocked || user?.role === "admin") {
    return null;
  }

  const handleUpgrade = () => {
    window.openUpgradeModal?.();
  };

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-neutral-100 py-4">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-start">
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">תקופת הניסיון הסתיימה</h3>
            <p className="text-sm text-neutral-100/90">
              כדי להמשיך להשתמש במערכת יש לשדרג מנוי • מחיר:{" "}
              <strong dir="ltr">
                {priceLoading
                  ? "טוען..."
                  : price !== null
                    ? `${price} ₪ לחודש`
                    : "לא זמין"}
              </strong>
            </p>
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          className="bg-neutral-100 text-orange-600 font-semibold px-6 py-2 rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap"
        >
          שדרג עכשיו
        </button>
      </div>
    </div>
  );
}
