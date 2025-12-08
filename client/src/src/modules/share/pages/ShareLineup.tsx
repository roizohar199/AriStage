import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  Music4Icon,
  MoreHorizontal,
  Printer,
  FileDown,
} from "lucide-react";
import api from "@/modules/shared/lib/api.js";

// ⭐ Socket.IO
import { io } from "socket.io-client";

// ⭐ פונקציות עזר לתאריך ושעה
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL");
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

// ⭐ פירוק זמן
const parseDuration = (d) => {
  if (!d) return 0;
  const str = String(d);

  if (!str.includes(":")) {
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  }

  const parts = str.split(":").map((n) => Number(n) || 0);

  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  return 0;
};

export default function ShareLineup() {
  const { id } = useParams();

  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // ⭐ כאן מדביקים!
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL || "http://10.0.0.99:5000";
    return io(url, { transports: ["websocket"] });
  }, []);

  // ⭐ טוען ליינאפ
  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const { data } = await api.get(`/lineups/public/${id}`);
      setLineup(data);
    } catch (err) {
      console.error(err);
      setError("הליינאפ לא נמצא או שהקישור לא תקין");
    } finally {
      setLoading(false);
    }
  };

  // ⭐ הצטרפות לחדר והאזנה לעדכונים בזמן אמת
  useEffect(() => {
    if (!lineup) return;

    socket.emit("join-lineup", lineup.id);

    socket.on("lineup-updated", () => {
      load(); // רענון אוטומטי
    });

    return () => {
      socket.off("lineup-updated"); // ❗שמרים מאזין
      // socket.disconnect(); ❌ להסיר! לא סוגרים חיבור כאן
    };
  }, [lineup]);

  // ⭐ חישוב זמן כולל
  const totalDuration = useMemo(() => {
    if (!lineup?.songs) return "0:00";

    const totalSec = lineup.songs.reduce(
      (sum, s) => sum + parseDuration(s.duration_sec),
      0
    );

    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [lineup]);

  if (loading)
    return (
      <div className="text-center pt-20 text-gray-400 text-lg">טוען...</div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 text-xl">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 flex flex-col items-center">
      {/* כרטיס ליינאפ */}
      <div className="w-full max-w-2xl bg-neutral-900/70 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl relative">
        {/* ⭐ תפריט הדפסה / PDF */}
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="bg-neutral-900 hover:bg-neutral-800 p-2 rounded-full border border-neutral-800"
            >
              <MoreHorizontal size={18} />
            </button>

            {menuOpen && (
              <div className="absolute left-0 top-10 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg py-2 z-50 w-40">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    window.print();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-800 text-right"
                >
                  <Printer size={16} /> הדפס
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    alert("PDF בתהליך פיתוח 💛");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-800 text-right"
                >
                  <FileDown size={16} /> הורד PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* כותרת */}
        <h1 className="text-3xl font-bold mb-2 text-right">{lineup.title}</h1>

        {/* פרטים */}
        <div className="text-right text-gray-300 mb-6 leading-relaxed">
          {lineup.date && (
            <p>
              <span className="font-semibold">תאריך:</span>{" "}
              {formatDate(lineup.date)}
            </p>
          )}

          {lineup.time && (
            <p>
              <span className="font-semibold">שעה:</span>{" "}
              {formatTime(lineup.time)}
            </p>
          )}

          {lineup.location && (
            <p>
              <span className="font-semibold">מקום:</span> {lineup.location}
            </p>
          )}

          {lineup.description && (
            <p className="mt-2 text-gray-400">{lineup.description}</p>
          )}
        </div>

        {/* ⭐ זמן כולל + מספר שירים */}
        <div className="flex flex-row-reverse items-center gap-3 mb-6 justify-end">
          <div className="flex items-center gap-1 px-3 py-1 bg-brand-orange rounded-lg flex flex-row-reverse text-black shadow-sm">
            <Clock size={14} /> {totalDuration}
          </div>

          <div className="flex items-center gap-1 px-3 py-1 bg-brand-orange rounded-lg flex flex-row-reverse text-black shadow-sm">
            <Music4Icon size={14} /> {lineup.songs.length} שירים
          </div>
        </div>

        {/* רשימת שירים */}
        <h2 className="text-xl font-semibold mb-4 text-right text-orange-400">
          רשימת שירים
        </h2>

        <div className="space-y-3">
          {lineup.songs?.map((song, idx) => (
            <div
              key={song.lineup_song_id}
              className="flex flex-row-reverse items-center justify-between bg-neutral-900/80 border border-white/10 rounded-xl p-4 shadow-sm"
            >
              {/* מידע */}
              <div className="text-right flex-1">
                <p className="font-bold text-lg text-white">{song.title}</p>

                <p className="text-sm text-gray-400 mt-1">
                  אמן: {song.artist || "לא מוגדר"}
                </p>

                <div className="flex flex-wrap gap-2 mt-2 text-xs font-medium">
                  <span className="px-2 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200">
                    BPM: {song.bpm ?? "-"}
                  </span>

                  <span className="px-2 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200">
                    סולם: {song.key_sig ?? "-"}
                  </span>

                  <span className="px-2 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200">
                    זמן: {song.duration_sec ?? "-"}
                  </span>
                </div>

                {/* ⭐ תגית שיר */}
                {song.notes && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs bg-brand-orange rounded-lg text-black font-semibold">
                      {song.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* מספר שיר */}
              <div className="text-orange-400 text-3xl font-bold ml-4 min-w-[38px] text-center">
                {idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
