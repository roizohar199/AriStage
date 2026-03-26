import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { getApiErrorMessage } from "@/modules/shared/lib/api.js";
import { emitToast } from "@/modules/shared/lib/toastBus.js";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useTranslation } from "@/hooks/useTranslation.ts";

type CallbackState = "loading" | "success" | "cancelled" | "error";

function notifyOpener(
  status: "success" | "cancelled" | "error",
  message: string,
) {
  if (!window.opener || window.opener === window) {
    return false;
  }

  window.opener.postMessage(
    {
      type: "paypal-subscription-result",
      status,
      message,
    },
    window.location.origin,
  );

  return true;
}

function sanitizeRedirectTarget(value: string | null): string {
  const fallback = "/settings";
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  return raw;
}

export default function PayPalReturn() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>("loading");
  const [message, setMessage] = useState<string>(
    t("billing.paypal.processing"),
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const outcome = String(searchParams.get("paypal_outcome") ?? "success");
      const redirectTo = sanitizeRedirectTarget(
        searchParams.get("redirect_to"),
      );

      if (outcome === "cancelled") {
        const cancelMessage = t("billing.paypal.cancelled");
        if (notifyOpener("cancelled", cancelMessage)) {
          window.setTimeout(() => window.close(), 150);
          return;
        }

        if (!mounted) return;
        setState("cancelled");
        setMessage(cancelMessage);
        emitToast(cancelMessage, "warning");
        window.setTimeout(() => navigate(redirectTo, { replace: true }), 1200);
        return;
      }

      const subscriptionId = String(
        searchParams.get("subscription_id") ??
          searchParams.get("ba_token") ??
          "",
      ).trim();
      if (!subscriptionId) {
        const missingMessage = t("billing.paypal.missingSubscriptionId");
        if (notifyOpener("error", missingMessage)) {
          window.setTimeout(() => window.close(), 150);
          return;
        }

        if (!mounted) return;
        setState("error");
        setMessage(missingMessage);
        return;
      }

      try {
        await api.post(
          "/payments/paypal/activate",
          {
            subscriptionId,
            token: searchParams.get("token") ?? searchParams.get("ba_token"),
          },
          { skipSuccessToast: true } as any,
        );
        await refreshUser();

        const successMessage = t("billing.paypal.success");
        if (notifyOpener("success", successMessage)) {
          window.setTimeout(() => window.close(), 150);
          return;
        }

        if (!mounted) return;
        setState("success");
        setMessage(successMessage);
        emitToast(successMessage, "success");
        window.setTimeout(() => navigate(redirectTo, { replace: true }), 1200);
      } catch (err: any) {
        const errorMessage = getApiErrorMessage(
          err,
          "billing.paypal.activateError",
          t("billing.paypal.activateError"),
        );

        if (notifyOpener("error", errorMessage)) {
          window.setTimeout(() => window.close(), 150);
          return;
        }

        if (!mounted) return;
        setState("error");
        setMessage(errorMessage);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [navigate, refreshUser, searchParams, t]);

  const title =
    state === "success"
      ? t("billing.paypal.successTitle")
      : state === "cancelled"
        ? t("billing.paypal.cancelledTitle")
        : state === "error"
          ? t("billing.paypal.errorTitle")
          : t("billing.paypal.processingTitle");

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 space-y-3">
        <h1 className="text-2xl font-bold text-neutral-100">{title}</h1>
        <p className="text-neutral-300 leading-relaxed">{message}</p>
        {state === "error" ? (
          <button
            type="button"
            onClick={() => navigate("/settings", { replace: true })}
            className="px-4 py-2 rounded-2xl bg-brand-primary text-black font-semibold"
          >
            {t("billing.paypal.backToSettings")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
