import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import api from "@/modules/shared/lib/api.js";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useSubscription } from "@/modules/shared/hooks/useSubscription.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import DesignActionButtonBig from "@/modules/shared/components/DesignActionButtonBig";
import { resolveThemeIndex } from "@/modules/shared/lib/theme";

type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

function DesignDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm mb-1" id={`${id}-label`}>
        {label}
      </label>

      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`w-full bg-neutral-800 p-2 rounded-2xl text-sm outline-none hover:bg-neutral-700/50 focus:bg-neutral-700 flex items-center justify-between gap-3 ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <svg
          className={`h-4 w-4 text-neutral-300 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl bg-neutral-800 shadow-lg"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={`w-full text-right px-3 py-2 text-sm  ${
                  isSelected
                    ? "bg-neutral-800 rounded-2xl text-neutral-200 hover:bg-neutral-700/50"
                    : "bg-neutral-800 rounded-2xl text-neutral-200 hover:bg-neutral-700/50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
  artist_role: string;
  avatar: File | null;
};

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const subscription = useSubscription();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isSubscriptionActive =
    user?.role === "admin" ||
    subscription?.status === "active" ||
    subscription?.status === "trial";

  const shouldShowUpgrade = !isSubscriptionActive;

  const [form, setForm] = useState<SettingsFormState>({
    full_name: "",
    email: "",
    newPass: "",
    themeIndex: String(resolveThemeIndex(user?.theme)) as "0" | "1",
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
    <div dir="rtl" className="min-h-screen text-white p-6">
      {/* כותרת עליונה */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">הגדרות מערכת</h1>
      </header>

      {(error || success) && (
        <div className="mb-6 space-y-2">
          {error && (
            <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-4 text-white">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-4 text-white">
              {success}
            </div>
          )}
        </div>
      )}

      {/* Subscription info (always visible) */}
      <div className="bg-neutral-950/50 rounded-2xl p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-400">סטטוס מנוי</div>
            <div className="text-lg font-semibold">
              {isSubscriptionActive ? "פעיל" : "הסתיים"}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-400">מסלול נוכחי</div>
            <div className="text-lg font-semibold" dir="ltr">
              {subscription?.plan ?? "trial"}
            </div>
          </div>
        </div>

        {shouldShowUpgrade && (
          <div className="pt-4 border-t border-neutral-800 space-y-4">
            <div>
              <div className="text-sm text-neutral-400">שדרוג מנוי</div>
              <div className="text-base text-neutral-200">
                בחר מסלול וחזור לשימוש מלא במערכת
              </div>
            </div>

            {plansLoading ? (
              <div className="bg-neutral-900 rounded-2xl p-4 text-neutral-400">
                טוען מחירים...
              </div>
            ) : plans[0] ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedBillingPeriod("monthly")}
                  className={`text-right bg-neutral-900 rounded-2xl p-5 border transition cursor-pointer ${
                    selectedBillingPeriod === "monthly"
                      ? "border-brand-orange"
                      : "border-neutral-800 hover:border-brand-orange/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold mb-2">מסלול חודשי</div>
                    <div
                      className={`h-3 w-3 rounded-full border ${
                        selectedBillingPeriod === "monthly"
                          ? "bg-brand-orange border-brand-orange"
                          : "border-neutral-600"
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
                  className={`text-right bg-neutral-900 rounded-2xl p-5 border transition cursor-pointer ${
                    selectedBillingPeriod === "yearly"
                      ? "border-brand-orange"
                      : "border-neutral-800 hover:border-brand-orange/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold mb-2">מסלול שנתי</div>
                    <div
                      className={`h-3 w-3 rounded-full border ${
                        selectedBillingPeriod === "yearly"
                          ? "bg-brand-orange border-brand-orange"
                          : "border-neutral-600"
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

            <button
              type="button"
              onClick={() => window.openUpgradeModal?.(selectedBillingPeriod)}
              className="w-full cursor-pointer bg-brand-orange text-black font-semibold px-4 py-2 rounded-2xl shadow-innerIos transition text-sm"
            >
              שדרג מנוי
            </button>
          </div>
        )}
      </div>

      {/* כרטיס מרכזי - זהה למבנה Home */}
      <div className="space-y-1 rounded-2xl flex flex-col ">
        {/* טופס הגדרות */}
        <form
          onSubmit={submit}
          className="space-y-4 bg-neutral-950/50 rounded-2xl p-6"
        >
          {/* תמונת פרופיל */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-neutral-800 border-2 border-brand-orange shadow-md">
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
          <div>
            <label className="block text-sm mb-1">שם מלא</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm outline-none hover:bg-neutral-700/50 focus:bg-neutral-700"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">תפקיד האמן</label>
            <input
              type="text"
              value={form.artist_role}
              onChange={(e) =>
                setForm({ ...form, artist_role: e.target.value })
              }
              placeholder="גיטריסט, מפיק, בסיסט..."
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm outline-none hover:bg-neutral-700/50 focus:bg-neutral-700"
            />
          </div>

          {/* אימייל */}
          <div>
            <label className="block text-sm mb-1">אימייל</label>
            <input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm outline-none hover:bg-neutral-700/50 focus:bg-neutral-700"
            />
          </div>

          {/* Theme */}
          <div>
            <DesignDropdown
              label="צבע מערכת"
              value={form.themeIndex}
              disabled={saving}
              options={[
                { value: "0", label: "כהה" },
                { value: "1", label: "בהיר" },
              ]}
              onChange={(themeIndex) => setForm({ ...form, themeIndex })}
            />
            <div className="text-xs text-neutral-400 mt-1">
              נשמר לכל משתמש קבוע
            </div>
          </div>

          {/* סיסמה חדשה */}
          <div>
            <label className="block text-sm mb-1">סיסמה חדשה</label>
            <input
              type="password"
              value={form.newPass}
              onChange={(e) => setForm({ ...form, newPass: e.target.value })}
              placeholder="לא חובה"
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm outline-none hover:bg-neutral-700/50 focus:bg-neutral-700"
            />
          </div>

          {/* כפתור שמירה */}
          <DesignActionButtonBig type="submit" disabled={saving}>
            {saving ? "שומר..." : "שמור שינויים"}
          </DesignActionButtonBig>
        </form>

        {/* שאר העמוד — ללא שינוי */}
        {/* ... כל שאר הקומפוננט כפי ששלחת נשאר אותו דבר ... */}
      </div>
    </div>
  );
}
