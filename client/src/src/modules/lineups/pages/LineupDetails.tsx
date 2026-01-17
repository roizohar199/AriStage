import SongLyrics from "@/modules/shared/components/SongLyrics";
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Trash2,
  X,
  Search as SearchIcon,
  Clock,
  Share2,
  Copy,
  Ban,
  MoreHorizontal,
  Printer,
  FileDown,
  Music4Icon,
  Upload,
  Eye,
  ArrowRight,
} from "lucide-react";
import BaseModal from "@/modules/shared/components/BaseModal";
import SearchInput from "../../shared/components/Search";
import api from "@/modules/shared/lib/api.js";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { API_ORIGIN } from "@/config/apiConfig";
import { io } from "socket.io-client";
import CardSong from "../../shared/components/cardsong";
import Charts from "../../shared/components/Charts";
import DesignActionButton from "../../shared/components/DesignActionButton";

// --- Helper functions ---
const parseDuration = (d: string | number | undefined) => {
  if (!d) return 0;
  const str = String(d);
  if (!str.includes(":")) return Number(str) || 0;
  const parts = str.split(":").map((n) => Number(n) || 0);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

// --- Deduplication helper ---
function dedupeSongs(songs: any[]) {
  const map = new Map();
  for (const s of songs) {
    if (s.lineupSongId) map.set(s.lineupSongId, s);
  }
  return Array.from(map.values());
}

// --- Memoized Song List ---
const SongList = memo(function SongList({
  songs,
  lineup,
  onRemoveSong,
  fileInputRefs,
  privateCharts,
  setPrivateCharts,
  viewingChart,
  setViewingChart,
  onConfirm,
  onLyricsChanged,
}: any) {
  const safeKey = (key: string) => key || "N/A";
  const safeDuration = (duration: string | number) => {
    if (!duration) return "00:00";
    return String(duration);
  };

  return (
    <Droppable droppableId="songs">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="space-y-3"
        >
          {songs.length === 0 ? (
            <div className="text-center text-neutral-400 py-8">
              <p className="text-lg mb-2">אין שירים בליינאפ זה</p>
              {lineup?.is_owner && (
                <p className="text-sm">
                  לחץ על הכפתור הירוק למעלה כדי להוסיף שירים
                </p>
              )}
            </div>
          ) : (
            songs.map((s: any, index: number) => (
              <Draggable
                key={`ls-${s.lineupSongId}`}
                draggableId={`ls-${s.lineupSongId}`}
                index={index}
                isDragDisabled={!lineup?.is_owner}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${
                      snapshot.isDragging ? "opacity-50" : ""
                    } relative`}
                  >
                    {lineup?.is_owner && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none">
                        <GripVertical
                          className="text-neutral-400 hover:text-brand-orange transition-colors"
                          size={20}
                        />
                      </div>
                    )}
                    <CardSong
                      song={{
                        id: s.song_id,
                        title: s.title,
                        artist: s.artist,
                        bpm: s.bpm,
                        key_sig: s.key_sig,
                        duration_sec: s.duration_sec,
                        notes: s.notes,
                        is_owner: s.can_edit,
                      }}
                      index={index}
                      safeKey={safeKey}
                      safeDuration={safeDuration}
                      onEdit={undefined} // 👈 זה הקסם
                      onRemove={onRemoveSong} // 👈 מחיקה נשארת
                      chartsComponent={
                        <Charts
                          song={{
                            id: s.song_id,
                            title: s.title,
                            artist: s.artist,
                            bpm: s.bpm,
                            key_sig: s.key_sig,
                            duration_sec: s.duration_sec,
                            notes: s.notes,
                            is_owner: true,
                          }}
                          privateCharts={privateCharts[s.song_id] || []}
                          setPrivateCharts={setPrivateCharts}
                          fileInputRefs={fileInputRefs}
                          viewingChart={viewingChart}
                          setViewingChart={setViewingChart}
                          onConfirm={onConfirm}
                        />
                      }
                      lyricsComponent={
                        <SongLyrics
                          songId={s.song_id}
                          songTitle={s.title}
                          lyricsText={s.lyrics_text}
                          canEdit={!!s.can_edit}
                          onConfirm={onConfirm}
                          onChanged={onLyricsChanged}
                        />
                      }
                    />
                  </div>
                )}
              </Draggable>
            ))
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
});

const AddSongModal = memo(function AddSongModal({
  showModal,
  onClose,
  filteredModalSongs,
  addSong,
  searchModal,
  setSearchModal,
  modalActiveTab,
  setModalActiveTab,
  connectedArtists,
  selectedArtistId,
  setSelectedArtistId,
}: any) {
  return (
    <BaseModal
      open={showModal}
      onClose={onClose}
      title="הוסף שיר לליינאפ"
      maxWidth="max-w-2xl"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">הוסף שיר לליינאפ</h2>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex gap-3 bg-neutral-800 rounded-2xl p-1 ">
          <button
            onClick={() => setModalActiveTab("my")}
            className={`flex-1 py-2 px-4 rounded-2xl font-semibold transition-all ${
              modalActiveTab === "my"
                ? "bg-brand-orange text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            השירים שלי
          </button>
          <button
            onClick={() => setModalActiveTab("artists")}
            className={`flex-1 py-2 px-4 rounded-2xl font-semibold transition-all ${
              modalActiveTab === "artists"
                ? "bg-brand-orange text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            שירים של אמנים
          </button>
        </div>
      </div>

      {/* אמנים - רשימה תמיד נראית בטאב אמנים */}
      {modalActiveTab === "artists" && connectedArtists.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-neutral-400 mb-2">
            בחר אמן להצגת שירים שלו
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {connectedArtists.map((artist) => (
              <button
                key={artist.id}
                onClick={() =>
                  setSelectedArtistId(
                    selectedArtistId === artist.id ? null : artist.id,
                  )
                }
                className={`flex-shrink-0 py-2 px-4 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedArtistId === artist.id
                    ? "bg-brand-orange text-black"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {artist.full_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <SearchIcon
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          placeholder="חפש לפי שם, אמן, BPM, סולם..."
          value={searchModal}
          onChange={(e) => setSearchModal(e.target.value)}
          className="w-full bg-neutral-800 rounded-2xl p-2 pr-8 text-sm text-white"
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
        {filteredModalSongs.map((s: any) => (
          <div
            key={s.id}
            className="bg-neutral-800 rounded-2xl p-4 flex justify-between items-center shadow-sm"
          >
            <div>
              <p className="font-semibold text-lg text-white">{s.title}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <p className="px-2 py-1 bg-neutral-900 rounded-2xl">
                  BPM {s.bpm || ""}
                </p>
                <p className="px-2 py-1 bg-neutral-900 rounded-2xl">
                  {s.key_sig || "-"}
                </p>
                <p className="px-2 py-1 bg-neutral-900 rounded-2xl">
                  {s.duration_sec || "00:00"}
                </p>
                {s.notes && (
                  <span className="inline-block px-2 py-1 text-xs bg-brand-orange rounded-2xl text-black font-semibold">
                    {s.notes}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => addSong(s.id)}
              className="w-6 h-6 text-white hover:text-brand-orange"
            >
              <Plus size={20} />
            </button>
          </div>
        ))}
        {filteredModalSongs.length === 0 && (
          <p className="text-center text-neutral-400 py-6">
            לא נמצאו תוצאות...
          </p>
        )}
      </div>
    </BaseModal>
  );
});

// --- Main Component ---
export default function LineupDetails() {
  const confirm = useConfirm();
  const { showToast } = useToast();
  const { lineupId } = useParams<{ lineupId: string }>();
  const navigate = useNavigate();

  // Safety check for invalid lineupId
  if (!lineupId || isNaN(Number(lineupId))) {
    return null;
  }

  const [lineup, setLineup] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchMain, setSearchMain] = useState("");
  const [searchModal, setSearchModal] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [hostId, setHostId] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<"my" | "artists">("my");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [connectedArtists, setConnectedArtists] = useState<any[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [privateCharts, setPrivateCharts] = useState<Record<number, any[]>>({});
  const [viewingChart, setViewingChart] = useState<string | null>(null);

  // --- Stable socket singleton ---
  const socketRef = useRef<any>(null);
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(API_ORIGIN, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 20000,
      });
    }
    return () => {
      // Don't disconnect socket, keep singleton
    };
  }, []);

  // --- Initial load ---
  const fetchSongs = useCallback(async () => {
    const [{ data: all }, { data: lineupSongs }] = await Promise.all([
      api.get(`/songs`),
      api.get(`/lineup-songs/${lineupId}`),
    ]);
    // Merge and dedupe
    const merged = lineupSongs.map((s: any) => {
      const full = all.find((x: any) => x.id === s.song_id);
      return { ...full, ...s, lineupSongId: s.id };
    });
    setAllSongs(all);
    const deduped = dedupeSongs(merged);
    setSongs(deduped);

    // טען צ'ארטים פרטיים עבור כל שיר בלינאפ
    const chartsMap: Record<number, any[]> = {};
    for (const song of deduped) {
      if (song.song_id) {
        try {
          const { data } = await api.get(
            `/songs/${song.song_id}/private-charts`,
          );
          chartsMap[song.song_id] = data.charts || [];
        } catch (err) {
          console.error(`שגיאה בטעינת צ'ארטים לשיר ${song.song_id}:`, err);
        }
      }
    }
    setPrivateCharts(chartsMap);
  }, [lineupId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [{ data: lineupData }] = await Promise.all([
          api.get(`/lineups/${lineupId}`),
        ]);
        if (!mounted) return;
        setLineup(lineupData);
        await fetchSongs();
        // שמור את ה-user ID הנוכחי
        const user = JSON.parse(localStorage.getItem("ari_user") || "{}");
        if (user?.id) {
          setCurrentUserId(user.id);
        }
        try {
          const { data } = await api.get(`/lineups/${lineupId}/share`);
          if (mounted) setShareUrl(data.active ? data.url : null);
        } catch {}
        try {
          const { data } = await api.get("/users/check-guest", {
            skipErrorToast: true,
          });
          if (mounted) {
            setIsGuest(data.isGuest);
            setHostId(data.hostId || null);
            setIsHost(data.isHost || false);
          }
        } catch {}
      } catch (err: any) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "שגיאה בטעינת הליינאפ",
        );
        showToast(
          err?.response?.data?.message ||
            err?.message ||
            "שגיאה בטעינת הליינאפ",
          "error",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [lineupId, showModal, fetchSongs]);

  // --- Socket listeners ---
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !lineupId) return;

    socket.emit("join-lineup", lineupId);

    const user = JSON.parse(localStorage.getItem("ari_user") || "{}");
    if (user?.id) {
      socket.emit("join-user", user.id);
      socket.emit("join-user-updates", user.id);
      api
        .get("/users/check-guest", { skipErrorToast: true })
        .then(({ data }) => {
          if (data.isHost) socket.emit("join-host", user.id);
          if (data.hostId) socket.emit("join-host", data.hostId);
        })
        .catch(() => {});
    }

    // Always sync full list after any change
    const syncSongs = () => {
      fetchSongs();
    };

    socket.on("lineup-song:added", syncSongs);
    socket.on("lineup-song:removed", syncSongs);
    socket.on("lineup-song:reordered", syncSongs);
    socket.on("lineup-song:chart-uploaded", syncSongs);
    socket.on("lineup-song:chart-deleted", syncSongs);

    socket.on("share:update", (data: any) => {
      if (data.id == lineupId) setShareUrl(data.url);
    });

    socket.on("lineup-updated", (data: any) => {
      if (data?.lineupId == lineupId && data?.lineup) {
        setLineup((prev: any) => ({ ...prev, ...data.lineup }));
      }
    });

    socket.on(
      "lineup:updated",
      ({ lineup, lineupId: updatedLineupId }: any) => {
        if (updatedLineupId == lineupId && lineup) {
          setLineup((prev: any) => ({ ...prev, ...lineup }));
        }
      },
    );

    // Cleanup listeners
    return () => {
      socket.off("lineup-song:added", syncSongs);
      socket.off("lineup-song:removed", syncSongs);
      socket.off("lineup-song:reordered", syncSongs);
      socket.off("lineup-song:chart-uploaded", syncSongs);
      socket.off("lineup-song:chart-deleted", syncSongs);
      socket.off("share:update");
      socket.off("lineup-updated");
      socket.off("lineup:updated");
    };
  }, [lineupId, fetchSongs]);

  // --- Memoized values ---
  const lineupIds = useMemo(
    () => new Set(songs.map((s) => s.song_id)),
    [songs],
  );
  const availableSongs = useMemo(
    () => allSongs.filter((s) => !lineupIds.has(s.id)),
    [allSongs, lineupIds],
  );

  // חלץ אמנים מחוברים מהשירים הזמינים
  const extractedConnectedArtists = useMemo(() => {
    const artistMap = new Map();
    availableSongs.forEach((song) => {
      if (song.owner_id && song.owner_id !== currentUserId) {
        if (!artistMap.has(song.owner_id)) {
          artistMap.set(song.owner_id, {
            id: song.owner_id,
            full_name: song.owner_name || "אמן לא ידוע",
          });
        }
      }
    });
    return Array.from(artistMap.values());
  }, [availableSongs, currentUserId]);

  // עדכן את האמנים המחוברים כשהוקצים חדשים
  useEffect(() => {
    setConnectedArtists(extractedConnectedArtists);
  }, [extractedConnectedArtists]);

  const filteredLineupSongs = useMemo(() => {
    const term = searchMain.toLowerCase();
    if (!term) return dedupeSongs(songs);
    return dedupeSongs(
      songs.filter(
        (s) =>
          s.title?.toLowerCase().includes(term) ||
          s.artist?.toLowerCase().includes(term) ||
          s.notes?.toLowerCase().includes(term),
      ),
    );
  }, [songs, searchMain]);
  const filteredModalSongs = useMemo(() => {
    const term = searchModal.toLowerCase();
    return availableSongs.filter((s) => {
      // סנן לפי טאב
      if (modalActiveTab === "my" && s.owner_id !== currentUserId) return false;

      if (modalActiveTab === "artists") {
        // בטאב אמנים, אם בחרנו אמן מסוים - תציג שירים שלו בלבד
        if (selectedArtistId && s.owner_id !== selectedArtistId) return false;
        // אחרת תציג רק שירים של אמנים שאני מחובר אליהם
        if (!selectedArtistId && s.owner_id === currentUserId) return false;
      }

      return (
        s.title.toLowerCase().includes(term) ||
        s.artist?.toLowerCase().includes(term) ||
        s.key_sig?.toLowerCase().includes(term) ||
        (s.bpm && s.bpm.toString().includes(term)) ||
        s.notes?.toLowerCase().includes(term)
      );
    });
  }, [
    availableSongs,
    searchModal,
    modalActiveTab,
    currentUserId,
    selectedArtistId,
  ]);
  const totalDuration = useMemo(() => {
    const totalSec = songs.reduce(
      (sum, s) => sum + parseDuration(s.duration_sec),
      0,
    );
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [songs]);

  // --- Actions ---
  const addSong = useCallback(
    async (songId: number) => {
      try {
        await api.post(`/lineup-songs/${lineupId}`, { song_id: songId });
        setSearchMain("");
        setSearchModal("");
        await fetchSongs();
      } catch (err) {
        showToast("שגיאה בהוספת שיר", "error");
      }
    },
    [lineupId, showToast, fetchSongs],
  );

  const removeSong = useCallback(
    async (songId: number) => {
      try {
        await api.delete(`/lineup-songs/${lineupId}/${songId}`);
        await fetchSongs();
      } catch (err) {
        showToast("שגיאה במחיקת שיר", "error");
      }
    },
    [lineupId, showToast, fetchSongs],
  );

  const handleDownloadAllCharts = useCallback(async () => {
    try {
      showToast("בטעינת צ'ארטים...", "info");

      // אסוף את כל הצ'ארטים לכל שיר בסדר הלינאפ
      const chartsToMerge = [];
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        if (!song.song_id) continue;

        // המרת duration לפורמט מתאים
        let formattedDuration = "N/A";
        if (song.duration) {
          if (typeof song.duration === "number") {
            const minutes = Math.floor(song.duration / 60);
            const seconds = song.duration % 60;
            formattedDuration = `${minutes}:${seconds
              .toString()
              .padStart(2, "0")}`;
          } else if (typeof song.duration === "string") {
            formattedDuration = song.duration;
          }
        }

        try {
          const { data } = await api.get(
            `/songs/${song.song_id}/private-charts`,
          );
          if (data.charts && data.charts.length > 0) {
            // קח את הצ'ארט הראשון של השיר
            chartsToMerge.push({
              songTitle: song.title,
              artist: song.artist,
              key_sig: song.key_sig,
              bpm: song.bpm,
              duration: formattedDuration,
              chartUrl: data.charts[0].file_path,
              index: i + 1,
            });
          } else {
            // הוסף שיר גם בלי צ'ארט
            chartsToMerge.push({
              songTitle: song.title,
              artist: song.artist,
              key_sig: song.key_sig,
              bpm: song.bpm,
              duration: formattedDuration,
              chartUrl: null,
              index: i + 1,
            });
          }
        } catch (err) {
          // גם אם אין צ'ארט, הוסף את פרטי השיר
          console.log(`אין צ'ארט לשיר: ${song.title}`);
          chartsToMerge.push({
            songTitle: song.title,
            artist: song.artist,
            key_sig: song.key_sig,
            bpm: song.bpm,
            duration: formattedDuration,
            chartUrl: null,
            index: i + 1,
          });
        }
      }

      if (chartsToMerge.length === 0) {
        showToast("אין צ'ארטים להורדה בליינאפ זה", "warning");
        return;
      }

      // שליחת בקשה למערכת כדי למזג את הצ'ארטים
      const { data: mergedPdf } = await api.post(
        `/lineups/${lineupId}/download-charts`,
        { charts: chartsToMerge },
        { responseType: "blob" },
      );

      // הורדת הקובץ המוזג
      const url = window.URL.createObjectURL(new Blob([mergedPdf]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${lineup?.title || "lineup"}-charts.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("הצ'ארטים הורדו בהצלחה", "success");
    } catch (err) {
      console.error("שגיאה בהורדת הצ'ארטים:", err);
      showToast(
        err?.response?.data?.message || "שגיאה בהורדת הצ'ארטים",
        "error",
      );
    }
  }, [songs, lineupId, lineup, showToast]);

  const handleDownloadAllLyrics = useCallback(async () => {
    try {
      showToast("מכין קובץ מילים...", "info");

      const { data: pdf } = await api.post(
        `/lineups/${lineupId}/download-lyrics`,
        {},
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([pdf]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${lineup?.title || "lineup"}-lyrics.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("המילים הורדו בהצלחה", "success");
    } catch (err: any) {
      console.error("שגיאה בהורדת מילים:", err);
      showToast(err?.response?.data?.message || "שגיאה בהורדת מילים", "error");
    }
  }, [lineupId, lineup, showToast]);

  const handleDragEnd = useCallback(
    async (result: any) => {
      if (!lineup?.is_owner) return;
      const { destination, source } = result;
      if (!destination || destination.index === source.index) return;
      const reordered = Array.from(songs);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setSongs(dedupeSongs(reordered));
      try {
        await api.put(`/lineup-songs/${lineupId}/order`, {
          songs: reordered.map((s) => s.song_id),
        });
        await fetchSongs();
      } catch {
        showToast("שגיאה בסידור שירים", "error");
      }
    },
    [lineup, songs, lineupId, showToast, fetchSongs],
  );

  const generateShareLink = useCallback(async () => {
    const ok = await confirm({
      title: "שיתוף ליינאפ",
      message: "האם ליצור קישור?",
    });
    if (!ok) return;
    try {
      setLoadingShare(true);
      const { data } = await api.post(`/lineups/${lineupId}/share`);
      setShareUrl(data.url);
      showToast("קישור השיתוף נוצר!", "success");
    } catch {
      showToast("שגיאה ביצירת קישור", "error");
    } finally {
      setLoadingShare(false);
    }
  }, [lineupId, confirm, showToast]);

  const revokeShareLink = useCallback(async () => {
    const ok = await confirm({
      title: "ביטול שיתוף",
      message: "לבטל את השיתוף?",
    });
    if (!ok) return;
    try {
      await api.delete(`/lineups/${lineupId}/share`);
      setShareUrl(null);
    } catch {}
  }, [lineupId, confirm]);

  const copyShareLink = useCallback(() => {
    if (!shareUrl) return;
    if (!navigator.clipboard) {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("הקישור הועתק 💛", "success");
      return;
    }
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => showToast("הקישור הועתק 💛", "success"))
      .catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showToast("הקישור הועתק 💛", "success");
      });
  }, [shareUrl, showToast]);

  // --- UI ---
  if (loading) {
    return (
      <div className="flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-xl mb-4">טוען...</div>
        </div>
      </div>
    );
  }
  if (error || !lineup) {
    return (
      <div className="flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-xl mb-4 text-red-400">
            {error || "ליינאפ לא נמצא"}
          </div>
          <button
            onClick={() => navigate("/my")}
            className="bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-xl"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="text-white relative">
      {/* HEADER */}

      <header className="flex items-center gap-3 mb-3">
        <div className="flex-1 ">
          {/* SEARCH MAIN */}

          <SearchInput
            value={searchMain}
            onChange={(e) => setSearchMain(e.target.value)}
            variant="lineup"
            className="w-full"
          />
        </div>
        {lineup?.is_owner && (
          <DesignActionButton
            onClick={() => {
              setShowModal(true);
              setSearchModal("");
              setModalActiveTab("my");
              setSelectedArtistId(null);
            }}
          >
            <Plus size={25} />
            הוסף שיר
          </DesignActionButton>
        )}
      </header>

      {/* SONG LIST */}
      <div className="pl-3 mb-3">
        <div className="flex justify-between items-center w-full gap-4 mb-4">
          {/* Right section: title, duration, songs count (RTL: right side) */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{lineup.title}</h1>
            <div className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-2xl text-brand-orange font-bold text-sm">
              <Clock size={18} />
              {totalDuration}
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-neutral-800 rounded-2xl text-brand-orange font-bold text-sm">
              <Music4Icon size={18} />
              {songs.length} שירים
            </div>
          </div>
          {/* Left section: share, revoke, menu (RTL: left side) */}
          <div className="flex items-center gap-3">
            {lineup?.is_owner && (
              <>
                <button
                  onClick={generateShareLink}
                  className="text-white font-semibold rounded-2xl flex flex-row-reverse items-center hover:text-brand-orange gap-2"
                >
                  <Share2 size={16} />
                  {loadingShare ? "יוצר..." : "שיתוף"}
                </button>
                {shareUrl && (
                  <button
                    onClick={revokeShareLink}
                    className="text-red-500 font-semibold rounded-2xl flex flex-row-reverse items-center hover:text-red-400 gap-2"
                  >
                    <Ban size={16} />
                    בטל
                  </button>
                )}
              </>
            )}

            {/* 3 dots menu */}
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
                    <Printer size={16} />
                    הדפס
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDownloadAllCharts();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:text-brand-orange"
                  >
                    <FileDown size={16} />
                    הורד צ'ארטים
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDownloadAllLyrics();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:text-brand-orange"
                  >
                    <FileDown size={16} />
                    הורד מילים
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* SHARE LINK */}
        {shareUrl && (
          <div className="bg-brand-orange/10 backdrop-blur-xl p-3 rounded-2xl mb-4 text-sm flex justify-between items-center">
            <span className="text-neutral-300 truncate">{shareUrl}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyShareLink();
              }}
              className="cursor-pointer active:scale-95 transition"
            >
              <Copy size={16} />
            </button>
          </div>
        )}
        <DragDropContext onDragEnd={handleDragEnd}>
          <SongList
            songs={filteredLineupSongs}
            lineup={lineup}
            onRemoveSong={removeSong}
            fileInputRefs={fileInputRefs}
            privateCharts={privateCharts}
            setPrivateCharts={setPrivateCharts}
            viewingChart={viewingChart}
            setViewingChart={setViewingChart}
            onConfirm={confirm}
            onLyricsChanged={fetchSongs}
          />
        </DragDropContext>
      </div>
      {/* MODAL */}
      <AddSongModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        filteredModalSongs={filteredModalSongs}
        addSong={addSong}
        searchModal={searchModal}
        setSearchModal={setSearchModal}
        modalActiveTab={modalActiveTab}
        setModalActiveTab={setModalActiveTab}
        connectedArtists={connectedArtists}
        selectedArtistId={selectedArtistId}
        setSelectedArtistId={setSelectedArtistId}
      />
    </div>
  );
}
