import React, { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import ContactForm from "@/modules/shared/components/ContactForm.jsx";

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    newPass: "",
    theme: localStorage.getItem("theme") || "dark",
    artist_role: "",
    avatar: null, // קובץ תמונה חדש
  });

  const [preview, setPreview] = useState(null); // תצוגה מקדימה
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // 📥 טעינת פרטי משתמש
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/users/me");

        setForm((f) => ({
          ...f,
          full_name: data.full_name || "",
          email: data.email || "",
          theme: data.theme || localStorage.getItem("theme") || "dark",
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
  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("full_name", form.full_name);
      fd.append("email", form.email);
      fd.append("theme", form.theme);
      fd.append("artist_role", form.artist_role);

      if (form.avatar instanceof File) {
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

      // עדכון משתמש ב-localStorage
      const { data: userData } = await api.get("/users/me");
      localStorage.setItem("ari_user", JSON.stringify(userData));

      // עדכון כל הקומפוננטות דרך custom event
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "user", action: "updated" },
        })
      );
      window.dispatchEvent(
        new CustomEvent("user-updated", { detail: userData })
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "שגיאה בעדכון הנתונים");
    } finally {
      setSaving(false);
    }
  };

  // 🚪 התנתקות
  const handleLogout = () => {
    logout(); // This clears state and localStorage
    navigate("/login");
  };

  if (loading)
    return <div className="text-center text-neutral-400 p-6">טוען...</div>;

  return (
    <div dir="rtl" className="min-h-screen text-white p-6">
      {/* כותרת עליונה */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">הגדרות מערכת</h1>

        <button
          onClick={handleLogout}
          className="bg-neutral-900 px-4 py-2 rounded-2xl backdrop-blur-xl text-white flex flex-row-reverse items-center gap-2"
        >
          <LogOut size={18} /> התנתק
        </button>
      </header>

      {/* כרטיס מרכזי - זהה למבנה Home */}
      <div className="space-y-1 rounded-2xl flex flex-col ">
        {/* טופס הגדרות */}
        <form
          onSubmit={submit}
          className="space-y-4 bg-neutral-800 rounded-2xl p-6"
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

            <label className="cursor-pointer bg-brand-orange text-black font-semibold px-4 py-2 rounded-2xl shadow-innerIos transition text-sm">
              החלף תמונה
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setForm({ ...form, avatar: file });
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>

          {/* שם מלא */}
          <div>
            <label className="block text-sm mb-1">שם מלא</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-neutral-700 p-2 rounded-2xl text-sm outline-none"
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
              className="w-full bg-neutral-700 p-2 rounded-2xl text-sm outline-none"
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
              className="w-full bg-neutral-700 p-2 rounded-2xl text-sm outline-none"
            />
          </div>

          {/* סיסמה חדשה */}
          <div>
            <label className="block text-sm mb-1">סיסמה חדשה</label>
            <input
              type="password"
              value={form.newPass}
              onChange={(e) => setForm({ ...form, newPass: e.target.value })}
              placeholder="לא חובה"
              className="w-full bg-neutral-700 p-2 rounded-2xl text-sm outline-none"
            />
          </div>

          {/* כפתור שמירה */}
          <button
            type="submit"
            disabled={saving}
            className="w-full cursor-pointer bg-brand-orange text-black font-semibold px-4 py-2 rounded-2xl shadow-innerIos transition text-sm"
          >
            {saving ? "שומר..." : "שמור שינויים"}
          </button>
        </form>

        {/* שאר העמוד — ללא שינוי */}
        {/* ... כל שאר הקומפוננט כפי ששלחת נשאר אותו דבר ... */}
      </div>
    </div>
  );
}
