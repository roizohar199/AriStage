import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import {
  Plus,
  Trash2,
  Edit2,
  User,
  Music,
  FileText,
  CalendarCheck,
  Users,
  UserPlus,
  X,
  MapPin,
  CalendarDays,
  Clock,
  Pencil,
  Search as SearchIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddNewSong, SongForm } from "../../shared/components/Addnewsong";
import CreateLineup from "../../shared/components/Createlineup";
import Search from "../../shared/components/Search";
import Charts from "../../shared/components/Charts";
import CardSong from "../../shared/components/cardsong";
import BlockLineup from "../../shared/components/blocklineup";
import api from "@/modules/shared/lib/api.js";
import { useConfirm } from "../../shared/hooks/useConfirm";
import { useToast } from "../../shared/components/ToastProvider";

import ConfirmModal from "../../shared/components/ConfirmModal";
import { io } from "socket.io-client";

function PersonalStats({
  stats,
  connectedArtistsCount,
}: {
  stats: any;
  connectedArtistsCount: number;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Music size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats?.songs ?? 0}</span>
          <span className="text-sm text-neutral-300">שירים שלך</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <CalendarCheck size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats?.lineups ?? 0}</span>
          <span className="text-sm text-neutral-300">ליינאפים שיצרת</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Users size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{connectedArtistsCount}</span>
          <span className="text-sm text-neutral-300">אמנים מחוברים אליך</span>
        </div>
      </div>
    </div>
  );
}

export default function My(): JSX.Element {
  // --- סטייטים כלליים ---
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedArtistsCount, setConnectedArtistsCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState<
    "songs" | "lineups" | "shared"
  >("songs");
  const navigate = useNavigate();

  // --- סטייטים של טאב השירים ---
  // --- אמנים שהזמנתי למאגר שלי ---
  const [myInvitedArtists, setMyInvitedArtists] = useState<any[]>([]);
  const [myInvitedArtistsLoading, setMyInvitedArtistsLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sharedSearch, setSharedSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  // --- טעינת אמנים שהזמנתי ---
  const loadMyInvitedArtists = useCallback(async () => {
    try {
      setMyInvitedArtistsLoading(true);
      const { data } = await api.get("/users/connected-to-me", {
        skipErrorToast: true,
      });
      setMyInvitedArtists(data || []);
    } catch (err) {
      setMyInvitedArtists([]);
    } finally {
      setMyInvitedArtistsLoading(false);
    }
  }, []);

  // --- שליחת הזמנה לאמן ---
  const sendInvitation = async (e) => {
    e.preventDefault();

    if (!inviteEmail || !inviteEmail.includes("@")) {
      showToast("נא להזין כתובת אימייל תקינה", "error");
      return;
    }

    try {
      setInviteLoading(true);
      const { data } = await api.post("/users/send-invitation", {
        email: inviteEmail,
      });

      setInviteEmail("");
      setShowInviteModal(false);
      showToast(data.message || "הזמנה נשלחה בהצלחה!", "success");
      loadMyInvitedArtists();
      loadConnectedArtists();
    } catch (err) {
      console.error("❌ שגיאה בשליחת הזמנה:", err);
      const errorMsg = err?.response?.data?.message || "שגיאה בשליחת ההזמנה";
      setShowInviteModal(false);
      showToast(errorMsg, "error");
    } finally {
      setInviteLoading(false);
    }
  };
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();
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
  const [isGuest, setIsGuest] = useState(false);
  const [hostId, setHostId] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);

  // --- סטייטים של טאב הלינאפים (הועתק מ-Lineup) ---
  const [lineups, setLineups] = useState<any[]>([]);
  const [showLineupModal, setShowLineupModal] = useState(false);
  const [isEditingLineup, setIsEditingLineup] = useState(false);
  const [editLineupId, setEditLineupId] = useState<number | null>(null);
  const [lineupForm, setLineupForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });
  const [lineupSearch, setLineupSearch] = useState("");

  // --- סטייטים וטעינות כלליים ---
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/dashboard-stats", {
        skipErrorToast: true,
      });
      setStats(data?.stats || null);
    } catch (err) {
      setError("לא ניתן לטעון נתונים");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadConnectedArtists = useCallback(async () => {
    try {
      const { data } = await api.get("/users/connected-to-me", {
        skipErrorToast: true,
      });
      setConnectedArtistsCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setConnectedArtistsCount(0);
    }
  }, []);
  useEffect(() => {
    loadStats();
    loadConnectedArtists();
    loadMyInvitedArtists();
  }, [loadStats, loadConnectedArtists, loadMyInvitedArtists]);

  // --- לוגיקת שירים (הועתקה מ-Songs) ---
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
  const keysType = [
    "Major",
    "Minor",
    "Harmonic Minor",
    "Melodic Minor",
    "Dorian",
    "Phrygian",
    "Lydian",
    "Mixolydian",
    "Aeolian",
  ];
  const load = async () => {
    try {
      const { data } = await api.get("/songs");
      setSongs(data);
    } catch (err) {
      console.error("שגיאה בטעינת שירים:", err);
    }
  };
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
    async function checkGuest() {
      try {
        const { data } = await api.get("/users/check-guest", {
          skipErrorToast: true,
        });
        setIsGuest(data.isGuest);
        setHostId(data.hostId || null);
        setIsHost(data.isHost || false);
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
    socket.on("song:created", ({ song, songId }) => {
      if (song) {
        setSongs((prev) => [song, ...prev]);
      } else if (songId) {
        api
          .get(`/songs/${songId}`, { skipErrorToast: true })
          .then(({ data }) => setSongs((prev) => [data, ...prev]))
          .catch(() => load());
      } else {
        load();
      }
    });
    socket.on("song:updated", ({ song, songId }) => {
      if (song) {
        setSongs((prev) => prev.map((s) => (s.id === song.id ? song : s)));
      } else if (songId) {
        api
          .get(`/songs/${songId}`, { skipErrorToast: true })
          .then(({ data }) =>
            setSongs((prev) => prev.map((s) => (s.id === songId ? data : s)))
          )
          .catch(() => load());
      } else {
        load();
      }
    });
    socket.on("song:deleted", ({ songId }) => {
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    });
    socket.on("song:chart-uploaded", ({ songId }) => {
      api
        .get(`/songs/${songId}/private-charts`)
        .then(({ data }) =>
          setPrivateCharts((prev) => ({ ...prev, [songId]: data.charts || [] }))
        )
        .catch(() => console.error("שגיאה בטעינת צ'ארטים"));
    });
    socket.on("song:chart-deleted", ({ songId }) => {
      api
        .get(`/songs/${songId}/private-charts`)
        .then(({ data }) =>
          setPrivateCharts((prev) => ({ ...prev, [songId]: data.charts || [] }))
        )
        .catch(() => console.error("שגיאה בטעינת צ'ארטים"));
    });
    const handleDataRefresh = (
      event: CustomEvent<{ type: string; action: string }>
    ) => {
      const { type } = event.detail || {};
      if (type === "song") {
        load();
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
  const safeKey = (key: string) => {
    if (!key || typeof key !== "string") return "C Major";
    const trimmed = key.trim();
    // Find the longest matching mode at the end of the string (case-insensitive)
    let foundMode = "";
    let root = "";
    for (const mode of keysType.sort((a, b) => b.length - a.length)) {
      if (trimmed.toLowerCase().endsWith(mode.toLowerCase())) {
        foundMode = mode;
        root = trimmed.slice(0, -mode.length).trim();
        break;
      }
    }
    if (!foundMode) {
      // fallback
      const parts = trimmed.split(" ");
      root = notesKeys.includes(parts[0]) ? parts[0] : "C";
      foundMode = "Major";
    } else {
      root = notesKeys.includes(root) ? root : "C";
    }
    return `${root} ${foundMode}`;
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
      load();
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "song", action: editingId ? "updated" : "created" },
        })
      );
    } catch (err) {
      console.error("שגיאה בשמירה:", err);
    }
  };
  const remove = async (songId: number) => {
    const ok = await confirm("מחיקת שיר", "בטוח שאתה רוצה למחוק את השיר?");
    if (!ok) return;
    await api.delete(`/songs/${songId}`);
    load();
    window.dispatchEvent(
      new CustomEvent("data-refresh", {
        detail: { type: "song", action: "deleted" },
      })
    );
  };
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
    if (!s.is_owner) return false;
    return (
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.artist?.toLowerCase().includes(search.toLowerCase()) ||
      s.key_sig?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // --- לוגיקת ליינאפים (מועתק מ-Lineup) ---
  const normalizeDate = (d: any) => {
    if (!d) return "";
    const obj = new Date(d);
    if (isNaN(obj as unknown as number)) return "";
    return obj.toISOString().slice(0, 10);
  };

  const normalizeTime = (t: any) => {
    if (!t) return "";
    return t.toString().slice(0, 5);
  };

  const formatForDisplay = (d: any) => {
    if (!d) return "לא צוין תאריך";
    const obj = new Date(d);
    if (isNaN(obj as unknown as number)) return "לא צוין תאריך";
    return obj.toLocaleDateString("he-IL");
  };

  const loadLineups = useCallback(async () => {
    try {
      const { data } = await api.get("/lineups");
      setLineups(data);
    } catch (err) {
      console.error("❌ שגיאה בטעינת ליינאפים:", err);
    }
  }, []);

  useEffect(() => {
    loadLineups();

    if (!socket) return;

    const user = JSON.parse(localStorage.getItem("ari_user") || "{}");
    if (user?.id) {
      socket.emit("join-user", user.id);
      socket.emit("join-lineups", user.id);
    }

    socket.on("lineup:created", ({ lineup, lineupId }) => {
      const id = lineup?.id || lineupId;
      if (!id) return;

      setLineups((prev) => {
        if (prev.some((l) => l.id === id)) return prev;
        return lineup ? [lineup, ...prev] : prev;
      });

      if (!lineup && lineupId) {
        api.get(`/lineups/${lineupId}`).then(({ data }) => {
          setLineups((prev) => {
            if (prev.some((l) => l.id === data.id)) return prev;
            return [data, ...prev];
          });
        });
      }
    });

    socket.on("lineup:updated", ({ lineup, lineupId }) => {
      const id = lineup?.id || lineupId;
      if (!id) return;

      if (lineup) {
        setLineups((prev) =>
          prev.map((l) => (l.id === lineup.id ? lineup : l))
        );
      } else {
        api.get(`/lineups/${lineupId}`).then(({ data }) => {
          setLineups((prev) => prev.map((l) => (l.id === lineupId ? data : l)));
        });
      }
    });

    socket.on("lineup:deleted", ({ lineupId }) => {
      setLineups((prev) => prev.filter((l) => l.id !== lineupId));
    });

    socket.on("lineup-song:added", ({ lineupId }) => {
      setLineups((prev) =>
        prev.map((l) =>
          l.id === lineupId
            ? { ...l, songs_count: (l.songs_count || 0) + 1 }
            : l
        )
      );
    });

    socket.on("lineup-song:removed", ({ lineupId }) => {
      setLineups((prev) =>
        prev.map((l) =>
          l.id === lineupId
            ? { ...l, songs_count: Math.max((l.songs_count || 1) - 1, 0) }
            : l
        )
      );
    });

    socket.on("lineup-song:reordered", ({ lineupId }) => {
      api.get(`/lineups/${lineupId}`).then(({ data }) => {
        setLineups((prev) => prev.map((l) => (l.id === lineupId ? data : l)));
      });
    });

    return () => {
      if (socket) {
        socket.off("lineup:created");
        socket.off("lineup:updated");
        socket.off("lineup:deleted");
        socket.off("lineup-song:added");
        socket.off("lineup-song:removed");
        socket.off("lineup-song:reordered");
      }
    };
  }, [socket, loadLineups]);

  const openCreateLineupModal = () => {
    setLineupForm({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
    });
    setIsEditingLineup(false);
    setEditLineupId(null);
    setShowLineupModal(true);
  };

  const openEditLineupModal = (lineup: any) => {
    setLineupForm({
      title: lineup.title || "",
      date: normalizeDate(lineup.date),
      time: normalizeTime(lineup.time),
      location: lineup.location || "",
      description: lineup.description || "",
    });

    setEditLineupId(lineup.id);
    setIsEditingLineup(true);
    setShowLineupModal(true);
  };

  const submitLineup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!lineupForm.title.trim()) return;

    try {
      if (isEditingLineup && editLineupId) {
        await api.put(`/lineups/${editLineupId}`, lineupForm);
      } else {
        await api.post("/lineups", lineupForm);
      }

      // ריענון מיידי כדי לראות את הליינאפ החדש בלי להמתין לסוקט
      loadLineups();

      setShowLineupModal(false);
      setIsEditingLineup(false);
      setEditLineupId(null);
    } catch (err) {
      console.error("❌ שגיאה בשמירת ליינאפ:", err);
    }
  };

  const removeLineup = async (id: number) => {
    const ok = await confirm("מחיקה", "בטוח למחוק את הליינאפ?");
    if (!ok) return;

    try {
      await api.delete(`/lineups/${id}`);
      setLineups((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("❌ שגיאה במחיקת ליינאפ:", err);
    }
  };

  const filteredLineups = lineups.filter(
    (l) =>
      l.title?.toLowerCase().includes(lineupSearch.toLowerCase()) ||
      l.location?.toLowerCase().includes(lineupSearch.toLowerCase()) ||
      l.date?.toLowerCase().includes(lineupSearch.toLowerCase()) ||
      l.description?.toLowerCase().includes(lineupSearch.toLowerCase())
  );

  // --- רנדר ---
  return (
    <div dir="rtl" className="min-h-screen text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">אישי</h1>
      </header>

      <ConfirmModalComponent />

      {loading && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען נתונים...
        </div>
      )}
      {error && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-red-400">
          {error}
        </div>
      )}

      {stats && (
        <PersonalStats
          stats={stats}
          connectedArtistsCount={connectedArtistsCount}
        />
      )}

      {/* Tabs block below stats */}
      <div className="flex justify-between mt-8 bg-neutral-800 rounded-2xl mb-6 overflow-hidden  w-fit">
        <button
          className={`px-6 py-2  transition ${
            selectedTab === "songs"
              ? "w-fit border-b-2 border-brand-orange overflow-hidden text-brand-orange font-bold"
              : "font-bold text-white"
          }`}
          onClick={() => setSelectedTab("songs")}
        >
          שירים
        </button>
        <button
          className={`px-6 py-2  transition ${
            selectedTab === "lineups"
              ? "w-fit border-b-2 border-brand-orange overflow-hidden text-brand-orange font-bold"
              : "font-bold text-white"
          }`}
          onClick={() => setSelectedTab("lineups")}
        >
          לינאפים
        </button>
        <button
          className={`px-6 py-2  transition ${
            selectedTab === "shared"
              ? "w-fit border-b-2 border-brand-orange overflow-hidden text-brand-orange font-bold"
              : "font-bold text-white "
          }`}
          onClick={() => setSelectedTab("shared")}
        >
          משותפים
        </button>
      </div>

      {/* --- תוכן טאב השירים --- */}
      {selectedTab === "songs" && (
        <>
          <div className="flex items-center gap-3 mb-3">
            {/* חיפוש */}
            <Search
              value={search}
              variant="song"
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* הוסף שיר */}
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
              className="
  w-auto
  bg-brand-orange
  text-black
  font-semibold
  rounded-2xl
  gap-1
  flex flex-row-reverse items-center justify-center
  px-4 py-2
"
            >
              <Plus size={18} />
              הוסף שיר
            </button>
          </div>

          {/* רשימת שירים */}
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <CardSong
                key={s.id}
                song={s}
                index={i}
                safeKey={safeKey}
                safeDuration={safeDuration}
                onEdit={edit}
                onRemove={remove}
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
          {/* מודאל הוספה/עריכה */}
          <AddNewSong
            open={showModal}
            onClose={() => {
              setShowModal(false);
              setEditingId(null);
            }}
            onSubmit={async (formData, editId) => {
              const cleanForm = {
                ...formData,
                key_sig: safeKey(formData.key_sig),
                duration_sec: safeDuration(formData.duration_sec),
              };
              try {
                if (editId) {
                  await api.put(`/songs/${editId}`, cleanForm);
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
                window.dispatchEvent(
                  new CustomEvent("data-refresh", {
                    detail: {
                      type: "song",
                      action: editId ? "updated" : "created",
                    },
                  })
                );
              } catch (err) {
                console.error("שגיאה בשמירה:", err);
              }
            }}
            initialForm={form}
            editingId={editingId}
            notesList={notesList}
            notesKeys={notesKeys}
            keysType={keysType}
          />
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
                    className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-2 rounded-full"
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
        </>
      )}
      {/* --- תוכן טאב הלינאפים --- */}
      {selectedTab === "lineups" && (
        <>
          <div className="flex items-center gap-3 mb-3">
            {/* חיפוש */}
            <Search
              value={lineupSearch}
              variant="lineup"
              onChange={(e) => setLineupSearch(e.target.value)}
            />
            {/* צור לינאפ חדש */}
            <button
              onClick={() => {
                setShowLineupModal(true);
                setIsEditingLineup(false);
                setEditLineupId(null);
                setLineupForm({
                  title: "",
                  date: "",
                  time: "",
                  location: "",
                  description: "",
                });
              }}
              className="
  w-auto
  bg-brand-orange
  text-black
  font-semibold
  rounded-2xl
  gap-1
  flex flex-row-reverse items-center justify-center
  px-4 py-2
"
            >
              <Plus size={18} />
              צור לינאפ חדש
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLineups.map((l, i) => (
              <BlockLineup
                key={l.id}
                lineup={l}
                index={i}
                onOpen={() => navigate(`/lineup/${l.id}`)}
                onEdit={() => openEditLineupModal(l)}
                onDelete={() => removeLineup(l.id)}
              />
            ))}
          </div>

          {filteredLineups.length === 0 && (
            <p className="text-neutral-500 text-center mt-10">
              אין ליינאפים עדיין 😴
            </p>
          )}

          {/* Create/Edit Lineup modal (new component) */}
          <CreateLineup
            open={showLineupModal}
            onClose={() => {
              setShowLineupModal(false);
              setIsEditingLineup(false);
              setEditLineupId(null);
            }}
            onSubmit={async ({ name, description, date, time, location }) => {
              try {
                if (isEditingLineup && editLineupId) {
                  await api.put(`/lineups/${editLineupId}`, {
                    title: name,
                    description,
                    date,
                    time,
                    location,
                  });
                } else {
                  await api.post("/lineups", {
                    title: name,
                    description,
                    date,
                    time,
                    location,
                  });
                }
                loadLineups();
                setShowLineupModal(false);
                setIsEditingLineup(false);
                setEditLineupId(null);
              } catch (err) {
                console.error("❌ שגיאה בשמירת ליינאפ:", err);
              }
            }}
            initialForm={
              isEditingLineup
                ? {
                    name: lineupForm.title,
                    description: lineupForm.description,
                    date: lineupForm.date,
                    time: lineupForm.time,
                    location: lineupForm.location,
                  }
                : undefined
            }
            editing={isEditingLineup}
          />
        </>
      )}
      {/* --- תוכן טאב משותפים --- */}
      {selectedTab === "shared" && (
        <div className="space-y-3">
          {/* הזמנות ממתינות */}

          {/* המאגרים שלי */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* חיפוש */}
              <Search
                value={sharedSearch}
                variant="artist"
                onChange={(e) => setSharedSearch(e.target.value)}
              />
              {/* הזמן אמן */}
              <button
                onClick={() => setShowInviteModal(true)}
                className="
  w-auto
  bg-brand-orange
  text-black
  font-semibold
  rounded-2xl
  gap-1
  flex flex-row-reverse items-center justify-center
  px-4 py-2
"
                title="הזמן אמן למאגר שלך"
                style={{ minWidth: 0 }}
              >
                <UserPlus size={18} />
                הזמן אמן
              </button>
            </div>
            <div>
              {myInvitedArtistsLoading ? (
                <div className="text-neutral-400 text-center py-4">
                  טוען אמנים...
                </div>
              ) : myInvitedArtists.length === 0 ? (
                <div className="bg-neutral-800 rounded-2xl p-6 text-center">
                  <User size={32} className="mx-auto mb-3 text-neutral-600" />
                  <p className="text-neutral-400 text-sm">
                    אין אמנים במאגר שלך כרגע
                  </p>
                  <p className="text-neutral-500 text-xs mt-1">
                    הזמן אמנים למאגר שלך באמצעות הכפתור למעלה
                  </p>
                </div>
              ) : (
                <div className="">
                  {myInvitedArtists
                    .filter(
                      (artist) =>
                        artist.full_name
                          ?.toLowerCase()
                          .includes(sharedSearch.toLowerCase()) ||
                        artist.email
                          ?.toLowerCase()
                          .includes(sharedSearch.toLowerCase()) ||
                        artist.artist_role
                          ?.toLowerCase()
                          .includes(sharedSearch.toLowerCase())
                    )
                    .map((artist) => (
                      <div
                        key={artist.id}
                        className="bg-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                      >
                        {/* תמונת פרופיל */}
                        <div className="w-36 h-36 shrink-0 rounded-full overflow-hidden border-2 border-brand-orange">
                          {artist.avatar ? (
                            <img
                              src={artist.avatar}
                              alt={artist.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="w-16 h-16 rounded-full bg-neutral-700 border-2 border-brand-orange flex items-center justify-center"
                            style={{ display: artist.avatar ? "none" : "flex" }}
                          >
                            <User size={24} className="text-neutral-500" />
                          </div>
                        </div>
                        {/* פרטי האמן */}
                        <div className="flex-1 min-w-0 text-right">
                          <h3 className="text-lg font-bold text-white mb-1">
                            {artist.full_name || "אמן ללא שם"}
                          </h3>
                          {artist.artist_role && (
                            <div className="mb-2">
                              <span className="flex flex-row-reverse inline-flex items-center gap-1 px-2 py-1 bg-brand-orange rounded-2xl text-black font-semibold text-xs">
                                <Music size={12} />
                                {artist.artist_role}
                              </span>
                            </div>
                          )}
                          {artist.email && (
                            <p className="w-fit bg-neutral-900 px-2 py-1 bg-neutral-800 rounded-2xl text-white text-xs">
                              {artist.email}
                            </p>
                          )}
                        </div>
                        {/* כפתור ביטול שיתוף */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => {
                              setConfirmModal({
                                show: true,
                                title: "ביטול שיתוף",
                                message: `בטוח שאתה רוצה לבטל את השיתוף עם ${
                                  artist.full_name || "האמן"
                                }? האמן לא יוכל עוד לצפות בליינאפים והשירים שלך.`,
                                onConfirm: async () => {
                                  setInviteLoading(true);
                                  try {
                                    await api.post("/users/uninvite-artist", {
                                      artist_id: artist.id,
                                    });
                                    showToast("השיתוף בוטל בהצלחה", "success");
                                    loadMyInvitedArtists();
                                  } catch (err) {
                                    const errorMsg =
                                      err?.response?.data?.message ||
                                      "שגיאה בביטול השיתוף";
                                    showToast(errorMsg, "error");
                                  } finally {
                                    setInviteLoading(false);
                                    setConfirmModal({
                                      show: false,
                                      title: "",
                                      message: "",
                                      onConfirm: null,
                                    });
                                  }
                                },
                              });
                            }}
                            disabled={inviteLoading}
                            className="w-6 h-6 text-red-500 hover:text-red-400"
                            title="בטל שיתוף מאגר"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal for cancel share */}
      {confirmModal.show && (
        <ConfirmModal
          show={confirmModal.show}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() =>
            setConfirmModal({
              show: false,
              title: "",
              message: "",
              onConfirm: null,
            })
          }
        />
      )}

      {/* מודאל הזמנת אמן */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-6 relative shadow-xl">
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail("");
              }}
              className="absolute top-3 left-3 text-neutral-400 hover:text-white"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              הזמן אמן למאגר שלך
            </h2>

            <p className="text-neutral-400 text-sm mb-4 text-center">
              הזן את כתובת האימייל של האמן. הוא יקבל מייל עם קישור להצטרפות
              למאגר שלך.
            </p>

            <form onSubmit={sendInvitation} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="artist@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
                  dir="ltr"
                  required
                  disabled={inviteLoading}
                />
              </div>

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full p-2 bg-brand-orange text-black hover:text-black font-semibold py-2 rounded-2xl mt-2"
              >
                {inviteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    שולח...
                  </>
                ) : (
                  <>שלח הזמנה</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
