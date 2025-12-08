import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/modules/shared/lib/api.js";

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [invitationEmail, setInvitationEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setError("קישור הזמנה לא תקין");
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
        setMessage("הצטרפת בהצלחה למאגר! אנא התחבר כדי להמשיך.");
      } else if (data.needsRegistration) {
        setNeedsRegistration(true);
        setInvitationEmail(data.email);
        setMessage("הצטרף למאגר על ידי יצירת חשבון חדש.");
      } else {
        setMessage(data.message || "הצטרפת בהצלחה למאגר!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "שגיאה בטיפול בהזמנה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#121212] to-[#1C1C1E] flex items-center justify-center p-4"
    >
      <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-8 border border-neutral-800 shadow-xl">
        {loading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-400">מטפל בהזמנה...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">שגיאה</h2>
            <p className="text-neutral-400 mb-6">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold px-6 py-3 rounded-lg"
            >
              חזרה להתחברות
            </button>
          </div>
        ) : needsLogin ? (
          <div className="text-center">
            <div className="text-green-400 text-xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">הצטרפת למאגר!</h2>
            <p className="text-neutral-400 mb-6">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold px-6 py-3 rounded-lg"
            >
              התחבר עכשיו
            </button>
          </div>
        ) : needsRegistration ? (
          <div className="text-center">
            <div className="text-brand-orange text-xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold text-white mb-2">הצטרף למאגר</h2>
            <p className="text-neutral-400 mb-6">{message}</p>
            <p className="text-neutral-500 text-sm mb-6">
              האימייל שלך: <strong>{invitationEmail}</strong>
            </p>
            <button
              onClick={() => navigate(`/login?tab=register&email=${encodeURIComponent(invitationEmail)}`)}
              className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold px-6 py-3 rounded-lg"
            >
              צור חשבון חדש
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-green-400 text-xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">הצלחה!</h2>
            <p className="text-neutral-400 mb-6">{message}</p>
            <p className="text-neutral-500 text-sm">מעביר לדף ההתחברות...</p>
          </div>
        )}
      </div>
    </div>
  );
}

