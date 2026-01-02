import React, { useState, useEffect } from "react";
import api from "@/modules/shared/lib/api.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

export default function Login() {
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
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (tabFromUrl === "register") setTab("register");
    if (tabFromUrl === "reset") setTab("reset");
  }, [tabFromUrl]);

  const handleLogin = async (e) => {
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
    } catch (err) {
      setError(err?.response?.data?.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------
       REGISTER – FormData + role + avatar
  -------------------------------------------- */
  const handleRegister = async (e) => {
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
      return setError("נא להזין שם מלא");
    }
    if (password !== confirm) {
      console.log("❌ [REGISTER] הסיסמאות לא תואמות");
      return setError("הסיסמאות אינן תואמות");
    }
    if (!agreed) {
      console.log("❌ [REGISTER] לא אישר את התקנון");
      return setError("יש לאשר שקראת את התקנון");
    }

    try {
      setLoading(true);
      console.log("🟡 [REGISTER] בונה FormData...");

      const form = new FormData();
      form.append("full_name", full_name);
      form.append("email", email);
      form.append("password", password);
      form.append("artist_role", role);
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

      setMessage("נרשמת בהצלחה! אפשר להתחבר כעת.");
      setTab("login");

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirm("");
      setRole("");
      setAvatar(null);
      setPreview(null);
      setAgreed(false);
    } catch (err) {
      console.error("❌ [REGISTER] שגיאה!", {
        error: err,
        response: err?.response,
        data: err?.response?.data,
        status: err?.response?.status,
        message: err?.response?.data?.message || err?.message,
      });
      setError(err?.response?.data?.message || err?.message || "שגיאה בהרשמה");
    } finally {
      setLoading(false);
      console.log("🟢 [REGISTER] סיימתי");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);
      const { data } = await api.post("/auth/reset-request", { email });
      setMessage(data.message || "נשלח מייל לאיפוס אם המשתמש קיים");
    } catch (err) {
      setError(err?.response?.data?.message || "שגיאה בעת שליחת האיפוס");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (tab) {
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="name@example.com"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
              required
            />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
              required
            />
            <button
              disabled={loading}
              className="w-full cursor-pointer bg-brand-orange text-black font-semibold px-4 py-2 rounded-2xl shadow-innerIos transition text-sm"
            >
              {loading ? "מתחבר..." : "התחבר"}
            </button>

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
                    ללא תמונה
                  </div>
                )}
              </div>

              <label className="cursor-pointer bg-brand-orange text-black font-semibold px-4 py-2 rounded-2xl shadow-innerIos transition text-sm">
                העלאת תמונה
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setAvatar(file);
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setPreview(url);
                    }
                  }}
                />
              </label>
            </div>
            <input
              type="text"
              placeholder="שם מלא"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
              required
            />

            <input
              type="email"
              placeholder="name@example.com"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
              required
            />

            {/* ROLE */}
            <input
              type="text"
              placeholder="תפקיד (גיטריסט, בסיסט...)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
            />

            <input
              type="password"
              placeholder="בחר סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
              required
            />

            <input
              type="password"
              placeholder="אימות סיסמה"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
              required
            />

            <label className="flex items-center text-xs text-gray-300">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mr-2 m-2 accent-brand-orange"
                required
              />
              קראתי את התקנון
            </label>

            <button
              disabled={loading}
              className="w-full cursor-pointer bg-brand-orange text-black font-semibold px-4 py-2 rounded-2xl shadow-innerIos transition text-sm"
            >
              {loading ? "נרשם..." : "הרשמה"}
            </button>

            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {message && (
              <p className="text-green-400 text-sm mt-2">{message}</p>
            )}
          </form>
        );

      case "reset":
        return (
          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="email"
              placeholder="name@example.com"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-800 rounded-2xl px-3 py-2 text-sm text-white"
              required
            />
            <button className="w-full cursor-pointer bg-brand-orange text-black font-semibold px-4 py-2 rounded-2xl shadow-innerIos transition text-sm">
              שלח קישור לאיפוס סיסמה
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {message && (
              <p className="text-green-400 text-sm mt-2">{message}</p>
            )}
          </form>
        );
    }
  };

  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center min-h-screen text-white"
    >
      <div className="w-full max-w-sm bg-neutral-950/50 p-6 text-center rounded-2xl backdrop-blur-xl">
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-brand-orange">Ari Stage</h1>
          <p className="text-sm text-gray-400 mt-1">
            התחבר או הירשם כדי לנהל את הליינאפ שלך
          </p>
        </div>

        <div className="bg-neutral-800 flex rounded-2xl mb-6 overflow-hidden">
          {["login", "register", "reset"].map((t) => (
            <button
              key={t}
              className={`flex-1 py-2 font-semibold ${
                tab === t
                  ? "border-b-2 border-brand-orange overflow-hidden text-brand-orange"
                  : "text-white"
              }`}
              onClick={() => {
                setError("");
                setMessage("");
                setTab(t);
              }}
            >
              {t === "login" && "התחברות"}
              {t === "register" && "הרשמה"}
              {t === "reset" && "איפוס סיסמה"}
            </button>
          ))}
        </div>

        {renderForm()}
      </div>
    </div>
  );
}
