import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Upload,
  Printer,
  FileDown,
  Eye,
  User,
  Music,
  FileText,
} from "lucide-react";
import api from "../../shared/lib/api";
import { useConfirm } from "../../shared/hooks/useConfirm";
import { useToast } from "../../shared/components/ToastProvider";
import { io } from "socket.io-client";

export default function Songs() {
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();

  // סטייט לצ'ארטים פרטיים לכל שיר
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
    is_owner?: boolean;
    owner_id?: number;
    owner_name?: string;
    chart_pdf_url?: string | null;
    owner_avatar?: string;
    owner_role?: string;
    owner_email?: string;
  }

  const [privateCharts, setPrivateCharts] = useState<Record<number, Chart[]>>(
    {}
  );
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    artist: "",
    bpm: "",
    key_sig: "C Major",
    duration_sec: "00:00",
    notes: "",
  });
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [viewingChart, setViewingChart] = useState<string | null>(null);

  const handleDeletePrivateChart = async (songId: number, chartId: number) => {
    const ok = await confirm("מחיקת צ'ארט", "בטוח שאתה רוצה למחוק את הצ'ארט?");
    if (!ok) return;
    try {
      await api.delete(`/songs/${songId}/private-charts/${chartId}`);
      showToast("הצ'ארט נמחק בהצלחה", "success");
      // עדכן סטייט
      setPrivateCharts((prev) => ({
        ...prev,
        [songId]: prev[songId].filter((c: Chart) => c.id !== chartId),
      }));
    } catch (err) {
      showToast(err?.response?.data?.message || "שגיאה במחיקת הצ'ארט", "error");
    }
  };

  const notesList = ["שמח", "קצבי", "שקט", "מרגש", "קליל"];
  const notesKeys = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const keysType = ["Major", "Minor"];

  // טעינת שירים
  const load = async () => {
    try {
      const { data } = await api.get("/songs");
      setSongs(data);
    } catch (err) {
      console.error("שגיאה בטעינת שירים:", err);
    }
  };

  // Load private charts for each song
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

  // Socket.IO connection
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

  useEffect(() => {
    load();

    if (!socket) return;

    // בדיקה אם המשתמש הוא אורח או מארח
    async function checkGuest() {
      try {
        const { data } = await api.get("/users/check-guest", {
          skipErrorToast: true,
        });
        setIsGuest(data.isGuest);
        setHostId(data.hostId || null);
        setIsHost(data.isHost || false);

        // הצטרפות ל-rooms של Socket.IO
        const user = JSON.parse(localStorage.getItem("ari_user") || "{}");
        if (user?.id && socket) {
          socket.emit("join-user", user.id);
          socket.emit("join-songs", user.id);

          if (data.isHost) {
            socket.emit("join-host", user.id);
          }

          if (data.hostId) {
            socket.emit("join-host", data.hostId);
          }
        }
      } catch (err) {
        console.error("שגיאה בבדיקת סטטוס אורח:", err);
      }
    }

    checkGuest();

    // Socket.IO listeners
    socket.on("song:created", ({ song, songId }) => {
      // אם יש את הנתונים המלאים - פשוט להוסיף
      if (song) {
        setSongs((prev) => [song, ...prev]);
      } else if (songId) {
        // אם לא - לטעון רק את השיר החדש
        api
          .get(`/songs/${songId}`, { skipErrorToast: true })
          .then(({ data }) => {
            setSongs((prev) => [data, ...prev]);
          })
          .catch(() => {
            // אם נכשל - לטעון הכל
            load();
          });
      } else {
        load(); // fallback
      }
    });

    socket.on("song:updated", ({ song, songId }) => {
      // אם יש את הנתונים המלאים - פשוט לעדכן
      if (song) {
        setSongs((prev) => prev.map((s) => (s.id === song.id ? song : s)));
      } else if (songId) {
        // אם לא - לטעון רק את השיר שעודכן
        api
          .get(`/songs/${songId}`, { skipErrorToast: true })
          .then(({ data }) => {
            setSongs((prev) => prev.map((s) => (s.id === songId ? data : s)));
          })
          .catch(() => {
            // אם נכשל - לטעון הכל
            load();
          });
      } else {
        load(); // fallback
      }
    });

    socket.on("song:deleted", ({ songId }) => {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    });

    socket.on("song:chart-uploaded", ({ songId, chartPdfUrl }) => {
      // Reload charts for this song
      api
        .get(`/songs/${songId}/private-charts`)
        .then(({ data }) => {
          setPrivateCharts((prev) => ({
            ...prev,
            [songId]: data.charts || [],
          }));
        })
        .catch(() => {
          console.error("שגיאה בטעינת צ'ארטים");
        });
    });

    socket.on("song:chart-deleted", ({ songId }) => {
      // Reload charts for this song
      api
        .get(`/songs/${songId}/private-charts`)
        .then(({ data }) => {
          setPrivateCharts((prev) => ({
            ...prev,
            [songId]: data.charts || [],
          }));
        })
        .catch(() => {
          console.error("שגיאה בטעינת צ'ארטים");
        });
    });

    // האזנה ל-custom events לעדכון אוטומטי אחרי כל פעולה
    const handleDataRefresh = (
      event: CustomEvent<{ type: string; action: string }>
    ) => {
      const { type, action } = event.detail || {};
      if (type === "song") {
        load(); // רענון רשימת שירים
      }
    };

    window.addEventListener("data-refresh", handleDataRefresh);

    return () => {
      if (socket) {
        socket.off("song:created");
        socket.off("song:updated");
        socket.off("song:deleted");
        socket.off("song:chart-uploaded");
        socket.off("song:chart-deleted");
        socket.disconnect();
      }
      window.removeEventListener("data-refresh", handleDataRefresh);
    };
  }, [socket]);

  // בטיחות
  const safeKey = (key: string) => {
    if (!key || typeof key !== "string") return "C Major";
    const parts = key.split(" ");
    const note = notesKeys.includes(parts[0]) ? parts[0] : "C";
    const type = keysType.includes(parts[1]) ? parts[1] : "Major";
    return `${note} ${type}`;
  };

  const safeDuration = (d: string | number) => {
    if (!d) return "00:00";
    const str = typeof d === "number" ? String(d) : d;
    if (typeof str !== "string" || !str.includes(":")) return "00:00";
    let [m, s] = str.split(":");
    if (!m) m = "00";
    if (!s) s = "00";
    if (s.length === 1) s = s.padStart(2, "0");
    return `${m}:${s}`;
  };

  const getNote = () => safeKey(form.key_sig).split(" ")[0];
  const getType = () => safeKey(form.key_sig).split(" ")[1];

  const getMinutes = () => safeDuration(form.duration_sec).split(":")[0];
  const getSeconds = () => safeDuration(form.duration_sec).split(":")[1];

  const handleUploadChart = async (songId: number, file: File) => {
    // Allow PDF and image files
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/jpg",
    ];

    if (!file || !allowedTypes.includes(file.type)) {
      showToast("רק קבצי PDF או תמונה (JPG, PNG, GIF) מותרים", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      await api.post(`/songs/${songId}/private-charts`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showToast("הקובץ הועלה בהצלחה", "success");

      // Reload charts for this song
      try {
        const { data: chartsData } = await api.get(
          `/songs/${songId}/private-charts`
        );
        setPrivateCharts((prev) => ({
          ...prev,
          [songId]: chartsData.charts || [],
        }));
      } catch (err) {
        console.error("שגיאה בטעינת צ'ארטים:", err);
      }

      // עדכון כל הקומפוננטות דרך custom event
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "song", action: "chart-uploaded" },
        })
      );
    } catch (err) {
      showToast(err?.response?.data?.message || "שגיאה בהעלאת הקובץ", "error");
    }
  };

  const handleViewChart = (chartUrl: string) => {
    if (!chartUrl) {
      showToast("אין קובץ לצפייה", "error");
      return;
    }
    setViewingChart(chartUrl);
  };

  const handlePrintChart = (chartPdfUrl: string) => {
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

  const handleDownloadChart = (chartPdfUrl: string, songTitle: string) => {
    if (!chartPdfUrl) {
      showToast("אין קובץ PDF להורדה", "error");
      return;
    }

    // יצירת קישור להורדה
    const link = document.createElement("a");
    link.href = chartPdfUrl;
    link.download = `${songTitle || "chart"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // הוסרו פעולות על צ'ארט ציבורי לטובת פרטיות מוחלטת

  // שמירה
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanForm = {
      ...form,
      key_sig: safeKey(form.key_sig),
      duration_sec: safeDuration(form.duration_sec),
    };

    try {
      if (editingId) {
        await api.put(`/songs/${editingId}`, cleanForm);
      } else {
        await api.post("/songs", cleanForm);
      }

      setForm({
        title: "",
        artist: "",
        bpm: "",
        key_sig: "C Major",
        duration_sec: "00:00",
        notes: "",
      });

      setEditingId(null);
      setShowModal(false);
      // רענון מיידי
      load();
      // עדכון כל הקומפוננטות דרך custom event
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "song", action: editingId ? "updated" : "created" },
        })
      );
    } catch (err) {
      console.error("שגיאה בשמירה:", err);
    }
  };

  // מחיקה — עכשיו עם confirm מותאם!!
  const remove = async (songId: number) => {
    const ok = await confirm("מחיקת שיר", "בטוח שאתה רוצה למחוק את השיר?");
    if (!ok) return;

    await api.delete(`/songs/${songId}`);
    // רענון מיידי
    load();
    // עדכון כל הקומפוננטות דרך custom event
    window.dispatchEvent(
      new CustomEvent("data-refresh", {
        detail: { type: "song", action: "deleted" },
      })
    );
  };

  // עריכה
  const edit = (song: Song) => {
    setForm({
      title: song.title || "",
      artist: song.artist || "",
      bpm: String(song.bpm || ""),
      key_sig: safeKey(song.key_sig),
      duration_sec: safeDuration(song.duration_sec),
      notes: song.notes || "",
    });

    setEditingId(song.id);
    setShowModal(true);
  };

  const filtered = songs.filter((s) => {
    // הצג רק שירים אישיים
    if (!s.is_owner) return false;

    // פילטור לפי חיפוש
    return (
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.artist?.toLowerCase().includes(search.toLowerCase()) ||
      s.key_sig?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div dir="rtl" className="min-h-screen text-white p-6">
      {/* 🔥 מודל אישור גלובלי */}
      <ConfirmModalComponent />

      {/* כותרת */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">מאגר השירים</h1>

        <button
          onClick={() => {
            setShowModal(true);
            setEditingId(null);
            setForm({
              title: "",
              artist: "",
              bpm: "",
              key_sig: "C Major",
              duration_sec: "00:00",
              notes: "",
            });
          }}
          className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold rounded-full p-2 flex items-center justify-center transition-all"
        >
          <Plus size={18} />
        </button>
      </header>

      {/* חיפוש */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="חפש לפי שם, אמן, BPM או סולם..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 pl-10 text-sm placeholder-neutral-500"
        />
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          size={18}
        />
      </div>

      {/* רשימת שירים */}
      <div className="space-y-3">
        {filtered.map((s, i) => (
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

              {/* הצגת הצ'ארטים הפרטיים של המשתמש */}
              {privateCharts[s.id] && privateCharts[s.id].length > 0 && (
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
                          onClick={() => handleViewChart(chart.file_path)}
                          className="bg-cyan-600 hover:bg-cyan-700 p-1.5 rounded-full transition-colors"
                          title="צפייה"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadChart(chart.file_path, s.title)
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

            <div className="flex gap-3 flex-row-reverse items-center">
              {/* העלאת PDF - כל משתמש יכול להעלות צ'ארט פרטי משלו */}
              <>
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
                  className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full"
                  title="העלה קובץ"
                >
                  <Upload size={16} />
                </button>
              </>

              {/* מחיקת שיר + עריכה - רק לבעלים */}
              {s.is_owner && (
                <>
                  <button
                    onClick={() => remove(s.id)}
                    className="bg-red-500 hover:bg-red-600 p-2 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    onClick={() => edit(s)}
                    className="bg-neutral-700 hover:bg-neutral-600 p-2 rounded-full"
                  >
                    <Edit2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* מודאל הוספה/עריכה */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-6 relative border border-neutral-800 shadow-xl">
            <button
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}
              className="absolute top-3 left-3 text-neutral-400 hover:text-white"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-bold mb-4">
              {editingId ? "עריכת שיר 🎧" : "הוסף שיר חדש"}
            </h2>

            <form onSubmit={submit} className="space-y-4">
              {/* שם השיר */}
              <input
                placeholder="שם השיר *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm"
                required
              />

              {/* אמן */}
              <input
                placeholder="אמן"
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
                className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm"
              />

              {/* BPM */}
              <input
                placeholder="BPM"
                type="number"
                min="1"
                max="350"
                value={form.bpm}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, bpm: val });
                }}
                className="w-full bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm"
              />

              {/* תו סולם */}
              <div>
                <p className="text-sm text-neutral-400 mb-1">סולם השיר:</p>
                <div className="flex flex-wrap gap-2">
                  {notesKeys.map((note) => (
                    <button
                      type="button"
                      key={note}
                      onClick={() =>
                        setForm({ ...form, key_sig: `${note} ${getType()}` })
                      }
                      className={`
                        px-3 py-1 rounded-full text-sm border transition
                        ${
                          getNote() === note
                            ? "bg-brand-orange border-brand-orange text-black"
                            : "bg-neutral-800 border-neutral-700 text-neutral-300"
                        }
                      `}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              {/* סוג סולם */}
              <div>
                <div className="flex gap-2">
                  {keysType.map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() =>
                        setForm({ ...form, key_sig: `${getNote()} ${type}` })
                      }
                      className={`
                        px-3 py-1 rounded-full text-sm border transition
                        ${
                          getType() === type
                            ? "bg-brand-orange border-brand-orange text-black"
                            : "bg-neutral-800 border-neutral-700 text-neutral-300"
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* זמן */}
              <div>
                <p className="text-sm text-neutral-400 mb-1">משך זמן:</p>

                <div className="flex flex-row-reverse gap-2 items-center justify-end w-fit">
                  {/* דקות */}
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={Number(getMinutes())} // שים לב!
                    onChange={(e) => {
                      const minutes =
                        e.target.value === "" ? "0" : Number(e.target.value);
                      const seconds = getSeconds();
                      setForm({
                        ...form,
                        duration_sec: `${minutes}:${seconds}`,
                      });
                    }}
                    className="flex-row-reverse w-20 bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm text-center"
                  />

                  <span>:</span>

                  {/* שניות */}
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={Number(getSeconds())} // בלי אפסים מובילים
                    onChange={(e) => {
                      const val = e.target.value;
                      const seconds = val === "" ? "0" : Number(val);
                      const minutes = getMinutes();
                      setForm({
                        ...form,
                        duration_sec: `${minutes}:${seconds}`,
                      });
                    }}
                    className="w-20 bg-neutral-800 p-2 rounded-lg border border-neutral-700 text-sm text-center"
                  />
                </div>
              </div>

              {/* תגיות */}
              <div>
                <p className="text-sm text-neutral-400 mb-1">תגית:</p>
                <div className="flex flex-wrap gap-2">
                  {notesList.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setForm({ ...form, notes: tag })}
                      className={`
                        px-3 py-1 rounded-full text-sm border transition
                        ${
                          form.notes === tag
                            ? "bg-brand-orange border-brand-orange text-black"
                            : "bg-neutral-800 border-neutral-700 text-neutral-300"
                        }
                      `}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold py-2 rounded-lg mt-2 transition-all"
              >
                {editingId ? "עדכון" : "שמור"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* מודאל צפייה בצ'ארט */}
      {viewingChart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl w-full max-w-6xl h-[90vh] relative border border-neutral-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText size={20} className="text-cyan-400" />
                צפייה בצ'ארט
              </h3>
              <button
                onClick={() => setViewingChart(null)}
                className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewingChart.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={viewingChart}
                  alt="צ'ארט"
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={viewingChart}
                  className="w-full h-full rounded-lg border border-neutral-700"
                  title="PDF Viewer"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
