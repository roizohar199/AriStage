import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import api, {
  getApiErrorMessage,
  getApiSuccessMessage,
} from "@/modules/shared/lib/api.js";
import { emitToast } from "@/modules/shared/lib/toastBus.js";
import { PasswordInput } from "@/modules/shared/components/FormControls";
import { useTranslation } from "@/hooks/useTranslation.ts";

export default function ResetPassword() {
  const { token } = useParams();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      return setError(t("auth.passwordsDontMatch"));
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });

      // 🔥 במקום הודעה ירוקה — Toast למעלה
      emitToast(getApiSuccessMessage(data, "auth.passwordUpdated"), "success");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-900 text-neutral-100 px-4">
      <div className="w-full max-w-sm bg-neutral-800 border border-neutral-700 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-brand-primary text-center mb-4">
          {t("auth.resetPassword")}
        </h2>

        {/* ❌ רק שגיאות מוצגות בדף */}
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            placeholder={t("auth.newPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordInput
            placeholder={t("auth.confirmPassword")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full bg-brand-primary text-neutral-100 font-bold py-2 rounded-xl"
          >
            {loading ? t("common.saving") : t("auth.updatePassword")}
          </button>
        </form>

        <p className="text-center text-neutral-500 text-xs mt-6">
          {t("common.appName")} 2025
        </p>
      </div>
    </div>
  );
}
