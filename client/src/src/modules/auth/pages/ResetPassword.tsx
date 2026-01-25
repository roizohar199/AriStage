import React, { useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/modules/shared/lib/api.js";
import { emitToast } from "@/modules/shared/lib/toastBus.js";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      return setError("הסיסמאות אינן תואמות");
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/reset-password", {
        token,
        password,
      });

      // 🔥 במקום הודעה ירוקה — Toast למעלה
      emitToast(data.message || "הסיסמה עודכנה בהצלחה!", "success");
    } catch (err) {
      setError(err?.response?.data?.message || "שגיאה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-900 text-neutral-100 px-4">
      <div className="w-full max-w-sm bg-neutral-800 border border-neutral-700 p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-brand-primary text-center mb-4">
          איפוס סיסמה
        </h2>

        {/* ❌ רק שגיאות מוצגות בדף */}
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-100/5 border border-neutral-100/10 p-2 rounded-xl text-sm"
          />

          <input
            type="password"
            placeholder="אימות סיסמה"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-neutral-100/5 border border-neutral-100/10 p-2 rounded-xl text-sm"
          />

          <button
            disabled={loading}
            className="w-full bg-brand-primary text-black font-bold py-2 rounded-xl"
          >
            {loading ? "מעדכן..." : "עדכן סיסמה"}
          </button>
        </form>

        <p className="text-center text-neutral-500 text-xs mt-6">
          ⚡ Ari Stage 2025
        </p>
      </div>
    </div>
  );
}
