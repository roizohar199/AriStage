import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  MapPin,
  CalendarDays,
  Clock,
  X,
  Pencil,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/modules/shared/lib/api.js";
import { useConfirm } from "@/modules/shared/hooks/useConfirm.jsx";
import { io } from "socket.io-client";

export default function Lineup() {
  const { confirm, ConfirmModalComponent } = useConfirm();

  const [lineups, setLineups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  // Socket.IO connection
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL || "http://10.0.0.99:5000";
    return io(url, { transports: ["websocket"] });
  }, []);

  // -------------------------------------------------
  // פונקציות המרה לתאריך ושעה
  // -------------------------------------------------

  const normalizeDate = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj)) return "";
    return dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const normalizeTime = (t) => {
    if (!t) return "";
    return t.toString().slice(0, 5); // HH:MM
  };

  const formatForDisplay = (d) => {
    if (!d) return "לא צוין תאריך";
    const dateObj = new Date(d);
    if (isNaN(dateObj)) return "לא צוין תאריך";
    return dateObj.toLocaleDateString("he-IL"); // DD/MM/YYYY
  };

  // -------------------------------------------------
  // טעינת ליינאפים
  // -------------------------------------------------

  const load = async () => {
    try {
      const { data } = await api.get("/lineups");
      setLineups(data);
    } catch (err) {
      console.error("❌ שגיאה בטעינת ליינאפים:", err);
    }
  };

  useEffect(() => {
    load();
    
    // הצטרפות ל-rooms של Socket.IO
    const user = JSON.parse(localStorage.getItem("ari_user") || "{}");
    if (user?.id) {
      socket.emit("join-user", user.id);
      socket.emit("join-lineups", user.id);
      
      // בדיקה אם המשתמש הוא אורח או מארח
      api.get("/users/check-guest", { skipErrorToast: true })
        .then(({ data }) => {
          if (data.isHost) {
            socket.emit("join-host", user.id);
          }
          if (data.hostId) {
            socket.emit("join-host", data.hostId);
          }
        })
        .catch(() => {});
    }
    
    // Socket.IO listeners
    socket.on("lineup:created", () => {
      load(); // רענון רשימה
    });
    
    socket.on("lineup:updated", ({ lineupId }) => {
      load(); // רענון רשימה
    });
    
    socket.on("lineup:deleted", ({ lineupId }) => {
      setLineups((prev) => prev.filter((l) => l.id !== lineupId));
    });
    
    // האזנה ל-custom events לעדכון אוטומטי אחרי כל פעולה
    const handleDataRefresh = (event) => {
      const { type, action } = event.detail || {};
      if (type === "lineup") {
        load(); // רענון רשימת ליינאפים
      }
    };
    
    window.addEventListener("data-refresh", handleDataRefresh);
    
    return () => {
      socket.off("lineup:created");
      socket.off("lineup:updated");
      socket.off("lineup:deleted");
      window.removeEventListener("data-refresh", handleDataRefresh);
      socket.disconnect();
    };
  }, [socket]);

  // -------------------------------------------------
  // יצירה
  // -------------------------------------------------

  const openCreateModal = () => {
    setForm({ title: "", date: "", time: "", location: "", description: "" });
    setIsEditing(false);
    setEditId(null);
    setShowModal(true);
  };

  // -------------------------------------------------
  // עריכה — כולל המרה מתקנת
  // -------------------------------------------------

  const openEditModal = (lineup) => {
    setForm({
      title: lineup.title || "",
      date: normalizeDate(lineup.date),
      time: normalizeTime(lineup.time),
      location: lineup.location || "",
      description: lineup.description || "",
    });

    setEditId(lineup.id);
    setIsEditing(true);
    setShowModal(true);
  };

  // -------------------------------------------------
  // שמירה (יצירה/עריכה)
  // -------------------------------------------------

  const submit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) return;

    try {
      if (isEditing && editId) {
        await api.put(`/lineups/${editId}`, form);
      } else {
        await api.post("/lineups", form);
      }

      setShowModal(false);
      setIsEditing(false);
      setEditId(null);
      // רענון מיידי
      load();
      // עדכון כל הקומפוננטות דרך custom event
      window.dispatchEvent(new CustomEvent("data-refresh", { detail: { type: "lineup", action: isEditing ? "updated" : "created" } }));
    } catch (err) {
      console.error("❌ שגיאה בשמירת ליינאפ:", err);
    }
  };

  // -------------------------------------------------
  // מחיקה
  // -------------------------------------------------

  const remove = async (id) => {
    const ok = await confirm("מחיקה", "בטוח למחוק את הליינאפ?");
    if (!ok) return;

    try {
      await api.delete(`/lineups/${id}`);
      // רענון מיידי
      load();
      // עדכון כל הקומפוננטות דרך custom event
      window.dispatchEvent(new CustomEvent("data-refresh", { detail: { type: "lineup", action: "deleted" } }));
    } catch (err) {
      console.error("❌ שגיאה במחיקת ליינאפ:", err);
    }
  };

  // -------------------------------------------------
  // סינון
  // -------------------------------------------------

  const filteredLineups = lineups.filter(
    (l) =>
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.location?.toLowerCase().includes(search.toLowerCase()) ||
      l.date?.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase())
  );

  // -------------------------------------------------
  // UI
  // -------------------------------------------------

  return (
    <div dir="rtl" className="min-h-screen text-white p-6">
      <ConfirmModalComponent />

      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">הליינאפ שלי</h1>

        <button
          onClick={openCreateModal}
          className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold rounded-full p-2 flex items-center justify-center transition-all"
        >
          <Plus size={18} />
        </button>
      </header>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="חפש לפי שם, מיקום, תאריך או תיאור..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 pl-10 text-sm placeholder-neutral-500"
        />

        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          size={18}
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredLineups.map((l, i) => (
          <div
            key={l.id}
            className="bg-neutral-900 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg transition border border-neutral-800"
            onClick={() => navigate(`/lineup/${l.id}`)}
          >
            <div>
              <p 
                className="font-semibold text-lg cursor-pointer"
                title={l.description || ""}
              >
                {i + 1}. {l.title}
              </p>

              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700 flex flex-row-reverse">
                  <CalendarDays size={14} /> {formatForDisplay(l.date)}
                </span>

                <span className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700 flex flex-row-reverse">
                  <Clock size={14} /> {normalizeTime(l.time) || "לא צוין שעה"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-brand-orange rounded-lg text-black font-semibold">
                  <MapPin size={14} /> {l.location || "לא צוין מיקום"}
                </span>
              </div>
            </div>

            {l.is_owner && (
              <div className="flex gap-3 flex-row-reverse">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(l.id);
                  }}
                  className="bg-red-500 hover:bg-red-600 p-2 rounded-full"
                >
                  <Trash2 size={16} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(l);
                  }}
                  className="bg-neutral-700 hover:bg-neutral-600 p-2 rounded-full"
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* If empty */}
        {filteredLineups.length === 0 && (
          <p className="text-neutral-500 text-center mt-10">
            אין ליינאפים עדיין 😴
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-6 relative shadow-xl border border-neutral-800">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 left-3 text-neutral-400 hover:text-white"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "עריכת ליינאפ" : "צור ליינאפ חדש"}
            </h2>

            <form onSubmit={submit} className="space-y-3">
              <input
                placeholder="שם הליינאפ *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm"
                required
              />

              {/* תאריך */}
              <div className="relative w-full">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-neutral-800 p-3 rounded-lg border border-neutral-700 text-sm text-white"
                />
                {!form.date && (
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                    תאריך
                  </div>
                )}
              </div>

              {/* שעה */}
              <div className="relative w-full mt-3">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-neutral-800 p-3 rounded-lg border border-neutral-700 text-sm text-white"
                />
                {!form.time && (
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                    שעה
                  </div>
                )}
              </div>

              <input
                placeholder="מיקום"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm"
              />

              <textarea
                placeholder="תיאור"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm resize-none"
                rows={3}
              />

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold py-2 rounded-lg mt-2 transition-all"
              >
                {isEditing ? "עדכון" : "שמור"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
