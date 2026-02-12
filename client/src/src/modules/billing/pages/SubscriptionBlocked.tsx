import { useEffect, useState } from "react";
import api from "@/modules/shared/lib/api.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

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

export default function SubscriptionBlocked() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      })
      .catch(() => {
        if (!mounted) return;
        setPlans([]);
        setError("שגיאה בטעינת מסלולים");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const hasPlans = plans.length > 0;

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
        <h1 className="text-2xl font-bold text-neutral-100">נדרש מנוי פעיל</h1>
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
            <span className="text-neutral-300">מסלולים זמינים</span>
            <span className="text-neutral-100 font-bold">
              {loading ? "טוען..." : ""}
            </span>
          </div>

          {!loading && error ? (
            <p className="text-red-300 text-sm mt-2">{error}</p>
          ) : null}

          {!loading && !error && !hasPlans ? (
            <p className="text-neutral-500 text-sm mt-2">
              אין מסלולים זמינים כרגע
            </p>
          ) : null}

          {!loading && !error && hasPlans ? (
            <div className="mt-3 space-y-2">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-neutral-200">{p.name}</span>
                  <span className="text-neutral-100 font-semibold" dir="ltr">
                    {p.currency} {p.monthly_price} / {p.yearly_price}
                  </span>
                </div>
              ))}
            </div>
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
