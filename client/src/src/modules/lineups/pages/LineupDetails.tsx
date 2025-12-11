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
  Search,
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
} from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useConfirm } from "@/modules/shared/hooks/useConfirm.jsx";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { io } from "socket.io-client";

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
  onUploadChart,
  onDeleteChart,
  onPreviewChart,
  onPrintChart,
  fileInputRefs,
}: any) {
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
                    {...(lineup?.is_owner ? provided.dragHandleProps : {})}
                    className={`glass rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg border border-neutral-800 ${
                      snapshot.isDragging ? "opacity-50" : ""
                    } ${
                      !lineup?.is_owner
                        ? "cursor-default"
                        : "cursor-grab active:cursor-grabbing"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {lineup?.is_owner && (
                        <GripVertical
                          className="text-neutral-400 hover:text-brand-orange transition-colors cursor-grab active:cursor-grabbing"
                          size={20}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">
                          {index + 1}. {s.title}
                        </p>
                        <p className="text-neutral-400 text-sm">{s.artist}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <p className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                            BPM {s.bpm || "-"}
                          </p>
                          <p className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                            {s.key_sig || "-"}
                          </p>
                          <p className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                            {s.duration_sec || "00:00"}
                          </p>
                        </div>
                        {s.notes && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 text-xs bg-brand-orange rounded-lg text-black font-semibold">
                              {s.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.can_edit && (
                        <>
                          <input
                            type="file"
                            accept="application/pdf"
                            ref={(el) => {
                              fileInputRefs.current[s.lineupSongId] = el;
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onUploadChart(s.lineupSongId, file);
                              }
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                          <button
                            onClick={() => {
                              fileInputRefs.current[s.lineupSongId]?.click();
                            }}
                            className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full"
                            title="העלה קובץ PDF צ'ארט"
                          >
                            <Upload size={14} />
                          </button>
                        </>
                      )}
                      {s.chart_pdf_url && (
                        <>
                          <button
                            onClick={() => onPreviewChart(s.chart_pdf_url)}
                            className="bg-cyan-500 hover:bg-cyan-600 p-2 rounded-full"
                            title="תצוגה מקדימה"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => onPrintChart(s.chart_pdf_url)}
                            className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
                            title="הדפס צ'ארט"
                          >
                            <Printer size={14} />
                          </button>
                        </>
                      )}
                      {s.chart_pdf_url && s.can_edit && (
                        <button
                          onClick={() => onDeleteChart(s.lineupSongId)}
                          className="bg-orange-500 hover:bg-orange-600 p-2 rounded-full"
                          title="מחק קובץ PDF"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {s.can_edit && (
                        <button
                          onClick={() => onRemoveSong(s.song_id)}
                          className="bg-red-500 hover:bg-red-600 p-2 rounded-full"
                          title="מחק שיר מהליינאפ"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
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

// --- Memoized Modal ---
const AddSongModal = memo(function AddSongModal({
  showModal,
  onClose,
  filteredModalSongs,
  addSong,
  searchModal,
  setSearchModal,
  modalActiveTab,
  setModalActiveTab,
  isGuest,
  hostId,
  isHost,
}: any) {
  if (!showModal) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-orange-400">
            הוסף שיר לליינאפ
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            placeholder="חפש לפי שם, אמן, BPM, סולם..."
            value={searchModal}
            onChange={(e) => setSearchModal(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 pr-8 text-sm text-white focus:border-orange-500 outline-none"
          />
        </div>
        {(isGuest && hostId) || isHost ? (
          <div className="flex gap-2 mb-4 bg-neutral-800 rounded-xl p-1 border border-neutral-700">
            <button
              onClick={() => setModalActiveTab("my")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                modalActiveTab === "my"
                  ? "bg-brand-orange text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              שירים שלי
            </button>
            <button
              onClick={() => setModalActiveTab("invited")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                modalActiveTab === "invited"
                  ? "bg-brand-orange text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              שירים שהוזמנתי אליהם
            </button>
          </div>
        ) : null}
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
          {filteredModalSongs.map((s: any) => (
            <div
              key={s.id}
              className="glass rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg border border-neutral-800"
            >
              <div>
                <p className="font-semibold text-lg text-white">{s.title}</p>
                <p className="text-neutral-400 text-sm">{s.artist}</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <p className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                    BPM {s.bpm || "-"}
                  </p>
                  <p className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                    {s.key_sig || "-"}
                  </p>
                  <p className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700">
                    {s.duration_sec || "00:00"}
                  </p>
                </div>
                {s.notes && (
                  <div className="mt-2">
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-brand-orange rounded-lg text-black font-semibold">
                      {s.notes}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => addSong(s.id)}
                className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
              >
                <Plus size={14} />
              </button>
            </div>
          ))}
          {filteredModalSongs.length === 0 && (
            <p className="text-center text-neutral-400 py-6">
              לא נמצאו תוצאות...
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

// --- Main Component ---
export default function LineupDetails() {
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

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
  const [modalActiveTab, setModalActiveTab] = useState("my");
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // --- Stable socket singleton ---
  const socketRef = useRef<any>(null);
  useEffect(() => {
    if (!socketRef.current) {
      const url = import.meta.env.VITE_API_URL;
      if (url) {
        socketRef.current = io(url, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          timeout: 20000,
        });
      }
    }
    return () => {
      // Don't disconnect socket, keep singleton
    };
  }, []);

  // --- Initial load ---
  const fetchSongs = useCallback(async () => {
    const [{ data: all }, { data: lineupSongs }] = await Promise.all([
      api.get(`/songs`),
      api.get(`/lineup-songs/${id}`),
    ]);
    // Merge and dedupe
    const merged = lineupSongs.map((s: any) => {
      const full = all.find((x: any) => x.id === s.song_id);
      return { ...full, ...s, lineupSongId: s.id };
    });
    setAllSongs(all);
    setSongs(dedupeSongs(merged));
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [{ data: lineupData }] = await Promise.all([
          api.get(`/lineups/${id}`),
        ]);
        if (!mounted) return;
        setLineup(lineupData);
        await fetchSongs();
        try {
          const { data } = await api.get(`/lineups/${id}/share`);
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
          err?.response?.data?.message || err?.message || "שגיאה בטעינת הליינאפ"
        );
        showToast(
          err?.response?.data?.message ||
            err?.message ||
            "שגיאה בטעינת הליינאפ",
          "error"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, showModal, fetchSongs]);

  // --- Socket listeners ---
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !id) return;

    socket.emit("join-lineup", id);

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
      if (data.id == id) setShareUrl(data.url);
    });

    socket.on("lineup-updated", (data: any) => {
      if (data?.lineupId == id && data?.lineup) {
        setLineup((prev: any) => ({ ...prev, ...data.lineup }));
      }
    });

    socket.on("lineup:updated", ({ lineup, lineupId }: any) => {
      if (lineupId == id && lineup) {
        setLineup((prev: any) => ({ ...prev, ...lineup }));
      }
    });

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
  }, [id, fetchSongs]);

  // --- Memoized values ---
  const lineupIds = useMemo(
    () => new Set(songs.map((s) => s.song_id)),
    [songs]
  );
  const availableSongs = useMemo(
    () => allSongs.filter((s) => !lineupIds.has(s.id)),
    [allSongs, lineupIds]
  );
  const filteredLineupSongs = useMemo(() => {
    const term = searchMain.toLowerCase();
    if (!term) return dedupeSongs(songs);
    return dedupeSongs(
      songs.filter(
        (s) =>
          s.title?.toLowerCase().includes(term) ||
          s.artist?.toLowerCase().includes(term) ||
          s.notes?.toLowerCase().includes(term)
      )
    );
  }, [songs, searchMain]);
  const filteredModalSongs = useMemo(() => {
    const term = searchModal.toLowerCase();
    return availableSongs.filter((s) => {
      if ((isGuest && hostId) || isHost) {
        if (modalActiveTab === "my" && !s.is_owner) return false;
        if (modalActiveTab === "invited" && s.is_owner) return false;
      }
      return (
        s.title.toLowerCase().includes(term) ||
        s.artist?.toLowerCase().includes(term) ||
        s.key_sig?.toLowerCase().includes(term) ||
        (s.bpm && s.bpm.toString().includes(term)) ||
        s.notes?.toLowerCase().includes(term)
      );
    });
  }, [availableSongs, searchModal, isGuest, hostId, isHost, modalActiveTab]);
  const totalDuration = useMemo(() => {
    const totalSec = songs.reduce(
      (sum, s) => sum + parseDuration(s.duration_sec),
      0
    );
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [songs]);

  // --- Actions ---
  const addSong = useCallback(
    async (songId: number) => {
      try {
        await api.post(`/lineup-songs/${id}`, { song_id: songId });
        setSearchMain("");
        setSearchModal("");
        await fetchSongs();
      } catch (err) {
        showToast("שגיאה בהוספת שיר", "error");
      }
    },
    [id, showToast, fetchSongs]
  );

  const removeSong = useCallback(
    async (songId: number) => {
      try {
        await api.delete(`/lineup-songs/${id}/${songId}`);
        await fetchSongs();
      } catch (err) {
        showToast("שגיאה במחיקת שיר", "error");
      }
    },
    [id, showToast, fetchSongs]
  );

  const handleUploadChart = useCallback(
    async (lineupSongId: number, file: File) => {
      if (!file || file.type !== "application/pdf") {
        showToast("רק קבצי PDF מותרים", "error");
        return;
      }
      try {
        const formData = new FormData();
        formData.append("pdf", file);
        await api.post(`/lineup-songs/${lineupSongId}/upload-chart`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("קובץ PDF הועלה בהצלחה", "success");
        await fetchSongs();
      } catch (err) {
        showToast("שגיאה בהעלאת הקובץ", "error");
      }
    },
    [id, showToast, fetchSongs]
  );

  const handleDeleteChart = useCallback(
    async (lineupSongId: number) => {
      const ok = await confirm(
        "מחיקת קובץ PDF",
        "בטוח שאתה רוצה למחוק את קובץ ה-PDF?"
      );
      if (!ok) return;
      try {
        await api.delete(`/lineup-songs/${lineupSongId}/delete-chart`);
        showToast("קובץ PDF נמחק בהצלחה", "success");
        await fetchSongs();
      } catch (err) {
        showToast("שגיאה במחיקת הקובץ", "error");
      }
    },
    [id, confirm, showToast, fetchSongs]
  );

  const handlePrintChart = useCallback(
    (chartPdfUrl: string) => {
      if (!chartPdfUrl) {
        showToast("אין קובץ PDF להדפסה", "error");
        return;
      }
      const printWindow = window.open(chartPdfUrl, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        showToast("לא ניתן לפתוח חלון הדפסה", "error");
      }
    },
    [showToast]
  );

  const handlePreviewChart = useCallback(
    (chartPdfUrl: string) => {
      if (!chartPdfUrl) {
        showToast("אין קובץ PDF לתצוגה מקדימה", "error");
        return;
      }
      window.open(chartPdfUrl, "_blank", "width=800,height=600");
    },
    [showToast]
  );

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
        await api.put(`/lineup-songs/${id}/order`, {
          songs: reordered.map((s) => s.song_id),
        });
        await fetchSongs();
      } catch {
        showToast("שגיאה בסידור שירים", "error");
      }
    },
    [lineup, songs, id, showToast, fetchSongs]
  );

  const generateShareLink = useCallback(async () => {
    const ok = await confirm("שיתוף ליינאפ", "האם ליצור קישור?");
    if (!ok) return;
    try {
      setLoadingShare(true);
      const { data } = await api.post(`/lineups/${id}/share`);
      setShareUrl(data.url);
      showToast("קישור השיתוף נוצר!", "success");
    } catch {
      showToast("שגיאה ביצירת קישור", "error");
    } finally {
      setLoadingShare(false);
    }
  }, [id, confirm, showToast]);

  const revokeShareLink = useCallback(async () => {
    const ok = await confirm("ביטול שיתוף", "לבטל את השיתוף?");
    if (!ok) return;
    try {
      await api.delete(`/lineups/${id}/share`);
      setShareUrl(null);
    } catch {}
  }, [id, confirm]);

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
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-xl mb-4">טוען...</div>
        </div>
      </div>
    );
  }
  if (error || !lineup) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-xl mb-4 text-red-400">
            {error || "ליינאפ לא נמצא"}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-neutral-900 hover:bg-neutral-800 px-4 py-2 rounded-xl"
          >
            חזרה
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen text-white p-6 relative">
      <ConfirmModalComponent />
      {/* HEADER */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-neutral-900 hover:bg-neutral-800 p-2 rounded-full"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-3xl font-bold text-orange-400">{lineup.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {lineup?.is_owner && (
            <div className="flex items-center gap-3">
              <button
                onClick={generateShareLink}
                className="bg-neutral-900 px-4 py-2 rounded-xl flex flex-row-reverse backdrop-blur-xl text-white flex items-center gap-2"
              >
                <Share2 size={16} />
                {loadingShare ? "יוצר..." : "שיתוף"}
              </button>
              {shareUrl && (
                <button
                  onClick={revokeShareLink}
                  className="bg-neutral-900 px-3 py-2 rounded-xl flex flex-row-reverse text-red-400 backdrop-blur-xl flex items-center gap-2"
                >
                  <Ban size={16} /> בטל
                </button>
              )}
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="bg-neutral-900 hover:bg-neutral-800 p-2 rounded-full"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-10 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    window.print();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-800"
                >
                  <Printer size={16} /> הדפס
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    showToast("PDF בדמו בלבד", "info");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-800"
                >
                  <FileDown size={16} /> PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* SHARE LINK */}
      {shareUrl && (
        <div className="bg-neutral-900 border border-white/10 backdrop-blur-xl p-3 rounded-xl mb-4 text-sm flex justify-between items-center">
          <span className="text-neutral-300 truncate">{shareUrl}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyShareLink();
            }}
            className="bg-white/10 p-2 rounded-full cursor-pointer active:scale-95 transition"
          >
            <Copy size={16} />
          </button>
        </div>
      )}
      {/* SEARCH MAIN */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="חפש בשירים בליינאפ..."
          value={searchMain}
          onChange={(e) => setSearchMain(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 pl-10 text-sm placeholder-neutral-500"
        />
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          size={18}
        />
      </div>
      {/* SONG LIST */}
      <div className="rounded-xl bg-neutral-900 p-3 pl-3 border border-neutral-800">
        <div className="w-full rounded-xl text-sm flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-brand-orange rounded-lg flex flex-row-reverse text-black shadow-sm">
              <Clock size={14} /> {totalDuration}
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-brand-orange rounded-lg flex flex-row-reverse text-black shadow-sm">
              <Music4Icon size={14} /> {songs.length} שירים
            </div>
          </div>
          {lineup?.is_owner && (
            <button
              onClick={() => {
                setShowModal(true);
                setSearchModal("");
                setModalActiveTab("my");
              }}
              className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <SongList
            songs={filteredLineupSongs}
            lineup={lineup}
            onRemoveSong={removeSong}
            onUploadChart={handleUploadChart}
            onDeleteChart={handleDeleteChart}
            onPreviewChart={handlePreviewChart}
            onPrintChart={handlePrintChart}
            fileInputRefs={fileInputRefs}
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
        isGuest={isGuest}
        hostId={hostId}
        isHost={isHost}
      />
    </div>
  );
}
