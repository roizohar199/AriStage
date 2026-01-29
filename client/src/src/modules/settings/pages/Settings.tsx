import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import api from "@/modules/shared/lib/api.js";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useSubscription } from "@/modules/shared/hooks/useSubscription.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import DesignActionButtonBig from "@/modules/shared/components/DesignActionButtonBig";
import { resolveThemeIndex } from "@/modules/shared/lib/theme";
import {
  EmailInput,
  Input,
  PasswordInput,
  Select,
} from "@/modules/shared/components/FormControls";

type SubscriptionPlan = {
  tier: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
};

type BillingPeriod = "monthly" | "yearly";

type SettingsFormState = {
  full_name: string;
  email: string;
  newPass: string;
  themeIndex: "0" | "1";
  preferred_locale: "auto" | "he-IL" | "en-US";
  artist_role: string;
  avatar: File | null;
};

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const subscription = useSubscription();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isTrial = subscription?.status === "trial";
  const isSubscriptionActive =
    user?.role === "admin" || subscription?.status === "active" || isTrial;
  const shouldShowUpgrade = !isSubscriptionActive;

  // Trial countdown logic (show only days left)
  // Prefer expiresAt so it works even if started_at/trial_days are missing.
  let trialCountdown: string | null = null;
  if (isTrial) {
    const nowMs = Date.now();
    let endMs = subscription?.expiresAt
      ? new Date(subscription.expiresAt).getTime()
      : NaN;

    // Fallback: sometimes the cached user object may not hydrate expiresAt yet
    if (Number.isNaN(endMs) && (user as any)?.subscription_expires_at) {
      const raw = String((user as any).subscription_expires_at).trim();
      const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
      endMs = new Date(normalized).getTime();
    }

    if (Number.isFinite(endMs)) {
      const diffMs = endMs - nowMs;
      if (diffMs > 0) {
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        trialCountdown = `נותרו ${days} ימי ניסיון`;
      } else {
        trialCountdown = "תקופת הניסיון הסתיימה";
      }
    } else {
      trialCountdown = "לא ניתן לחשב ימי ניסיון (חסר תאריך סיום)";
    }
  }

  const [form, setForm] = useState<SettingsFormState>({
    full_name: "",
    email: "",
    newPass: "",
    themeIndex: String(resolveThemeIndex(user?.theme)) as "0" | "1",
    preferred_locale: ((user as any)?.preferred_locale as any) || "auto",
    artist_role: "",
    avatar: null, // קובץ תמונה חדש
  });

  const [preview, setPreview] = useState<string | null>(null); // תצוגה מקדימה
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedBillingPeriod, setSelectedBillingPeriod] =
    useState<BillingPeriod>("yearly");

  useEffect(() => {
    if (!shouldShowUpgrade) {
      setPlans([]);
      setPlansLoading(false);
      return;
    }

    let mounted = true;
    setPlansLoading(true);

    (api as any)
      .get("/subscriptions/plans", { skipErrorToast: true })
      .then(({ data }: any) => {
        if (!mounted) return;
        setPlans(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setPlans([]);
      })
      .finally(() => {
        if (mounted) setPlansLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [shouldShowUpgrade]);

  // 📥 טעינת פרטי משתמש
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/users/me");

        setForm((f) => ({
          ...f,
          full_name: data.full_name || "",
          email: data.email || "",
          themeIndex: String(resolveThemeIndex(data.theme)) as "0" | "1",
          preferred_locale: (data.preferred_locale || "auto") as
            | "auto"
            | "he-IL"
            | "en-US",
          artist_role: data.artist_role || "",
          avatar: null, // לא לשים פה URL, רק בקובץ preview
        }));

        if (data.avatar) {
          setPreview(data.avatar); // תצוגת תמונה קיימת
        }
      } catch (err) {
        setError("שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // 💾 שמירת נתונים
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("full_name", form.full_name);
      fd.append("email", form.email);
      fd.append("theme", form.themeIndex);
      fd.append("preferred_locale", form.preferred_locale);
      fd.append("artist_role", form.artist_role);

      if (form.avatar) {
        fd.append("avatar", form.avatar);
      }

      await api.put("/users/settings", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // שינוי סיסמה (אם הוזנה)
      if (form.newPass.trim()) {
        await api.put("/users/password", { newPass: form.newPass });
      }

      setSuccess("הפרטים נשמרו בהצלחה!");
      setForm({ ...form, newPass: "" });

      // עדכון משתמש דרך AuthContext (וגם sync ל-localStorage בתוך refreshUser)
      await refreshUser();
      const userData = JSON.parse(localStorage.getItem("ari_user") || "{}");

      // עדכון כל הקומפוננטות דרך custom event
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "user", action: "updated" },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("user-updated", { detail: userData }),
      );
    } catch (err: any) {
      console.error(err);
      const isSubscriptionBlocked =
        err?.response?.status === 402 &&
        err?.response?.data?.code === "SUBSCRIPTION_REQUIRED";

      if (isSubscriptionBlocked) {
        setError("המנוי אינו פעיל. כדי לשמור שינויים יש לשדרג מנוי.");
        return;
      }

      setError(err.response?.data?.error || "שגיאה בעדכון הנתונים");
    } finally {
      setSaving(false);
    }
  };

  const deleteAvatar = async () => {
    if (!preview) return;
    if (!window.confirm("למחוק את תמונת הפרופיל?")) return;

    setError(null);
    setSuccess(null);
    setDeletingAvatar(true);

    try {
      const { data: userData } = await api.delete("/users/avatar");

      setPreview(null);
      setForm((f) => ({ ...f, avatar: null }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      localStorage.setItem("ari_user", JSON.stringify(userData));

      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "user", action: "updated" },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("user-updated", { detail: userData }),
      );

      setSuccess("התמונה נמחקה בהצלחה!");
    } catch (err: any) {
      console.error(err);
      const isSubscriptionBlocked =
        err?.response?.status === 402 &&
        err?.response?.data?.code === "SUBSCRIPTION_REQUIRED";

      if (isSubscriptionBlocked) {
        setError("המנוי אינו פעיל. כדי למחוק תמונה יש לשדרג מנוי.");
        return;
      }

      setError(err.response?.data?.error || "שגיאה במחיקת התמונה");
    } finally {
      setDeletingAvatar(false);
    }
  };

  if (loading)
    return <div className="text-center text-neutral-400 p-6">טוען...</div>;

  return (
    <div className="min-h-screen text-neutral-100 p-6">
      {/* כותרת עליונה */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">הגדרות מערכת</h1>
      </header>

      {(error || success) && (
        <div className="mb-6 space-y-2">
          {error && (
            <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-4 text-neutral-100">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-4 text-neutral-100">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Subscription info (always visible) */}
      <div className="bg-neutral-850 rounded-2xl p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-300">סטטוס מנוי</div>
            <div className="text-lg font-semibold text-neutral-100">
              {isTrial
                ? "מצב ניסיון"
                : isSubscriptionActive
                  ? "פעיל"
                  : "הסתיים"}
            </div>
            {/* Trial countdown (under plan) */}
          </div>
          <div>
            <div className="text-sm text-neutral-300">מסלול נוכחי</div>
            <div className="text-lg font-semibold text-neutral-100" dir="ltr">
              {subscription?.plan ?? "trial"}
            </div>
          </div>
        </div>
        {/* Show trial days left directly under plan */}
        {isTrial && trialCountdown && (
          <div className="w-fit bg-neutral-950 px-2 py-1 rounded-2xl text-xs text-neutral-100 shadow-surface">
            {trialCountdown}
          </div>
        )}

        {shouldShowUpgrade && (
          <div className="pt-4 border-t border-neutral-800 space-y-4">
            <div>
              <div className="text-sm text-neutral-300">שדרוג מנוי</div>
              <div className="text-base text-neutral-100">
                בחר מסלול וחזור לשימוש מלא במערכת
              </div>
            </div>

            {plansLoading ? (
              <div className="bg-neutral-900 rounded-2xl p-4 text-neutral-200">
                טוען מחירים...
              </div>
            ) : plans[0] ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedBillingPeriod("monthly")}
                  className={`text-start rounded-2xl p-5 border transition cursor-pointer ${
                    selectedBillingPeriod === "monthly"
                      ? "bg-neutral-950 border border-brand-primary"
                      : "bg-neutral-900 border border-neutral-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold mb-2">מסלול חודשי</div>
                    <div
                      className={`h-3 w-3 rounded-full border ${
                        selectedBillingPeriod === "monthly"
                          ? "bg-neutral-950 border border-brand-primary"
                          : "bg-neutral-900 border border-neutral-900"
                      }`}
                      aria-hidden
                    />
                  </div>
                  <div className="text-2xl font-bold" dir="ltr">
                    {plans[0].monthlyPrice} ₪
                    <span className="text-sm text-neutral-400"> / חודש</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBillingPeriod("yearly")}
                  className={`text-start rounded-2xl p-5 border transition cursor-pointer ${
                    selectedBillingPeriod === "yearly"
                      ? "bg-neutral-950 border border-brand-primary"
                      : "bg-neutral-900 border border-neutral-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold mb-2">מסלול שנתי</div>
                    <div
                      className={`h-3 w-3 rounded-full border ${
                        selectedBillingPeriod === "yearly"
                          ? "bg-neutral-950 border border-brand-primary"
                          : "bg-neutral-900 border border-neutral-900"
                      }`}
                      aria-hidden
                    />
                  </div>
                  <div className="text-2xl font-bold" dir="ltr">
                    {plans[0].yearlyPrice} ₪
                    <span className="text-sm text-neutral-400"> / שנה</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="bg-neutral-900 rounded-2xl p-4 text-neutral-400">
                לא הצלחנו לטעון מחירים כרגע
              </div>
            )}

            <div className="max-w-md w- full space-y-4 mx-auto">
              <DesignActionButtonBig
                type="button"
                onClick={() => window.openUpgradeModal?.(selectedBillingPeriod)}
              >
                שדרג מנוי
              </DesignActionButtonBig>
            </div>
          </div>
        )}
      </div>

      {/* כרטיס מרכזי - זהה למבנה Home */}
      <div className="space-y-1 rounded-2xl flex flex-col bg-neutral-850">
        {/* טופס הגדרות */}
        <form onSubmit={submit} className="space-y-4  rounded-2xl p-6">
          {/* תמונת פרופיל */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-neutral-950 border-2 border-brand-primary shadow-surface">
              {preview ? (
                <img
                  src={preview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-neutral-500 text-xs">
                  ללא תמונה
                </div>
              )}
            </div>

            <div className="flex items-center flex-row-reverse gap-2 justify-center">
              <DesignActionButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || deletingAvatar}
              >
                החלף תמונה
              </DesignActionButton>

              {preview && (
                <DesignActionButton
                  type="button"
                  variant="danger"
                  onClick={deleteAvatar}
                  disabled={saving || deletingAvatar}
                >
                  {deletingAvatar ? "מוחק..." : "מחק תמונה"}
                </DesignActionButton>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] ?? null;
                setForm({ ...form, avatar: file });
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </div>

          {/* שם מלא */}
          <div className="max-w-md w- full space-y-4 mx-auto">
            <div>
              <Input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                placeholder="שם מלא"
                className="mb-0"
              />
            </div>

            <div>
              <Input
                type="text"
                value={form.artist_role}
                onChange={(e) =>
                  setForm({ ...form, artist_role: e.target.value })
                }
                placeholder="גיטריסט, מפיק, בסיסט..."
                className="mb-0"
              />
            </div>

            {/* אימייל */}
            <div>
              <EmailInput
                dir="rtl"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="אימייל"
                className="mb-0"
              />
            </div>

            {/* סיסמה חדשה */}
            <div>
              <PasswordInput
                value={form.newPass}
                onChange={(e) => setForm({ ...form, newPass: e.target.value })}
                placeholder="סיסמה חדשה (השאר ריק אם לא משנים)"
                className="mb-0"
              />
            </div>

            {/* Theme */}
            <div>
              <Select
                label="צבע מערכת"
                value={form.themeIndex}
                disabled={saving}
                options={[
                  { value: "0", label: "כהה" },
                  { value: "1", label: "בהיר" },
                ]}
                onChange={(themeIndex) => setForm({ ...form, themeIndex })}
              />
            </div>

            {/* Language */}
            <div>
              <Select
                label="שפת מערכת"
                value={form.preferred_locale}
                disabled={saving}
                options={[
                  { value: "auto", label: "אוטומטי (לפי שפת הדפדפן)" },
                  { value: "he-IL", label: "עברית (RTL)" },
                  { value: "en-US", label: "English (LTR)" },
                ]}
                onChange={(preferred_locale) =>
                  setForm({ ...form, preferred_locale })
                }
              />
            </div>

            {/* כפתור שמירה */}
            <DesignActionButtonBig type="submit" disabled={saving}>
              {saving ? "שומר..." : "שמור שינויים"}
            </DesignActionButtonBig>
          </div>
        </form>

        {/* שאר העמוד — ללא שינוי */}
        {/* ... כל שאר הקומפוננט כפי ששלחת נשאר אותו דבר ... */}
      </div>
    </div>
  );
}
