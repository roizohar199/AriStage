import React, { useEffect, useState, useRef, useMemo } from "react";
import { Plus, Trash2, Edit2, X, Search, Upload, Printer, FileDown, Eye } from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useConfirm } from "@/modules/shared/hooks/useConfirm.jsx";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { io } from "socket.io-client";

export default function Songs() {
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();

  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const fileInputRefs = useRef({});

  const [form, setForm] = useState({
    title: "",
    artist: "",
    bpm: "",
    key_sig: "C Major",
    duration_sec: "00:00",
    notes: "",
  });

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

  // Socket.IO connection
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL || "http://10.0.0.99:5000";
    return io(url, { transports: ["websocket"] });
  }, []);

  useEffect(() => {
    load();
    
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
        if (user?.id) {
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
    socket.on("song:created", () => {
      load(); // רענון רשימה
    });
    
    socket.on("song:updated", ({ songId }) => {
      load(); // רענון רשימה
    });
    
    socket.on("song:deleted", ({ songId }) => {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    });
    
    socket.on("song:chart-uploaded", ({ songId, chartPdfUrl }) => {
      setSongs((prev) =>
        prev.map((s) =>
          s.id === songId ? { ...s, chart_pdf_url: chartPdfUrl } : s
        )
      );
    });
    
    return () => {
      socket.off("song:created");
      socket.off("song:updated");
      socket.off("song:deleted");
      socket.off("song:chart-uploaded");
      socket.disconnect();
    };
  }, [socket]);

  // בטיחות
  const safeKey = (key) => {
    if (!key || typeof key !== "string") return "C Major";
    const parts = key.split(" ");
    const note = notesKeys.includes(parts[0]) ? parts[0] : "C";
    const type = keysType.includes(parts[1]) ? parts[1] : "Major";
    return `${note} ${type}`;
  };

  const safeDuration = (d) => {
    if (!d || typeof d !== "string" || !d.includes(":")) return "00:00";
    let [m, s] = d.split(":");
    if (!m) m = "00";
    if (!s) s = "00";
    if (s.length === 1) s = s.padStart(2, "0");
    return `${m}:${s}`;
  };

  const getNote = () => safeKey(form.key_sig).split(" ")[0];
  const getType = () => safeKey(form.key_sig).split(" ")[1];

  const getMinutes = () => safeDuration(form.duration_sec).split(":")[0];
  const getSeconds = () => safeDuration(form.duration_sec).split(":")[1];

  const handleUploadChart = async (songId, file) => {
    if (!file || file.type !== "application/pdf") {
      showToast("רק קבצי PDF מותרים", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const { data } = await api.post(
        `/songs/${songId}/upload-chart`,
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
          s.id === songId
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

  const handleDownloadChart = (chartPdfUrl, songTitle) => {
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

  const handlePreviewChart = (chartPdfUrl) => {
    if (!chartPdfUrl) {
      showToast("אין קובץ PDF לתצוגה מקדימה", "error");
      return;
    }

    // פתיחת PDF בחלון חדש
    window.open(chartPdfUrl, "_blank", "width=800,height=600");
  };

  // שמירה
  const submit = async (e) => {
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
      load();
    } catch (err) {
      console.error("שגיאה בשמירה:", err);
    }
  };

  // מחיקה — עכשיו עם confirm מותאם!!
  const remove = async (id) => {
    const ok = await confirm("מחיקת שיר", "בטוח שאתה רוצה למחוק את השיר?");
    if (!ok) return;

    await api.delete(`/songs/${id}`);
    load();
  };

  // עריכה
  const edit = (song) => {
    setForm({
      title: song.title || "",
      artist: song.artist || "",
      bpm: song.bpm || "",
      key_sig: safeKey(song.key_sig),
      duration_sec: safeDuration(song.duration_sec),
      notes: song.notes || "",
    });

    setEditingId(song.id);
    setShowModal(true);
  };

  const filtered = songs.filter((s) => {
    // פילטור לפי טאב (אם המשתמש הוא אורח או מארח)
    if ((isGuest && hostId) || isHost) {
      if (activeTab === "my" && !s.is_owner) return false;
      if (activeTab === "invited" && s.is_owner) return false;
    }
    
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

      {/* טאבים - אם המשתמש הוא אורח או מארח */}
      {(isGuest && hostId) || isHost ? (
        <div className="flex gap-2 mb-6 bg-neutral-900 rounded-xl p-1 border border-neutral-800">
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "my"
                ? "bg-brand-orange text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            שירים שלי
          </button>
          <button
            onClick={() => setActiveTab("invited")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "invited"
                ? "bg-brand-orange text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            שירים שהוזמנתי אליהם
          </button>
        </div>
      ) : null}

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
            </div>

            <div className="flex gap-3 flex-row-reverse items-center">
              {/* כפתור העלאת PDF - רק אם המשתמש הוא הבעלים */}
              {s.is_owner && (
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
                    <Upload size={16} />
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
                  <Eye size={16} />
                </button>
              )}

              {/* כפתור הדפסה - לכל המשתמשים אם יש PDF */}
              {s.chart_pdf_url && (
                <button
                  onClick={() => handlePrintChart(s.chart_pdf_url)}
                  className="bg-green-500 hover:bg-green-600 p-2 rounded-full"
                  title="הדפס צ'ארט"
                >
                  <Printer size={16} />
                </button>
              )}

              {/* כפתור הורדה - לכל המשתמשים אם יש PDF */}
              {s.chart_pdf_url && (
                <button
                  onClick={() => handleDownloadChart(s.chart_pdf_url, s.title)}
                  className="bg-purple-500 hover:bg-purple-600 p-2 rounded-full"
                  title="שמור כקובץ PDF"
                >
                  <FileDown size={16} />
                </button>
              )}

              {/* כפתורי עריכה ומחיקה - רק אם המשתמש הוא הבעלים */}
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
    </div>
  );
}
