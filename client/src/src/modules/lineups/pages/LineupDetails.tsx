import React, { useEffect, useState, useMemo, useRef } from "react";
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
  FileText,
  Eye,
} from "lucide-react";

import api from "@/modules/shared/lib/api.js";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useConfirm } from "@/modules/shared/hooks/useConfirm.jsx";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { io } from "socket.io-client";

export default function LineupDetails() {
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();

  const { id } = useParams();
  const navigate = useNavigate();

  const [lineup, setLineup] = useState(null);
  const [songs, setSongs] = useState([]);
  const [allSongs, setAllSongs] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [searchMain, setSearchMain] = useState("");
  const [searchModal, setSearchModal] = useState("");

  const [shareUrl, setShareUrl] = useState(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState("my");
  const fileInputRefs = useRef({});

  const parseDuration = (d) => {
    if (!d) return 0;
    const str = String(d);
    if (!str.includes(":")) return Number(str) || 0;

    const parts = str.split(":").map((n) => Number(n) || 0);

    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];

    return 0;
  };

  const generateShareLink = async () => {
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
  };

  const revokeShareLink = async () => {
    const ok = await confirm("ביטול שיתוף", "לבטל את השיתוף?");
    if (!ok) return;

    try {
      await api.delete(`/lineups/${id}/share`);
      setShareUrl(null);
    } catch {}
  };

  const copyShareLink = () => {
    if (!shareUrl) return;

    // אם הדפדפן חוסם Clipboard API
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

    // כאן זה עובד רגיל
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => showToast("הקישור הועתק 💛", "success"))
      .catch(() => {
        // fallback למקרה נדיר
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showToast("הקישור הועתק 💛", "success");
      });
  };

  const load = async () => {
    try {
      const { data: lineups } = await api.get(`/lineups`);
      const found = lineups.find((l) => l.id == id);
      setLineup(found);

      // טען הכל
      const { data: all } = await api.get(`/songs`);
      setAllSongs(all);

      const { data: lineupSongs } = await api.get(`/lineup-songs/${id}`);

      // השלם נתונים מהטבלה של allSongs
      const enriched = lineupSongs.map((s) => {
        const full = all.find((x) => x.id === s.song_id);
        return { ...s, ...full };
      });

      setSongs(enriched);

      try {
        const { data } = await api.get(`/lineups/${id}/share`);
        setShareUrl(data.active ? data.url : null);
      } catch {}

      // בדיקה אם המשתמש הוא אורח או מארח
      try {
        const { data } = await api.get("/users/check-guest", {
          skipErrorToast: true,
        });
        setIsGuest(data.isGuest);
        setHostId(data.hostId || null);
        setIsHost(data.isHost || false);
      } catch (err) {
        console.error("שגיאה בבדיקת סטטוס אורח:", err);
      }
    } catch (err) {
      console.error("❌ שגיאה בטעינה:", err);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL || "http://10.0.0.99:5000";
    return io(url, { transports: ["websocket"] });
  }, []);

  useEffect(() => {
    socket.emit("join-lineup", id);

    socket.on("share:update", (data) => {
      if (data.id == id) {
        setShareUrl(data.url);
      }
    });
    
    // Listeners נוספים לעדכונים בזמן אמת
    socket.on("lineup-updated", () => {
      load(); // רענון נתונים
    });
    
    socket.on("lineup:updated", ({ lineupId }) => {
      if (lineupId == id) {
        load(); // רענון נתונים
      }
    });
    
    socket.on("lineup-song:added", ({ lineupId, songId }) => {
      if (lineupId == id) {
        load(); // רענון רשימת שירים
      }
    });
    
    socket.on("lineup-song:removed", ({ lineupId, songId }) => {
      if (lineupId == id) {
        setSongs((prev) => prev.filter((s) => s.song_id !== songId));
      }
    });
    
    socket.on("lineup-song:reordered", ({ lineupId, songs }) => {
      if (lineupId == id) {
        load(); // רענון רשימת שירים
      }
    });

    return () => {
      socket.off("share:update");
      socket.off("lineup-updated");
      socket.off("lineup:updated");
      socket.off("lineup-song:added");
      socket.off("lineup-song:removed");
      socket.off("lineup-song:reordered");
      socket.disconnect();
    };
  }, [id, socket]);

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
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(term) ||
        s.artist?.toLowerCase().includes(term) ||
        s.notes?.toLowerCase().includes(term)
    );
  }, [songs, searchMain]);

  const filteredModalSongs = useMemo(() => {
    const term = searchModal.toLowerCase();
    return availableSongs.filter((s) => {
      // פילטור לפי טאב (אם המשתמש הוא אורח או מארח)
      if ((isGuest && hostId) || isHost) {
        if (modalActiveTab === "my" && !s.is_owner) return false;
        if (modalActiveTab === "invited" && s.is_owner) return false;
      }
      
      // פילטור לפי חיפוש
      return (
        s.title.toLowerCase().includes(term) ||
        s.artist?.toLowerCase().includes(term) ||
        s.key_sig?.toLowerCase().includes(term) ||
        (s.bpm && s.bpm.toString().includes(term)) ||
        s.notes?.toLowerCase().includes(term) // חיפוש לפי תגית
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

  const addSong = async (songId) => {
    try {
      await api.post(`/lineup-songs/${id}`, { song_id: songId });
      const songData = allSongs.find((s) => s.id === songId);

      if (songData) {
        setSongs((prev) => [...prev, { ...songData, song_id: songData.id }]);
      }

      setSearchMain("");
      setSearchModal("");
    } catch (err) {
      console.error("❌ שגיאה:", err);
    }
  };

  const removeSong = async (songId) => {
    try {
      await api.delete(`/lineup-songs/${id}/${songId}`);
      setSongs((prev) => prev.filter((s) => s.song_id !== songId));
    } catch (err) {
      console.error("❌ שגיאה במחיקה:", err);
    }
  };

  const handleUploadChart = async (lineupSongId, file) => {
    if (!file || file.type !== "application/pdf") {
      showToast("רק קבצי PDF מותרים", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const { data } = await api.post(
        `/lineup-songs/${lineupSongId}/upload-chart`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      showToast("קובץ PDF הועלה בהצלחה", "success");
      
      // עדכון השיר ברשימה
      setSongs((prev) =>
        prev.map((s) =>
          s.id === lineupSongId
            ? { ...s, chart_pdf_url: data.chart_pdf_url }
            : s
        )
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || "שגיאה בהעלאת הקובץ",
        "error"
      );
    }
  };

  const handlePrintChart = (chartPdfUrl) => {
    if (!chartPdfUrl) {
      showToast("אין קובץ PDF להדפסה", "error");
      return;
    }

    // פתיחת חלון חדש להדפסה
    const printWindow = window.open(chartPdfUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      showToast("לא ניתן לפתוח חלון הדפסה", "error");
    }
  };

  const handlePreviewChart = (chartPdfUrl) => {
    if (!chartPdfUrl) {
      showToast("אין קובץ PDF לתצוגה מקדימה", "error");
      return;
    }

    // פתיחת PDF בחלון חדש
    window.open(chartPdfUrl, "_blank", "width=800,height=600");
  };

  const handleDragEnd = async (result) => {
    // רק אם המשתמש הוא הבעלים של הליינאפ
    if (!lineup?.is_owner) return;
    
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;

    const reordered = Array.from(songs);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    setSongs(reordered);

    try {
      await api.put(`/lineup-songs/${id}/order`, {
        songs: reordered.map((s) => s.song_id),
      });
    } catch {}
  };

  if (!lineup)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        טוען...
      </div>
    );

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
                setModalActiveTab("my"); // איפוס הטאב לטאב הראשון
              }}
              className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        {/* LIST */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="songs">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {filteredLineupSongs.map((s, index) => (
                  <Draggable
                    key={s.id || s.song_id}
                    draggableId={String(s.id || s.song_id)}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="glass rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg border border-neutral-800"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <GripVertical
                            className="text-neutral-500"
                            size={18}
                          />

                          <div className="flex-1">
                            <p className="font-semibold text-lg">
                              {index + 1}. {s.title}
                            </p>

                            <p className="text-neutral-400 text-sm">
                              {s.artist}
                            </p>

                            {/* תגיות זמן / BPM / סולם */}
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

                            {/* התגית הכתומה בשורה חדשה */}
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
                          {/* כפתור העלאת PDF - רק אם המשתמש הוא הבעלים של הליינאפ */}
                          {s.can_edit && (
                            <>
                              <input
                                type="file"
                                accept="application/pdf"
                                ref={(el) => {
                                  fileInputRefs.current[s.id] = el;
                                }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadChart(s.id, file);
                                  }
                                  e.target.value = ""; // איפוס input
                                }}
                                className="hidden"
                              />
                              <button
                                onClick={() => {
                                  fileInputRefs.current[s.id]?.click();
                                }}
                                className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full"
                                title="העלה קובץ PDF צ'ארט"
                              >
                                <Upload size={14} />
                              </button>
                            </>
                          )}

                          {/* כפתור תצוגה מקדימה - לכל המשתמשים אם יש PDF */}
                          {s.chart_pdf_url && (
                            <button
                              onClick={() => handlePreviewChart(s.chart_pdf_url)}
                              className="bg-cyan-500 hover:bg-cyan-600 p-2 rounded-full"
                              title="תצוגה מקדימה"
                            >
                              <Eye size={14} />
                            </button>
                          )}

                          {/* כפתור הדפסה - לכל המשתמשים אם יש PDF */}
                          {s.chart_pdf_url && (
                            <button
                              onClick={() => handlePrintChart(s.chart_pdf_url)}
                              className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
                              title="הדפס צ'ארט"
                            >
                              <Printer size={14} />
                            </button>
                          )}

                          {/* כפתור מחיקה - רק אם המשתמש הוא הבעלים של הליינאפ */}
                          {s.can_edit && (
                            <button
                              onClick={() => removeSong(s.song_id)}
                              className="bg-red-500 hover:bg-red-600 p-2 rounded-full"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-orange-400">
                הוסף שיר לליינאפ
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* SEARCH */}
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

            {/* טאבים במודאל - אם המשתמש הוא אורח או מארח */}
            {((isGuest && hostId) || isHost) ? (
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

            {/* SONG LIST IN MODAL — NOW WITH FULL CARD */}
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
              {filteredModalSongs.map((s) => (
                <div
                  key={s.id}
                  className="glass rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-lg border border-neutral-800"
                >
                  <div>
                    <p className="font-semibold text-lg text-white">
                      {s.title}
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
      )}
    </div>
  );
}
