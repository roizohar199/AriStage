import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, {
  getApiErrorMessage,
  getApiSuccessMessage,
} from "@/modules/shared/lib/api.js";
import { useTranslation } from "@/hooks/useTranslation.ts";

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setError(t("invitations.invalidLink"));
      setLoading(false);
      return;
    }

    handleAcceptInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/users/invite/${token}`, {
        skipErrorToast: true,
      });

      if (data.needsLogin) {
        setNeedsLogin(true);
        setMessage(t("invitations.joinedPleaseLogin"));
      } else if (data.needsRegistration) {
        setNeedsRegistration(true);
        setInvitationEmail(data.email);
        setMessage(t("invitations.createAccountToJoin"));
      } else {
        setMessage(getApiSuccessMessage(data, "invitations.joinedSuccess"));
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "invitations.handleError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#121212] to-[#1C1C1E] flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-8 border border-neutral-800 shadow-xl">
        {loading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-400">{t("invitations.processing")}</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">
              {t("common.error")}
            </h2>
            <p className="text-neutral-400 mb-6">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-brand-primary hover:bg-brand-primaryLight text-neutral-100 font-semibold px-6 py-3 rounded-lg"
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        ) : needsLogin ? (
          <div className="text-center">
            <div className="text-green-400 text-xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">
              {t("invitations.joinedTitle")}
            </h2>
            <p className="text-neutral-400 mb-6">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-brand-primary hover:bg-brand-primaryLight text-neutral-100 font-semibold px-6 py-3 rounded-lg"
            >
              {t("auth.loginNow")}
            </button>
          </div>
        ) : needsRegistration ? (
          <div className="text-center">
            <div className="text-brand-primary text-xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">
              {t("invitations.joinPoolTitle")}
            </h2>
            <p className="text-neutral-400 mb-6">{message}</p>
            <p className="text-neutral-500 text-sm mb-6">
              {t("invitations.yourEmail")}: <strong>{invitationEmail}</strong>
            </p>
            <button
              onClick={() =>
                navigate(
                  `/login?tab=register&email=${encodeURIComponent(invitationEmail)}`,
                )
              }
              className="bg-brand-primary hover:bg-brand-primaryLight text-neutral-100 font-semibold px-6 py-3 rounded-lg"
            >
              {t("auth.createAccount")}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-400 text-xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-neutral-100 mb-2">
              {t("common.success")}
            </h2>
            <p className="text-neutral-400 mb-6">{message}</p>
            <p className="text-neutral-500 text-sm">
              {t("invitations.redirectingToLogin")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
