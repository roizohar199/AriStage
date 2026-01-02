import { useEffect, useState } from "react";
import api from "@/modules/shared/lib/api.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

type PublicSettings = {
  is_enabled: number;
  price_ils: number;
  trial_days: number;
};

export default function SubscriptionBlocked() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .get("/subscriptions/public", { skipErrorToast: true } as any)
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
  }, []);

  const priceText =
    settings && typeof settings.price_ils === "number"
      ? `${settings.price_ils}₪`
      : "—";

  let expiredLine: string | null = null;
  if (
    user &&
    user.subscription_status === "expired" &&
    user.subscription_expires_at
  ) {
    try {
      const raw = String(user.subscription_expires_at).trim();
      if (raw) {
        const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
        const d = new Date(normalized);
        const ms = d.getTime();
        if (!Number.isNaN(ms)) {
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          expiredLine = `תוקף המנוי הסתיים בתאריך ${day}/${month}/${year}`;
        }
      }
    } catch {
      expiredLine = null;
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
        <h1 className="text-2xl font-bold text-white">נדרש מנוי פעיל</h1>
        <p className="text-neutral-300 mt-2 leading-relaxed">
          הגישה לחשבון שלך חסומה כרגע כי אין מנוי פעיל.
          <br />
          ניתן לעבור לתשלום כדי להמשיך להשתמש במערכת.
        </p>

        {expiredLine && (
          <p className="text-red-400 mt-2 text-sm">{expiredLine}</p>
        )}

        <div className="mt-6 bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300">מחיר מנוי (Pro)</span>
            <span className="text-white font-bold">
              {loading ? "טוען..." : priceText}
            </span>
          </div>
          {settings?.trial_days ? (
            <p className="text-neutral-500 text-sm mt-2">
              תקופת ניסיון: {settings.trial_days} ימים
            </p>
          ) : null}
        </div>

        <div className="mt-6">
          <DesignActionButton
            onClick={() => {
              window.openUpgradeModal?.();
            }}
          >
            לתשלום
          </DesignActionButton>
        </div>
      </div>
    </div>
  );
}
