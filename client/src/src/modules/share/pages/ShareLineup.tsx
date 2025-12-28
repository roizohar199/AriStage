import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Clock,
  Music4Icon,
  MoreHorizontal,
  Printer,
  FileDown,
} from "lucide-react";
import CardSong from "../../shared/components/cardsong";
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

const safeKey = (key) => {
  if (!key) return "N/A";
  const normalized = String(key).trim();
  return normalized || "N/A";
};

const safeDuration = (duration) => {
  const totalSec = parseDuration(duration);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const normalizeNotes = (song) => {
  if (!song) return null;
  const candidates = [
    song.notes,
    song.lineup_note,
    song.song_note,
    song.note,
    song.tag,
    song.label,
    song.comment,
  ];
  const firstNonEmpty = candidates.find((value) => {
    if (value === undefined || value === null) return false;
    const str = String(value).trim();
    return str.length > 0;
  });
  return firstNonEmpty !== undefined && firstNonEmpty !== null
    ? String(firstNonEmpty).trim()
    : null;
};

export default function ShareLineup() {
  const { id } = useParams();

  const [lineup, setLineup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // ⭐ כאן מדביקים!
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      console.error("VITE_API_URL is not defined");
      return null;
    }
    return io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
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
    if (!lineup || !socket) return;

    socket.emit("join-lineup", lineup.id);

    socket.on("lineup-updated", () => {
      load(); // רענון אוטומטי
    });

    return () => {
      if (socket) {
        socket.off("lineup-updated"); // ❗שמרים מאזין
        // socket.disconnect(); ❌ להסיר! לא סוגרים חיבור כאן
      }
    };
  }, [lineup, socket]);

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
    <div className="min-h-screen text-white p-4 flex flex-col items-center">
      {/* כרטיס ליינאפ */}
      <div className="w-full border border-neutral-800 rounded-2xl p-6 relative">
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
        <div className="flex justify-between items-center w-full gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-2xl text-brand-orange font-bold text-sm">
              <Music4Icon size={14} /> {lineup.songs.length} שירים
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-2xl text-brand-orange font-bold text-sm">
              <Clock size={14} /> {totalDuration}
            </div>
          </div>
          {/* ⭐ תפריט הדפסה / PDF */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="bg-neutral-800 p-2 rounded-full"
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div className="absolute left-0 top-10 bg-neutral-800 rounded-2xl shadow-lg z-50 min-w-max">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      window.print();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:text-brand-orange"
                  >
                    <Printer size={16} /> הדפס
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3" dir="rtl">
          {lineup.songs?.map((song, idx) => (
            <CardSong
              key={song.lineup_song_id ?? song.song_id ?? idx}
              song={{
                id: song.song_id ?? song.id ?? song.lineup_song_id ?? idx,
                title: song.title,
                artist: song.artist,
                bpm: song.bpm,
                key_sig: song.key_sig,
                duration_sec: song.duration_sec,
                notes: normalizeNotes(song),
                is_owner: false,
              }}
              index={idx}
              safeKey={safeKey}
              safeDuration={safeDuration}
              onEdit={() => {}}
              onRemove={() => {}}
              chartsComponent={null}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
