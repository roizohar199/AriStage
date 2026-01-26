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
  MapPin,
  CalendarDays,
  Clock,
  Pencil,
  Search as SearchIcon,
} from "lucide-react";
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import BaseModal from "@/modules/shared/components/BaseModal.tsx";
import { AddNewSong, SongForm } from "../../shared/components/Addnewsong";
import CreateLineup from "../../shared/components/Createlineup";
import Search from "../../shared/components/Search";
import Tab, { type TabItem } from "@/modules/shared/components/Tab";
import Charts, { ChartViewerModal } from "../../shared/components/Charts";
import CardSong from "../../shared/components/cardsong";
import SongLyrics from "../../shared/components/SongLyrics";
import BlockLineup from "../../shared/components/blocklineup";
import LineupDetails from "../../lineups/pages/LineupDetails.tsx";
import api from "@/modules/shared/lib/api.js";
import { API_ORIGIN } from "@/config/apiConfig";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useFeatureFlags } from "@/modules/shared/contexts/FeatureFlagsContext.tsx";
import DesignActionButton from "../../shared/components/DesignActionButton";
import DesignActionButtonBig from "../../shared/components/DesignActionButtonBig";
import { EmailInput } from "@/modules/shared/components/FormControls";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "../../shared/components/ToastProvider";
import ArtistCard from "../../shared/components/ArtistCard";

import { io } from "socket.io-client";

function PersonalStats({
  stats,
  connectedArtistsCount,
}: {
  stats: any;
  connectedArtistsCount: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Music size={32} className="text-brand-primary shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats?.songs ?? 0}</span>
          <span className="text-sm text-neutral-300">שירים שלי </span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <CalendarCheck size={32} className="text-brand-primary shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats?.lineups ?? 0}</span>
          <span className="text-sm text-neutral-300">ליינאפים שלי</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Users size={32} className="text-brand-primary shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{connectedArtistsCount}</span>
          <span className="text-sm text-neutral-300">אמנים שלי </span>
        </div>
      </div>
    </div>
  );
}

export default function My(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MyContent />}>
        <Route index element={null} />
        <Route path="lineups/:lineupId" element={<LineupDetails />} />
      </Route>
      <Route path="*" element={<Navigate to="/my" replace />} />
    </Routes>
  );
}

function MyContent(): JSX.Element {
  const location = useLocation();
  const isLineupRoute = /^\/my\/lineups\/\d+/.test(location.pathname);
  const { subscriptionBlocked, subscriptionStatus, user } = useAuth();
  const navigate = useNavigate();
  const { isEnabled: isFeatureEnabled } = useFeatureFlags();

  type MyTabKey = "songs" | "lineups" | "shared";

  const addSongsEnabled = isFeatureEnabled("module.addSongs", true);
  const lineupsEnabled = isFeatureEnabled("module.lineups", true);

  const canCreateOrMutate =
    user?.role === "admin" ||
    ((subscriptionStatus === "active" || subscriptionStatus === "trial") &&
      addSongsEnabled);

  const canMutateLineups =
    user?.role === "admin" ||
    ((subscriptionStatus === "active" || subscriptionStatus === "trial") &&
      lineupsEnabled);

  // --- סטייטים כלליים ---
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectedArtistsCount, setConnectedArtistsCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState<MyTabKey>("songs");

  const tabs = useMemo<Array<TabItem<MyTabKey>>>(() => {
    const base: Array<TabItem<MyTabKey>> = [
      { key: "songs", label: "שירים" },
      { key: "shared", label: "אמנים שלי" },
    ];
    if (lineupsEnabled) {
      base.splice(1, 0, { key: "lineups", label: "ליינאפים" });
    }
    return base;
  }, [lineupsEnabled]);

  const handleSelectTab = useCallback(
    (tab: MyTabKey) => {
      if (subscriptionBlocked) {
        window.openUpgradeModal?.();
        return;
      }

      if (tab === "songs") {
        navigate("/my");
        return;
      }

      if (tab === "lineups" && !lineupsEnabled) {
        navigate("/my");
        return;
      }

      navigate(`/my?tab=${tab}`);
    },
    [navigate, subscriptionBlocked, lineupsEnabled],
  );

  // Sync selectedTab with URL
  useEffect(() => {
    if (
      !lineupsEnabled &&
      (location.pathname.includes("/lineups") ||
        location.search.includes("tab=lineups"))
    ) {
      setSelectedTab("songs");
      navigate("/my", { replace: true });
      return;
    }
    if (location.pathname.includes("/lineups")) {
      setSelectedTab("lineups");
    } else if (location.search.includes("tab=lineups")) {
      setSelectedTab("lineups");
    } else if (location.search.includes("tab=shared")) {
      setSelectedTab("shared");
    } else {
      setSelectedTab("songs");
    }
  }, [location.pathname, location.search, lineupsEnabled, navigate]);

  // --- סטייטים של טאב השירים ---
  // --- אמנים שהזמנתי למאגר שלי ---
  const [myInvitedArtists, setMyInvitedArtists] = useState<any[]>([]);
  const [myInvitedArtistsLoading, setMyInvitedArtistsLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sharedSearch, setSharedSearch] = useState("");
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
  const confirm = useConfirm();
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
    {},
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
    return io(API_ORIGIN, {
      transports: ["websocket", "polling"],
      withCredentials: true,
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
            setSongs((prev) => prev.map((s) => (s.id === songId ? data : s))),
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
          setPrivateCharts((prev) => ({
            ...prev,
            [songId]: data.charts || [],
          })),
        )
        .catch(() => console.error("שגיאה בטעינת צ'ארטים"));
    });
    socket.on("song:chart-deleted", ({ songId }) => {
      api
        .get(`/songs/${songId}/private-charts`)
        .then(({ data }) =>
          setPrivateCharts((prev) => ({
            ...prev,
            [songId]: data.charts || [],
          })),
        )
        .catch(() => console.error("שגיאה בטעינת צ'ארטים"));
    });
    const handleDataRefresh = (
      event: CustomEvent<{ type: string; action: string }>,
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
        if (!canCreateOrMutate) {
          window.openUpgradeModal?.();
          return;
        }
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
        }),
      );
    } catch (err) {
      console.error("שגיאה בשמירה:", err);
    }
  };
  const remove = async (songId: number) => {
    if (!addSongsEnabled) {
      showToast("מודול הוספת שירים כבוי", "warning");
      return;
    }
    const ok = await confirm({
      title: "מחיקת שיר",
      message: "בטוח שאתה רוצה למחוק את השיר?",
    });
    if (!ok) return;
    await api.delete(`/songs/${songId}`);
    load();
    window.dispatchEvent(
      new CustomEvent("data-refresh", {
        detail: { type: "song", action: "deleted" },
      }),
    );
  };
  const edit = (song: Song) => {
    if (!addSongsEnabled) {
      showToast("מודול הוספת שירים כבוי", "warning");
      return;
    }
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
          prev.map((l) => (l.id === lineup.id ? lineup : l)),
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
            : l,
        ),
      );
    });

    socket.on("lineup-song:removed", ({ lineupId }) => {
      setLineups((prev) =>
        prev.map((l) =>
          l.id === lineupId
            ? { ...l, songs_count: Math.max((l.songs_count || 1) - 1, 0) }
            : l,
        ),
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
        if (!canMutateLineups) {
          window.openUpgradeModal?.();
          return;
        }
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
    const ok = await confirm({
      title: "מחיקה",
      message: "בטוח למחוק את הליינאפ?",
    });
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
      l.description?.toLowerCase().includes(lineupSearch.toLowerCase()),
  );

  // --- רנדר ---
  return (
    <div className="min-h-screen text-neutral-100 p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">אישי</h1>
      </header>

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

      <Tab
        tabs={tabs}
        selectedKey={selectedTab}
        onSelect={handleSelectTab}
        variant="user"
      />

      {/* --- תוכן טאב השירים --- */}
      {isLineupRoute ? (
        <Outlet />
      ) : selectedTab === "songs" ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            {/* חיפוש */}
            <Search
              value={search}
              variant="song"
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* הוסף שיר */}
            {addSongsEnabled ? (
              <DesignActionButton
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
              >
                <Plus size={18} />
                הוסף שיר
              </DesignActionButton>
            ) : null}
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
                onEdit={addSongsEnabled ? edit : undefined}
                onRemove={addSongsEnabled ? remove : undefined}
                chartsComponent={
                  <Charts
                    song={s}
                    privateCharts={privateCharts[s.id] || []}
                    setPrivateCharts={setPrivateCharts}
                    fileInputRefs={fileInputRefs}
                    setViewingChart={setViewingChart}
                    onConfirm={confirm}
                  />
                }
                lyricsComponent={
                  <SongLyrics
                    songId={s.id}
                    songTitle={s.title}
                    lyricsText={s.lyrics_text}
                    canEdit={!!s.is_owner}
                    onConfirm={confirm}
                    onChanged={load}
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
                  if (!addSongsEnabled) {
                    showToast("מודול הוספת שירים כבוי", "warning");
                    return;
                  }
                  await api.put(`/songs/${editId}`, cleanForm);
                } else {
                  if (!canCreateOrMutate) {
                    window.openUpgradeModal?.();
                    return;
                  }
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
                  }),
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
          <ChartViewerModal
            viewingChart={viewingChart}
            onClose={() => setViewingChart(null)}
            maxWidth="max-w-6xl"
          />
        </>
      ) : selectedTab === "lineups" ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            {/* חיפוש */}
            <Search
              value={lineupSearch}
              variant="lineup"
              onChange={(e) => setLineupSearch(e.target.value)}
            />
            {/* צור לינאפ חדש */}
            {canMutateLineups ? (
              <DesignActionButton
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
              >
                <Plus size={18} />
                צור לינאפ חדש
              </DesignActionButton>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLineups.map((l, i) => (
              <BlockLineup
                key={l.id}
                lineup={l}
                index={i}
                onOpen={() => {
                  if (subscriptionBlocked) {
                    window.openUpgradeModal?.();
                    return;
                  }
                  navigate(`/my/lineups/${l.id}`);
                }}
                onEdit={
                  canMutateLineups ? () => openEditLineupModal(l) : undefined
                }
                onDelete={
                  canMutateLineups ? () => removeLineup(l.id) : undefined
                }
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
                  if (!canMutateLineups) {
                    window.openUpgradeModal?.();
                    return;
                  }
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
      ) : selectedTab === "shared" ? (
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
              <DesignActionButton
                onClick={() => setShowInviteModal(true)}
                title="הזמן אמן למאגר שלך"
                style={{ minWidth: 0 }}
              >
                <UserPlus size={18} />
                הזמן אמן
              </DesignActionButton>
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
                          .includes(sharedSearch.toLowerCase()),
                    )
                    .map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        artist={artist}
                        disableActions={inviteLoading}
                        onUninvite={async () => {
                          const ok = await confirm({
                            title: "ביטול שיתוף",
                            message: `בטוח שאתה רוצה לבטל את השיתוף עם ${
                              artist.full_name || "האמן"
                            }? האמן לא יוכל עוד לצפות בליינאפים והשירים שלך.`,
                          });
                          if (!ok) return;

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
                          }
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* מודאל הזמנת אמן */}
      <BaseModal
        open={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail("");
        }}
        title="הזמן אמן למאגר שלך"
        maxWidth="max-w-md"
      >
        <h2 className="text-xl font-bold mb-4 text-start">
          הזמן אמן למאגר שלך
        </h2>

        <p className="text-neutral-400 text-sm mb-4 text-start">
          הזן את כתובת האימייל של האמן. הוא יקבל מייל עם קישור להצטרפות למאגר
          שלך.
        </p>

        <form onSubmit={sendInvitation} className="space-y-4">
          <div>
            <EmailInput
              placeholder="artist@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mb-0"
              dir="ltr"
              required
              disabled={inviteLoading}
            />
          </div>

          <DesignActionButtonBig type="submit" disabled={inviteLoading}>
            {inviteLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                שולח...
              </>
            ) : (
              <>שלח הזמנה</>
            )}
          </DesignActionButtonBig>
        </form>
      </BaseModal>
    </div>
  );
}
