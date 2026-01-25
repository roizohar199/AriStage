import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Search, UserCheck, UserPlus } from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { Mail, User, Star } from "lucide-react";
import BaseModal from "@/modules/shared/components/BaseModal.tsx";
import { normalizeSubscriptionType } from "@/modules/shared/hooks/useSubscription.ts";

export default function Users() {
  const confirm = useConfirm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
    subscription_type: "trial",
  });

  const [search, setSearch] = useState("");
  const [connectedArtists, setConnectedArtists] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users");
      setUsers(data);
    } catch (err) {
      console.error("❌ שגיאה בשליפת משתמשים:", err);
      setError("שגיאה טעינת משתמשים");
    } finally {
      setLoading(false);
    }
  };

  const loadConnectedArtists = async () => {
    try {
      const { data } = await api.get("/users/connected-to-me", {
        skipErrorToast: true,
      });
      setConnectedArtists(data || []);
    } catch (err) {
      console.error("שגיאה בטעינת אמנים מחוברים:", err);
    }
  };

  useEffect(() => {
    load();
    loadConnectedArtists();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      full_name: "",
      email: "",
      password: "",
      role: "user",
      subscription_type: "trial",
    });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingId(u.id);
    setForm({
      full_name: u.full_name || "",
      email: u.email,
      password: "",
      role: u.role,
      subscription_type: normalizeSubscriptionType(u.subscription_type),
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, {
          full_name: form.full_name,
          role: form.role,
          subscription_type: form.subscription_type,
        });
      } else {
        await api.post("/users", form);
      }

      setShowModal(false);
      load();
    } catch (err) {
      console.error("❌ שגיאה בשמירת משתמש:", err);
      setError("שגיאה בשמירת הנתונים");
    }
  };

  const removeUser = async (id) => {
    const ok = await confirm({
      title: "מחיקה",
      message: "בטוח למחוק משתמש זה?",
    });
    if (!ok) return;

    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (err) {
      console.error("❌ שגיאה במחיקה:", err);
    }
  };

  const impersonateUser = async (id) => {
    const ok = await confirm({
      title: "ייצוג משתמש",
      message: "להיכנס לחשבון שלו?",
    });
    if (!ok) return;

    try {
      // 🟧 מונע מ-ProtectedRoute לזרוק בזמן שינוי המשתמש
      localStorage.setItem("ari_auth_lock", "1");

      const { data } = await api.post(`/users/${id}/impersonate`);

      // 🟦 לוקחים את המשתמש והטוקן הקיימים
      const rawUser = localStorage.getItem("ari_user");
      const rawToken = localStorage.getItem("ari_token");

      // 🟪 שומרים אותם פעם אחת בלבד (חשוב!)
      if (!localStorage.getItem("ari_original_user")) {
        localStorage.setItem("ari_original_user", rawUser);
        localStorage.setItem("ari_original_token", rawToken);
      }

      // 🟩 מציבים את המשתמש המיוצג
      localStorage.setItem("ari_user", JSON.stringify(data.user));
      localStorage.setItem("ari_token", data.token);

      // 🟦 עדכון axios באופן מיידי
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      // 🟧 מחכים שניה ואז מסירים את הנעילה
      setTimeout(() => {
        localStorage.removeItem("ari_auth_lock");

        // ✔️ חשוב: הולכים ל־/home — לא ל־"/"
        window.location.replace("/home");
      }, 150);
    } catch (err) {
      console.error("❌ שגיאה בייצוג:", err);
      localStorage.removeItem("ari_auth_lock"); // למקרה שנפל באמצע
    }
  };

  const inviteArtist = async (artistId, artistName) => {
    const ok = await confirm({
      title: "הזמנת אמן",
      message: `להזמין את ${artistName} למאגר שלך? האמן יוכל לצפות בליינאפים והשירים שלך (קריאה בלבד).`,
    });
    if (!ok) return;

    try {
      await api.post("/users/invite-artist", { artist_id: artistId });
      loadConnectedArtists(); // רענון רשימת האמנים המחוברים
    } catch (err) {
      console.error("❌ שגיאה בהזמנת אמן:", err);
      const errorMsg = err?.response?.data?.message || "שגיאה בהזמנת האמן";
      alert(errorMsg);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()),
  );

  // בדיקה אם משתמש כבר מוזמן למאגר שלי
  const isArtistInvited = (userId) => {
    return connectedArtists.some((artist) => artist.id === userId);
  };

  if (loading)
    return (
      <div className="text-center text-neutral-400 p-6">טוען משתמשים...</div>
    );

  return (
    <div className="min-h-screen text-neutral-100 p-6">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">ניהול משתמשים</h1>

        <button
          onClick={openCreate}
          // Semantic animation: buttons use `animation-press`
          className="bg-brand-primary hover:bg-brand-primaryLight text-black font-semibold rounded-full p-2 flex items-center justify-center animation-press"
        >
          <Plus size={18} />
        </button>
      </header>

      {/* SEARCH */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="חפש לפי שם, אימייל או תפקיד..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 pl-10 text-sm placeholder-neutral-500"
        />
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
      </div>

      {/* USER LIST — כרטיס כמו ליינאפ */}
      <div className="space-y-3">
        {filteredUsers.map((u, i) => (
          <div
            key={u.id}
            // Semantic animation: cards use `animation-hover`
            className="bg-neutral-900 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg border border-neutral-800 animation-hover"
          >
            {/* LEFT SIDE */}
            <div>
              <p className="font-semibold text-lg">
                {i + 1}. {u.full_name}
              </p>

              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {/* אימייל */}
                <span className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                  <Mail size={14} /> {u.email}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {/* תפקיד */}
                <span className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-brand-primary rounded-lg text-black font-semibold">
                  <User size={14} /> {u.role}
                </span>

                {/* מנוי */}
                <span className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-brand-primary rounded-lg text-black font-semibold">
                  <Star size={14} />
                  {normalizeSubscriptionType(u.subscription_type)}
                </span>

                {/* אינדיקציה אם האמן כבר מוזמן */}
                {isArtistInvited(u.id) && (
                  <span className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-green-600 rounded-lg text-neutral-100 font-semibold">
                    <UserCheck size={14} /> מוזמן
                  </span>
                )}
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 flex-row-reverse">
              <button
                onClick={() => removeUser(u.id)}
                className="bg-red-500 hover:bg-red-600 p-2 rounded-full"
              >
                <Trash2 size={16} />
              </button>

              <button
                onClick={() => openEdit(u)}
                className="bg-neutral-700 hover:bg-neutral-600 p-2 rounded-full"
              >
                <Edit2 size={16} />
              </button>

              <button
                onClick={() => impersonateUser(u.id)}
                className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full"
              >
                <UserCheck size={16} />
              </button>

              {/* כפתור הזמנת אמן - רק אם המשתמש לא מוזמן כבר */}
              {!isArtistInvited(u.id) && (
                <button
                  onClick={() => inviteArtist(u.id, u.full_name)}
                  className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
                  title="הזמן אמן למאגר שלך"
                >
                  <UserPlus size={16} />
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <p className="text-neutral-500 text-center mt-10">אין משתמשים 😴</p>
        )}
      </div>

      {/* MODAL */}
      <BaseModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
        }}
        title={editingId ? "עריכת משתמש" : "משתמש חדש"}
        maxWidth="max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">
          {editingId ? "עריכת משתמש" : "משתמש חדש"}
        </h2>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            placeholder="שם מלא *"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm focus:border-orange-500 outline-none"
            required
          />

          <input
            type="email"
            placeholder="אימייל *"
            dir="ltr"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!!editingId}
            className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm focus:border-orange-500 outline-none"
            required={!editingId}
          />

          {!editingId && (
            <input
              type="password"
              placeholder="סיסמה *"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm focus:border-orange-500 outline-none"
              required
            />
          )}

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm focus:border-orange-500 outline-none"
          >
            {/* manager חולק חלק מההרשאות המוגבהות בצד השרת (مثل יצירת משתמשים
                וצפייה ברשימת כל המשתמשים), גם אם כרגע אין לו ממשק ניהול
                נפרד בצד הלקוח. */}
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>

          <select
            value={form.subscription_type}
            onChange={(e) =>
              setForm({ ...form, subscription_type: e.target.value })
            }
            className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm focus:border-orange-500 outline-none"
          >
            <option value="trial">Trial</option>
            <option value="pro">Pro</option>
          </select>

          <button
            type="submit"
            // Semantic animation: buttons use `animation-press`
            className="w-full bg-brand-primary hover:bg-brand-primaryLight text-black font-semibold py-2 rounded-lg mt-2 animation-press"
          >
            {editingId ? "עדכון" : "שמור"}
          </button>
        </form>
      </BaseModal>
    </div>
  );
}
