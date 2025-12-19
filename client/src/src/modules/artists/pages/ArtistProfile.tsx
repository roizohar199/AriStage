import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Music,
  ListMusic,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Clock,
  FileText,
  Eye,
  FileDown,
  Trash2,
  Upload,
  Search,
  X,
} from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useConfirm } from "@/modules/shared/hooks/useConfirm.jsx";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";

export default function ArtistProfile() {
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"lineups" | "songs">("lineups");
  const [searchTerm, setSearchTerm] = useState("");

  // Songs and charts
  interface Chart {
    id: number;
    file_path: string;
  }
  interface Song {
    id: number;
    title: string;
    artist: string;
    bpm: number;
    key_sig: string;
    duration_sec: number;
    notes?: string;
    owner_id?: number;
  }
  const [songs, setSongs] = useState<Song[]>([]);
  const [privateCharts, setPrivateCharts] = useState<Record<number, Chart[]>>(
    {}
  );
  const [viewingChart, setViewingChart] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // בדיקה אם המשתמש הוא אורח או מארח
      const { data: guestStatus } = await api.get("/users/check-guest", {
        skipErrorToast: true,
      });

      const currentUser = JSON.parse(localStorage.getItem("ari_user") || "{}");
      let targetArtist = null;
      let targetArtistId = null;

      if (id) {
        // אם יש id ב-URL, נשתמש בו
        targetArtistId = Number(id);
      } else if (guestStatus?.isGuest && guestStatus?.hostId) {
        // אם המשתמש הוא אורח, נציג את המארח שלו
        targetArtistId = guestStatus.hostId;
      } else if (guestStatus?.isHost) {
        // אם המשתמש הוא מארח, נציג את עצמו
        targetArtistId = currentUser.id;
      }

      if (!targetArtistId) {
        setError("אין לך גישה לפרופיל זה");
        return;
      }

      // בדיקת הרשאות - אם המשתמש הוא אורח, ודא שהוא מחובר למארח הזה
      if (guestStatus?.isGuest) {
        if (targetArtistId !== guestStatus.hostId) {
          setError("אין לך גישה לפרופיל זה");
          return;
        }
        // טעינת פרטי המארח דרך my-collection
        const { data: myCollection } = await api.get("/users/my-collection", {
          skipErrorToast: true,
        });

        // myCollection יכול להיות רשימה או אובייקט
        if (Array.isArray(myCollection)) {
          if (myCollection.length > 0) {
            targetArtist =
              myCollection.find((host) => host.id === targetArtistId) ||
              myCollection[0];
          }
        } else if (myCollection && myCollection.id === targetArtistId) {
          targetArtist = myCollection;
        } else if (myCollection) {
          // אם זה אובייקט אבל לא עם id, נשתמש בו בכל מקרה
          targetArtist = myCollection;
        }
      } else if (guestStatus?.isHost) {
        // אם המשתמש הוא מארח, הוא יכול לראות את עצמו או אמנים שהוזמנו אליו
        if (targetArtistId === currentUser.id) {
          // טעינת פרטי המשתמש הנוכחי
          const { data: myProfile } = await api.get("/users/me", {
            skipErrorToast: true,
          });
          targetArtist = myProfile;
        } else {
          // בדוק אם האמן הזה הוזמן למאגר של המשתמש
          const { data: myConnections } = await api.get(
            "/users/connected-to-me",
            {
              skipErrorToast: true,
            }
          );
          const invitedArtist =
            Array.isArray(myConnections) &&
            myConnections.find((artist) => artist.id === targetArtistId);

          if (!invitedArtist) {
            setError("אין לך גישה לפרופיל זה");
            return;
          }
          targetArtist = invitedArtist;
        }
      }

      if (!targetArtist) {
        setError("אמן לא נמצא");
        return;
      }

      setArtist(targetArtist);

      // טעינת ליינאפים של האמן המבוקש
      const { data: lineupsData } = await api.get(
        `/lineups/by-user/${targetArtistId}`,
        {
          skipErrorToast: true,
        }
      );
      setLineups(lineupsData || []);

      // טעינת שירים
      await loadSongs(targetArtistId);
    } catch (err) {
      console.error("שגיאה בטעינת נתונים:", err);
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        setError("אין לך גישה לפרופיל זה");
      } else {
        setError("לא ניתן לטעון את הנתונים");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load songs
  const loadSongs = async (artistId: number) => {
    try {
      const { data } = await api.get("/songs");
      // Filter songs by owner
      const artistSongs = data.filter((s: Song) => s.owner_id === artistId);
      setSongs(artistSongs);
    } catch (err) {
      console.error("שגיאה בטעינת שירים:", err);
    }
  };

  // Load private charts
  useEffect(() => {
    const loadCharts = async () => {
      const chartsMap: Record<number, Chart[]> = {};
      for (const song of songs) {
        try {
          const { data } = await api.get(`/songs/${song.id}/private-charts`);
          chartsMap[song.id] = data.charts || [];
        } catch (err) {
          console.error(`שגיאה בטעינת צ'ארטים לשיר ${song.id}:`, err);
        }
      }
      setPrivateCharts(chartsMap);
    };

    if (songs.length > 0) {
      loadCharts();
    }
  }, [songs]);

  // Chart handlers
  const handleUploadChart = async (songId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("chart", file);
      await api.post(`/songs/${songId}/private-charts`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("הקובץ הועלה בהצלחה", "success");
      const { data: charts } = await api.get(`/songs/${songId}/private-charts`);
      setPrivateCharts((prev) => ({ ...prev, [songId]: charts.charts || [] }));
    } catch (err) {
      showToast(err?.response?.data?.message || "שגיאה בהעלאת הקובץ", "error");
    }
  };

  const handleViewChart = (filePath: string) => {
    setViewingChart(filePath);
  };

  const handleDownloadChart = (filePath: string, songTitle: string) => {
    const link = document.createElement("a");
    link.href = filePath;
    link.download = `${songTitle}-chart.pdf`;
    link.click();
  };

  const handleDeletePrivateChart = async (songId: number, chartId: number) => {
    const ok = await confirm("מחיקת צ'ארט", "בטוח שאתה רוצה למחוק את הצ'ארט?");
    if (!ok) return;
    try {
      await api.delete(`/songs/${songId}/private-charts/${chartId}`);
      showToast("הצ'ארט נמחק בהצלחה", "success");
      setPrivateCharts((prev) => ({
        ...prev,
        [songId]: prev[songId].filter((c: Chart) => c.id !== chartId),
      }));
    } catch (err) {
      showToast(err?.response?.data?.message || "שגיאה במחיקת הצ'ארט", "error");
    }
  };

  const safeKey = (k?: string) => k || "לא צוין";
  const safeDuration = (sec?: number) => {
    if (!sec) return "00:00";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const normalizeTime = (t) => {
    if (!t) return "";
    return t.toString().slice(0, 5);
  };

  const formatDate = (date) => {
    if (!date) return "לא צוין תאריך";
    return new Date(date).toLocaleDateString("he-IL");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-400">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white p-4">
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 text-center max-w-md">
          <div className="text-red-400 text-xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">שגיאה</h2>
          <p className="text-neutral-400 mb-6">{error || "אמן לא נמצא"}</p>
          <button
            onClick={() => navigate("/home")}
            className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold px-6 py-3 rounded-lg"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* כפתור חזרה */}
        <button
          onClick={() => navigate("/artists")}
          className="mb-4 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>חזרה לאמנים</span>
        </button>

        {/* כותרת */}
        <div className="mb-6">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* תמונת פרופיל */}
              <div className="flex-shrink-0">
                {artist.avatar ? (
                  <img
                    src={artist.avatar}
                    alt={artist.full_name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-brand-orange shadow-lg"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                <div
                  className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-brand-orange flex items-center justify-center"
                  style={{
                    display: artist.avatar ? "none" : "flex",
                  }}
                >
                  <User size={40} className="text-neutral-500" />
                </div>
              </div>

              {/* פרטי האמן */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {artist.full_name || "אמן ללא שם"}
                </h1>

                {artist.artist_role && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-orange rounded-lg text-black font-semibold text-sm">
                      <Music size={16} />
                      {artist.artist_role}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  {artist.email && (
                    <span className="text-neutral-400">{artist.email}</span>
                  )}
                  {artist.role && (
                    <span className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-300">
                      {artist.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("lineups")}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all text-sm ${
              activeTab === "lineups"
                ? "bg-brand-orange text-black"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            <ListMusic className="inline-block ml-2" size={16} />
            לינאפים
          </button>
          <button
            onClick={() => setActiveTab("songs")}
            className={`flex-1 py-2.5 rounded-xl font-semibold transition-all text-sm ${
              activeTab === "songs"
                ? "bg-brand-orange text-black"
                : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:bg-neutral-800"
            }`}
          >
            <Music className="inline-block ml-2" size={16} />
            שירים
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder={
              activeTab === "lineups" ? "חפש לינאפ..." : "חפש שיר..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 pl-10 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={18}
          />
        </div>

        {/* Chart viewing modal */}
        {viewingChart && (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={() => setViewingChart(null)}
          >
            <div className="relative max-w-5xl max-h-[90vh] w-full">
              <button
                onClick={() => setViewingChart(null)}
                className="absolute -top-12 right-0 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-semibold border border-neutral-800 flex items-center gap-2"
              >
                <X size={18} />
                סגור
              </button>
              <div className="bg-neutral-900 rounded-2xl p-4 overflow-auto max-h-[85vh] border border-neutral-800">
                {viewingChart.endsWith(".pdf") ? (
                  <iframe
                    src={viewingChart}
                    className="w-full h-[80vh] rounded-xl"
                    title="Chart Viewer"
                  />
                ) : (
                  <img
                    src={viewingChart}
                    alt="Chart"
                    className="w-full h-auto rounded-xl"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmModalComponent />

        {/* ליינאפים */}
        {activeTab === "lineups" && (
          <div className="mb-8">
            {lineups.length === 0 ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
                <ListMusic
                  size={48}
                  className="mx-auto mb-4 text-neutral-600"
                />
                <p className="text-neutral-400">אין ליינאפים זמינים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lineups
                  .filter(
                    (lineup) =>
                      lineup.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      lineup.location
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                  )
                  .map((lineup, i) => (
                    <div
                      key={lineup.id}
                      onClick={() => navigate(`/lineup/${lineup.id}`)}
                      className="bg-neutral-900 rounded-2xl p-4 flex justify-between items-center hover:shadow-lg transition border border-neutral-800"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {i + 1}. {lineup.title}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <span className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700 flex-row-reverse">
                            <CalendarDays size={14} />
                            {formatDate(lineup.date)}
                          </span>

                          <span className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700 flex-row-reverse">
                            <Clock size={14} />
                            {normalizeTime(lineup.time) || "לא צוין שעה"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <span className="flex flex-row-reverse items-center gap-1 px-2 py-1 bg-brand-orange rounded-lg text-black font-semibold">
                            <MapPin size={14} />
                            {lineup.location || "לא צוין מיקום"}
                          </span>
                        </div>

                        {lineup.description && (
                          <p className="text-neutral-400 mt-2 text-sm line-clamp-2">
                            {lineup.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* שירים */}
        {activeTab === "songs" && (
          <div className="mb-8">
            {songs.length === 0 ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
                <Music size={48} className="mx-auto mb-4 text-neutral-600" />
                <p className="text-neutral-400">אין שירים זמינים</p>
              </div>
            ) : (
              <div className="space-y-3">
                {songs
                  .filter(
                    (s) =>
                      s.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      s.artist?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((s, i) => (
                    <div
                      key={s.id}
                      className="bg-neutral-900 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg transition border border-neutral-800"
                    >
                      <div>
                        <p className="font-semibold text-lg">
                          {i + 1}. {s.title}
                        </p>
                        <p className="text-neutral-400 text-sm">{s.artist}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                            {safeKey(s.key_sig)}
                          </span>
                          <span className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                            {s.bpm} BPM
                          </span>
                          <span className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                            {safeDuration(s.duration_sec)}
                          </span>
                        </div>
                        {s.notes && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-brand-orange rounded-lg text-black font-semibold">
                            {s.notes}
                          </span>
                        )}

                        {/* Private charts */}
                        {privateCharts[s.id] &&
                          privateCharts[s.id].length > 0 && (
                            <div className="mt-3 p-3 bg-neutral-800/50 rounded-xl border border-neutral-700">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText size={14} className="text-cyan-400" />
                                <span className="text-xs font-semibold text-neutral-300">
                                  הצ'ארטים שלי ({privateCharts[s.id].length})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {privateCharts[s.id].map((chart, idx) => (
                                  <div
                                    key={chart.id}
                                    className="flex items-center gap-1 bg-neutral-900 px-2 py-1.5 rounded-lg border border-neutral-600"
                                  >
                                    <span className="text-xs text-neutral-400 mr-1">
                                      #{idx + 1}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleViewChart(chart.file_path)
                                      }
                                      className="bg-cyan-600 hover:bg-cyan-700 p-1.5 rounded-full transition-colors"
                                      title="צפייה"
                                    >
                                      <Eye size={12} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDownloadChart(
                                          chart.file_path,
                                          s.title
                                        )
                                      }
                                      className="bg-emerald-600 hover:bg-emerald-700 p-1.5 rounded-full transition-colors"
                                      title="הורדה"
                                    >
                                      <FileDown size={12} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeletePrivateChart(s.id, chart.id)
                                      }
                                      className="bg-rose-600 hover:bg-rose-700 p-1.5 rounded-full transition-colors"
                                      title="מחיקה"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Upload button */}
                      <div className="flex gap-2 flex-row-reverse items-center">
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/gif,image/jpg"
                          ref={(el) => {
                            fileInputRefs.current[s.id] = el;
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadChart(s.id, file);
                            }
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRefs.current[s.id]?.click()}
                          className="bg-brand-orange hover:bg-brand-orangeLight text-black p-2 rounded-full transition-all"
                          title="העלה צ'ארט"
                        >
                          <Upload size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
