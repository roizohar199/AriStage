import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Clock, Music4Icon, MoreHorizontal, Printer } from "lucide-react";
import CardSong from "../../shared/components/cardsong";
import api from "@/modules/shared/lib/api.ts";
import { API_ORIGIN } from "@/config/apiConfig";

// ⭐ Socket.IO
import { io } from "socket.io-client";

// ⭐ פונקציות עזר לתאריך ושעה
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL");
}

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

// ⭐ פירוק זמן
const parseDuration = (d?: string | number | null): number => {
  if (!d) return 0;
  const str = String(d);

  if (!str.includes(":")) {
    const num = Number(str);
    return Number.isNaN(num) ? 0 : num;
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

const safeKey = (key: unknown): string => {
  if (!key) return "N/A";
  const normalized = String(key).trim();
  return normalized || "N/A";
};

const safeDuration = (duration: unknown): string => {
  const totalSec = parseDuration(duration);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

type ShareLineupSong = {
  lineup_song_id?: number | null;
  song_id?: number | null;
  id?: number | null;
  title?: string | null;
  artist?: string | null;
  bpm?: number | string | null;
  key_sig?: string | null;
  duration_sec?: string | number | null;
  notes?: string | null;
  lineup_note?: string | null;
  song_note?: string | null;
  note?: string | null;
  tag?: string | null;
  label?: string | null;
  comment?: string | null;
};

type ShareLineupResponse = {
  id: number;
  title: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  description?: string | null;
  songs: ShareLineupSong[];
};

const normalizeNotes = (
  song: ShareLineupSong | null | undefined,
): string | null => {
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
  const { id } = useParams<{ id: string }>();

  const [lineup, setLineup] = useState<ShareLineupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // ⭐ כאן מדביקים!
  const socket = useMemo(() => {
    return io(API_ORIGIN, {
      transports: ["websocket", "polling"],
      withCredentials: true,
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
    if (!id) {
      setError("הליינאפ לא נמצא או שהקישור לא תקין");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/lineups/public/${id}`);
      setLineup(data as ShareLineupResponse);
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
      0,
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
        <h1 className="text-3xl font-bold mb-2 text-start">{lineup.title}</h1>

        {/* פרטים */}
        <div className="text-start text-gray-300 mb-6 leading-relaxed">
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
              <Clock size={14} />
              <span
                dir="ltr"
                style={{ unicodeBidi: "isolate" }}
                className="tabular-nums"
              >
                {totalDuration}
              </span>
            </div>
          </div>
          {/* ⭐ תפריט הדפסה / PDF */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="bg-neutral-800 p-2 rounded-full hover:bg-neutral-700/50 "
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div
                  className="absolute top-10 bg-neutral-800 rounded-2xl shadow-lg z-50 min-w-max"
                  style={{ insetInlineStart: 0 }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      window.print();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-700/50 rounded-2xl"
                  >
                    <Printer size={16} /> הדפס
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
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
