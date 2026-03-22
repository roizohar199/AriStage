import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import api, {
  getApiErrorMessage,
  getApiSuccessMessage,
} from "@/modules/shared/lib/api.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useTranslation } from "@/hooks/useTranslation.ts";
import DesignActionButtonBig from "@/modules/shared/components/DesignActionButtonBig";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import {
  EmailInput,
  Input,
  PasswordInput,
} from "@/modules/shared/components/FormControls";
import { X } from "lucide-react";

export default function Login() {
  const { t, translations } = useTranslation();
  const termsDialog = translations.auth.termsDialog;
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const tabFromUrl = search.get("tab");

  const [tab, setTab] = useState("login");
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (tabFromUrl === "register") setTab("register");
    if (tabFromUrl === "reset") setTab("reset");
  }, [tabFromUrl]);

  useEffect(() => {
    if (!isTermsOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsTermsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTermsOpen]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", { email, password });

      if (data.token) {
        // Save user to localStorage BEFORE calling login
        // This ensures user is available even if /users/me returns 402
        try {
          localStorage.setItem("ari_user", JSON.stringify(data));
        } catch (err) {
          console.error("Failed to save user to localStorage:", err);
        }

        // Use the login method from AuthContext to set token and fetch user
        await login(data.token);
      }

      // Navigate to home - let the app routing decide the destination
      navigate("/");
    } catch (err: any) {
      setError(getApiErrorMessage(err, "auth.loginError"));
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------
       REGISTER – FormData + role + avatar
  -------------------------------------------- */
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    console.log("🔵 [REGISTER] התחלת הרשמה", {
      full_name,
      email,
      role,
      hasAvatar: !!avatar,
      agreed,
    });

    if (!full_name.trim()) {
      console.log("❌ [REGISTER] שם מלא חסר");
      return setError(t("auth.fullNameRequired"));
    }
    if (password !== confirm) {
      console.log("❌ [REGISTER] הסיסמאות לא תואמות");
      return setError(t("auth.passwordMismatch"));
    }
    if (!agreed) {
      console.log("❌ [REGISTER] לא אישר את התקנון");
      return setError(t("auth.termsRequired"));
    }

    try {
      setLoading(true);
      console.log("🟡 [REGISTER] בונה FormData...");

      const form = new FormData();
      form.append("full_name", full_name);
      form.append("email", email);
      form.append("password", password);
      form.append("artist_role", role);
      // Persist initial locale from the user's browser (future i18n)
      try {
        form.append("preferred_locale", navigator.language || "he-IL");
      } catch {
        form.append("preferred_locale", "he-IL");
      }
      if (avatar) form.append("avatar", avatar);

      console.log("🟡 [REGISTER] שולח בקשה לשרת...", {
        url: "/auth/register",
        full_name,
        email,
        artist_role: role,
        hasAvatar: !!avatar,
      });

      const response = await api.post("/auth/register", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ [REGISTER] הצלחה!", response.data);

      setMessage(t("auth.registerSuccess"));
      setTab("login");

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setRole("");
      setAvatar(null);
      setPreview(null);
      setAgreed(false);
    } catch (err: any) {
      console.error("❌ [REGISTER] שגיאה!", {
        error: err,
        response: err?.response,
        data: err?.response?.data,
        status: err?.response?.status,
        message: err?.response?.data?.message || err?.message,
      });
      setError(getApiErrorMessage(err, "auth.registerError"));
    } finally {
      setLoading(false);
      console.log("🟢 [REGISTER] סיימתי");
    }
  };

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);
      const { data } = await api.post("/auth/reset-request", { email });
      setMessage(getApiSuccessMessage(data, "auth.resetEmailSent"));
    } catch (err: any) {
      setError(getApiErrorMessage(err, "auth.resetError"));
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (tab) {
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <EmailInput
              placeholder={t("auth.emailPlaceholder")}
              dir="ltr"
              style={{ unicodeBidi: "isolate" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-0"
              required
            />
            <PasswordInput
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-0"
              required
            />
            <DesignActionButtonBig type="submit" disabled={loading}>
              {loading ? t("auth.loggingIn") : t("auth.login")}
            </DesignActionButtonBig>

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {message && (
              <p className="text-green-400 text-sm mt-2">{message}</p>
            )}
          </form>
        );

      case "register":
        return (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* AVATAR + CIRCLE PREVIEW */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-neutral-800 shadow-md">
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-500 text-xs">
                    {t("auth.noAvatar")}
                  </div>
                )}
              </div>

              <DesignActionButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("auth.uploadAvatar")}
              </DesignActionButton>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0] ?? null;
                  setAvatar(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setPreview(url);
                  } else {
                    setPreview(null);
                  }
                }}
              />
            </div>
            <Input
              type="text"
              placeholder={t("auth.fullName")}
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              className="mb-0"
              required
            />

            {/* ROLE */}
            <Input
              type="text"
              placeholder={t("auth.role")}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mb-0"
            />

            <EmailInput
              placeholder={t("auth.emailPlaceholder")}
              dir="ltr"
              style={{ unicodeBidi: "isolate" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-0"
              required
            />

            <PasswordInput
              placeholder={t("auth.choosePassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-0"
              required
            />

            <PasswordInput
              placeholder={t("auth.confirmPassword")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mb-0"
              required
            />

            <label className="flex items-center text-xs text-gray-300">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mr-2 m-2 accent-brand-primary"
                required
              />
              <span>
                {t("auth.iReadThe")}{" "}
                <button
                  type="button"
                  className="underline underline-offset-2 text-brand-primary hover:text-brand-primaryLight"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsTermsOpen(true);
                  }}
                >
                  {t("auth.terms")}
                </button>
              </span>
            </label>

            <DesignActionButtonBig type="submit" disabled={loading}>
              {loading ? t("auth.registering") : t("auth.register")}
            </DesignActionButtonBig>

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {message && (
              <p className="text-green-400 text-sm mt-2">{message}</p>
            )}
          </form>
        );

      case "reset":
        return (
          <form onSubmit={handleReset} className="space-y-4">
            <EmailInput
              placeholder={t("auth.emailPlaceholder")}
              dir="ltr"
              style={{ unicodeBidi: "isolate" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-0"
              required
            />
            <DesignActionButtonBig type="submit" disabled={loading}>
              {loading ? t("auth.resetting") : t("auth.resetPassword")}
            </DesignActionButtonBig>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {message && (
              <p className="text-green-400 text-sm mt-2">{message}</p>
            )}
          </form>
        );
    }
  };

  return (
    <div className="flex flex-col items-center -translate-y-16 justify-center min-h-screen text-neutral-100">
      <div className="w-full max-w-sm bg-neutral-850 p-6 text-center rounded-2xl backdrop-blur-xl">
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-brand-primary">
            {t("common.appName")}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t("auth.subtitle")}</p>
        </div>

        <div className="bg-neutral-800 flex rounded-2xl mb-6 overflow-hidden">
          {["login", "register", "reset"].map((tabKey) => (
            <button
              key={tabKey}
              className={`flex-1 py-2 font-semibold ${
                tab === tabKey
                  ? "border-b-2 border-brand-primary overflow-hidden text-brand-primary"
                  : "text-neutral-100 hover:text-brand-primaryLight"
              }`}
              onClick={() => {
                setError("");
                setMessage("");
                setTab(tabKey);
              }}
            >
              {tabKey === "login" && t("auth.login")}
              {tabKey === "register" && t("auth.register")}
              {tabKey === "reset" && t("auth.resetPassword")}
            </button>
          ))}
        </div>

        {renderForm()}
      </div>

      {isTermsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={termsDialog.ariaLabel}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsTermsOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-950 text-start shadow-2xl border border-neutral-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-brand-primary">
                {termsDialog.title}
              </h2>
              <button
                onClick={() => setIsTermsOpen(false)}
                className="text-neutral-400 hover:text-neutral-100 transition-colors p-1 hover:bg-neutral-800 rounded-md"
                aria-label={t("common.close")}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto px-5 py-4 text-sm text-gray-200 space-y-4 leading-6">
              <p className="text-gray-400">{termsDialog.lastUpdated}</p>

              {termsDialog.sections.map((section) => (
                <section key={section.title} className="space-y-2">
                  <h3 className="font-semibold text-neutral-100">
                    {section.title}
                  </h3>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.items ? (
                    <ul className="list-disc pr-5 space-y-1">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-neutral-800 flex justify-end">
              <DesignActionButton
                type="button"
                onClick={() => setIsTermsOpen(false)}
              >
                {termsDialog.confirmButton}
              </DesignActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
