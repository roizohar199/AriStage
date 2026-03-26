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
import { getBrowserLocale } from "@/modules/shared/lib/locale";
import { X } from "lucide-react";

type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  artistRole: string;
  agreed: boolean;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  artistRole: string;
  agreed: boolean;
  preferredLocale: string;
};

type RegisterField = keyof RegisterFormValues;

type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

type RegisterErrorDetail = {
  field?: string;
  message?: string;
};

type RegisterErrorResponse = {
  error?: string;
  details?: RegisterErrorDetail[];
};

const REGISTER_FIELD_MAP: Partial<Record<string, RegisterField>> = {
  fullName: "fullName",
  full_name: "fullName",
  email: "email",
  password: "password",
  confirmPassword: "confirmPassword",
  confirm_password: "confirmPassword",
  artistRole: "artistRole",
  artist_role: "artistRole",
  role: "artistRole",
  agreed: "agreed",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_PASSWORD_MIN_LENGTH = 8;

export default function Login() {
  const { t, translations } = useTranslation();
  const termsDialog = translations.auth.termsDialog;
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const tabFromUrl = search.get("tab");

  const [tab, setTab] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [artistRole, setArtistRole] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<RegisterFieldErrors>({});

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

  const clearRegisterErrors = (...fields: RegisterField[]) => {
    setRegisterErrors((current) => {
      if (!fields.length) return {};

      let changed = false;
      const next = { ...current };

      for (const field of fields) {
        if (next[field]) {
          delete next[field];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  };

  const clearRegisterFeedback = (...fields: RegisterField[]) => {
    setError("");
    setMessage("");
    clearRegisterErrors(...fields);
  };

  const validateRegisterForm = (
    values: RegisterFormValues,
  ): RegisterFieldErrors => {
    const nextErrors: RegisterFieldErrors = {};
    const trimmedFullName = values.fullName.trim();
    const trimmedEmail = values.email.trim();

    if (!trimmedFullName) {
      nextErrors.fullName = t("auth.fullNameRequired");
    } else if (trimmedFullName.length < 2) {
      nextErrors.fullName = t("auth.fullNameTooShort");
    }

    if (!trimmedEmail) {
      nextErrors.email = t("auth.emailRequired");
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = t("errors.invalidEmail");
    }

    if (!values.password) {
      nextErrors.password = t("auth.passwordRequired");
    } else if (values.password.length < REGISTER_PASSWORD_MIN_LENGTH) {
      nextErrors.password = t("auth.passwordTooShort");
    }

    if (!values.confirmPassword || values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = t("auth.passwordMismatch");
    }

    if (!values.agreed) {
      nextErrors.agreed = t("auth.termsRequired");
    }

    return nextErrors;
  };

  const applyRegisterApiFieldErrors = (err: unknown) => {
    const responseData = (
      err as { response?: { data?: RegisterErrorResponse } }
    )?.response?.data;

    if (!Array.isArray(responseData?.details)) {
      return false;
    }

    const nextErrors = responseData.details.reduce<RegisterFieldErrors>(
      (acc, detail) => {
        const mappedField = detail.field
          ? REGISTER_FIELD_MAP[detail.field]
          : undefined;

        if (mappedField && detail.message && !acc[mappedField]) {
          acc[mappedField] = detail.message;
        }

        return acc;
      },
      {},
    );

    if (!Object.keys(nextErrors).length) {
      return false;
    }

    setRegisterErrors(nextErrors);
    setError(
      typeof responseData.error === "string" ? responseData.error.trim() : "",
    );
    return true;
  };

  const hasRegisterPassword = password.length > 0;
  const isRegisterPasswordValid =
    password.length >= REGISTER_PASSWORD_MIN_LENGTH;
  const hasConfirmPassword = confirmPassword.length > 0;
  const isConfirmPasswordMatch =
    hasConfirmPassword && password === confirmPassword;

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
      if (err?.response?.status === 401) {
        setError(t("auth.invalidCredentials"));
      } else {
        setError(getApiErrorMessage(err, "auth.loginError"));
      }
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------
       REGISTER – FormData + role + avatar
  -------------------------------------------- */
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setMessage("");
    setRegisterErrors({});

    const values: RegisterFormValues = {
      fullName,
      email,
      password,
      confirmPassword,
      artistRole,
      agreed,
    };

    const validationErrors = validateRegisterForm(values);
    if (Object.keys(validationErrors).length) {
      setRegisterErrors(validationErrors);
      return;
    }

    const payload: RegisterPayload = {
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      artistRole: values.artistRole.trim(),
      agreed: values.agreed,
      preferredLocale: getBrowserLocale(),
    };

    try {
      setLoading(true);

      if (import.meta.env.DEV) {
        console.debug("[REGISTER] payload", {
          fullName: payload.fullName,
          email: payload.email,
          artistRole: payload.artistRole,
          agreed: payload.agreed,
          preferredLocale: payload.preferredLocale,
          hasAvatar: !!avatar,
        });
      }

      const form = new FormData();
      form.append("fullName", payload.fullName);
      form.append("email", payload.email);
      form.append("password", payload.password);
      form.append("artistRole", payload.artistRole);
      form.append("agreed", String(payload.agreed));
      form.append("preferredLocale", payload.preferredLocale);
      if (avatar) form.append("avatar", avatar);

      const response = await api.post("/auth/register", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(t("auth.registerSuccess"));
      setTab("login");

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setArtistRole("");
      setAvatar(null);
      setPreview(null);
      setAgreed(false);
      setRegisterErrors({});
    } catch (err: any) {
      if (!applyRegisterApiFieldErrors(err)) {
        setError(getApiErrorMessage(err, "auth.registerError"));
      }
    } finally {
      setLoading(false);
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
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearRegisterFeedback("fullName");
              }}
              className="mb-0"
              error={registerErrors.fullName}
              required
            />

            {/* ROLE */}
            <Input
              type="text"
              placeholder={t("auth.role")}
              value={artistRole}
              onChange={(e) => {
                setArtistRole(e.target.value);
                clearRegisterFeedback("artistRole");
              }}
              className="mb-0"
              error={registerErrors.artistRole}
            />

            <EmailInput
              placeholder={t("auth.emailPlaceholder")}
              dir="ltr"
              style={{ unicodeBidi: "isolate" }}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearRegisterFeedback("email");
              }}
              className="mb-0"
              error={registerErrors.email}
              required
            />

            <PasswordInput
              placeholder={t("auth.choosePassword")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearRegisterFeedback("password", "confirmPassword");
              }}
              className="mb-0"
              error={registerErrors.password}
              required
            />
            {hasRegisterPassword ? (
              <p
                className={`text-xs mt-1 ${
                  isRegisterPasswordValid ? "text-green-400" : "text-amber-300"
                }`}
                role="status"
              >
                {isRegisterPasswordValid
                  ? t("auth.passwordLooksGood")
                  : t("auth.passwordMinLengthHint", {
                      min: REGISTER_PASSWORD_MIN_LENGTH,
                    })}
              </p>
            ) : null}

            <PasswordInput
              placeholder={t("auth.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearRegisterFeedback("confirmPassword");
              }}
              className="mb-0"
              error={registerErrors.confirmPassword}
              required
            />
            {hasConfirmPassword ? (
              <p
                className={`text-xs mt-1 ${
                  isConfirmPasswordMatch ? "text-green-400" : "text-amber-300"
                }`}
                role="status"
              >
                {isConfirmPasswordMatch
                  ? t("auth.passwordsMatch")
                  : t("auth.passwordMismatch")}
              </p>
            ) : null}

            <label className="flex items-center text-xs text-gray-300">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  clearRegisterFeedback("agreed");
                }}
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
            {registerErrors.agreed ? (
              <p className="text-red-400 text-xs -mt-2" role="alert">
                {registerErrors.agreed}
              </p>
            ) : null}

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
                setRegisterErrors({});
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
