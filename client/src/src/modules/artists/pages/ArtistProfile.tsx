import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Outlet, useLocation } from "react-router-dom";
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
  ArrowRight,
} from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import BaseModal from "@/modules/shared/components/BaseModal.tsx";
import ArtistCard from "@/modules/shared/components/ArtistCard";
import Search from "@/modules/shared/components/Search";
import BlockLineup from "@/modules/shared/components/blocklineup";
import CardSong from "@/modules/shared/components/cardsong";
import Charts from "@/modules/shared/components/Charts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

export default function ArtistProfile() {
  const confirm = useConfirm();
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const { subscriptionBlocked } = useAuth();
  const location = useLocation();
  const isLineupRoute = /^\/artist\/\d+\/lineups\/\d+/.test(location.pathname);
  const [artist, setArtist] = useState(null);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs
  // Remove setActiveTab, use URL to control active tab
  const [searchQuery, setSearchQuery] = useState("");

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

  // Determine active tab from URL
  const activeTab: "lineups" | "songs" = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") === "songs" ? "songs" : "lineups";
  }, [location.search]);

  const filteredLineups = useMemo(() => {
    if (!searchQuery) return lineups;
    const query = searchQuery.toLowerCase();
    return lineups.filter(
      (lineup) =>
        lineup.title?.toLowerCase().includes(query) ||
        lineup.location?.toLowerCase().includes(query)
    );
  }, [lineups, searchQuery]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    const query = searchQuery.toLowerCase();
    return songs.filter(
      (song) =>
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query)
    );
  }, [songs, searchQuery]);

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
      formData.append("pdf", file);
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
    const ok = await confirm({
      title: "מחיקת צ'ארט",
      message: "בטוח שאתה רוצה למחוק את הצ'ארט?",
    });
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
  const safeDuration = (sec?: number | string) => {
    const numSec = typeof sec === "string" ? parseInt(sec, 10) : sec;
    if (!numSec) return "00:00";
    const m = Math.floor(numSec / 60);
    const s = numSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Handlers for edit and remove (not used in artist profile view)
  const handleEditSong = (song: Song) => {
    // User cannot edit other artist's songs
    console.log("Edit not allowed for other artist's songs");
  };

  const handleRemoveSong = async (songId: number) => {
    // User cannot remove other artist's songs
    console.log("Remove not allowed for other artist's songs");
  };

  const normalizeTime = (t) => {
    if (!t) return "";
    return t.toString().slice(0, 5);
  };

  const formatDate = (date) => {
    if (!date) return "לא צוין תאריך";
    return new Date(date).toLocaleDateString("he-IL");
  };

  return (
    <div dir="rtl" className="min-h-screen text-white pb-20">
      <div className="min-h-screen text-white p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">משותפים</h1>
        </header>
        <div className="mb-6">
          {loading || error || !artist ? (
            <>
              {loading && (
                <div className="min-h-[200px] flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-400">טוען נתונים...</p>
                  </div>
                </div>
              )}
              {(error || !artist) && !loading && (
                <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 text-center max-w-md mx-auto">
                  <div className="text-red-400 text-xl mb-4">❌</div>
                  <h2 className="text-2xl font-bold mb-2">שגיאה</h2>
                  <p className="text-neutral-400 mb-6">
                    {error || "אמן לא נמצא"}
                  </p>
                  <button
                    onClick={() => {
                      if (subscriptionBlocked) {
                        window.openUpgradeModal?.();
                        return;
                      }
                      navigate("/my");
                    }}
                    className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold px-6 py-3 rounded-lg"
                  >
                    חזרה לדף הבית
                  </button>
                </div>
              )}
            </>
          ) : (
            <ArtistCard artist={artist} disableActions={true} />
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-between mt-8 bg-neutral-800 rounded-2xl mb-6 overflow-hidden w-fit">
          <button
            onClick={() => {
              if (subscriptionBlocked) {
                window.openUpgradeModal?.();
                return;
              }
              navigate(`/artist/${id}`);
            }}
            className={`px-6 py-2 transition font-bold flex items-center gap-2 ${
              activeTab === "lineups"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-white"
            }`}
          >
            ליינאפים
          </button>

          <button
            onClick={() => {
              if (subscriptionBlocked) {
                window.openUpgradeModal?.();
                return;
              }
              navigate(`/artist/${id}?tab=songs`);
            }}
            className={`px-6 py-2 transition font-bold flex items-center gap-2 ${
              activeTab === "songs"
                ? "border-b-2 border-brand-orange text-brand-orange"
                : "text-white"
            }`}
          >
            שירים
          </button>
        </div>

        {/* Chart viewing modal */}
        <BaseModal
          open={!!viewingChart}
          onClose={() => setViewingChart(null)}
          title="צפייה בצ'ארט"
          maxWidth="max-w-5xl"
          containerClassName="max-h-[90vh]"
          padding="p-4"
        >
          <div className="overflow-auto max-h-[85vh] rounded-2xl">
            {viewingChart && viewingChart.endsWith(".pdf") ? (
              <iframe
                src={viewingChart}
                className="w-full h-[80vh] rounded-xl"
                title="Chart Viewer"
              />
            ) : (
              <img
                src={viewingChart || ""}
                alt="Chart"
                className="w-full h-auto rounded-xl"
              />
            )}
          </div>
        </BaseModal>

        {/* ליינאפים */}
        {activeTab === "lineups" && (
          <>
            {isLineupRoute ? (
              <Outlet />
            ) : (
              <>
                {/* Search */}
                <div className="mb-6">
                  <Search
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    variant={activeTab === "lineups" ? "lineup" : "song"}
                  />
                </div>
                <div className="mb-8">
                  {filteredLineups.length === 0 ? (
                    <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
                      <ListMusic
                        size={48}
                        className="mx-auto mb-4 text-neutral-600"
                      />
                      <p className="text-neutral-400">
                        {lineups.length === 0
                          ? "אין ליינאפים זמינים"
                          : "לא נמצאו תוצאות"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredLineups.map((lineup, i) => (
                        <BlockLineup
                          key={lineup.id}
                          lineup={lineup}
                          index={i}
                          onOpen={() => navigate(`lineups/${lineup.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* שירים */}
        {activeTab === "songs" && (
          <div className="mb-8">
            {/* Search for songs */}
            <div className="mb-6">
              <Search
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="song"
              />
            </div>
            {filteredSongs.length === 0 ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
                <Music size={48} className="mx-auto mb-4 text-neutral-600" />
                <p className="text-neutral-400">
                  {songs.length === 0 ? "אין שירים זמינים" : "לא נמצאו תוצאות"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSongs.map((s, i) => (
                  <CardSong
                    key={s.id}
                    song={s}
                    index={i}
                    safeKey={safeKey}
                    safeDuration={safeDuration}
                    onEdit={handleEditSong}
                    onRemove={handleRemoveSong}
                    chartsComponent={
                      <Charts
                        song={s}
                        privateCharts={privateCharts[s.id] || []}
                        setPrivateCharts={setPrivateCharts}
                        fileInputRefs={fileInputRefs}
                        viewingChart={viewingChart}
                        setViewingChart={setViewingChart}
                        onConfirm={confirm}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
