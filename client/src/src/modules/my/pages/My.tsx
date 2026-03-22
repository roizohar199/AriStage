import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
  type FormEvent,
} from "react";
import {
  Plus,
  User,
  Music,
  CalendarCheck,
  Users,
  UserPlus,
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
import Search from "../../shared/components/Search";
import Tab, { type TabItem } from "@/modules/shared/components/Tab";
import CardSong from "../../shared/components/cardsong";
import BlockLineup from "../../shared/components/blocklineup";
import LineupDetails from "../../lineups/pages/LineupDetails.tsx";
import api, {
  getApiErrorMessage,
  getApiSuccessMessage,
} from "@/modules/shared/lib/api.js";
import { API_ORIGIN } from "@/config/apiConfig";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useFeatureFlags } from "@/modules/shared/contexts/FeatureFlagsContext.tsx";
import DesignActionButton from "../../shared/components/DesignActionButton";
import DesignActionButtonBig from "../../shared/components/DesignActionButtonBig";
import { EmailInput } from "@/modules/shared/components/FormControls";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "../../shared/components/ToastProvider";
import ArtistCard from "../../shared/components/ArtistCard";
import Bord from "@/modules/shared/components/bord";
import { useTranslation } from "@/hooks/useTranslation.ts";

import type { Socket } from "socket.io-client";

let socketModulePromise: Promise<typeof import("socket.io-client")> | null =
  null;

function loadSocketClient() {
  if (!socketModulePromise) {
    socketModulePromise = import("socket.io-client");
  }
  return socketModulePromise;
}

const AddNewSong = lazy(async () => {
  const module = await import("../../shared/components/Addnewsong");
  return { default: module.AddNewSong };
});
const CreateLineup = lazy(() => import("../../shared/components/Createlineup"));
const Charts = lazy(() => import("../../shared/components/Charts"));
const ChartViewerModal = lazy(async () => {
  const module = await import("../../shared/components/Charts");
  return { default: module.ChartViewerModal };
});
const SongLyrics = lazy(() => import("../../shared/components/SongLyrics"));

function PersonalStats({
  stats,
  connectedArtistsCount,
}: {
  stats: any;
  connectedArtistsCount: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Bord Icon={Music} value={stats?.songs ?? 0} label={t("songs.mySongs")} />
      <Bord
        Icon={CalendarCheck}
        value={stats?.lineups ?? 0}
        label={t("lineups.myLineups")}
      />
      <Bord
        Icon={Users}
        value={connectedArtistsCount}
        label={t("artists.myArtists")}
      />
    </div>
  );
}

export default function My() {
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

function MyContent() {
  const location = useLocation();
  const isLineupRoute = /^\/my\/lineups\/\d+/.test(location.pathname);
  const { subscriptionBlocked, subscriptionStatus, user } = useAuth();
  const navigate = useNavigate();
  const { isEnabled: isFeatureEnabled } = useFeatureFlags();
  const { t } = useTranslation();

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectedArtistsCount, setConnectedArtistsCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState<MyTabKey>("songs");

  const tabs = useMemo<Array<TabItem<MyTabKey>>>(() => {
    const base: Array<TabItem<MyTabKey>> = [
      { key: "songs", label: t("songs.title") },
      { key: "shared", label: t("artists.myArtists") },
    ];
    if (lineupsEnabled) {
      base.splice(1, 0, { key: "lineups", label: t("lineups.title") });
    }
    return base;
  }, [lineupsEnabled, t]);

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
  const sendInvitation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!inviteEmail || !inviteEmail.includes("@")) {
      showToast(t("errors.invalidEmail"), "error");
      return;
    }

    try {
      setInviteLoading(true);
      const { data } = await api.post("/users/send-invitation", {
        email: inviteEmail,
      });

      setInviteEmail("");
      setShowInviteModal(false);
      showToast(
        getApiSuccessMessage(data, "artists.invitationSent"),
        "success",
      );
      loadMyInvitedArtists();
      loadConnectedArtists();
    } catch (err) {
      console.error("❌ שגיאה בשליחת הזמנה:", err);
      const errorMsg = getApiErrorMessage(err, "errors.serverTryLater");
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
    bpm: number | string;
    key_sig: string;
    duration_sec: number | string;
    notes?: string | null;
    is_owner?: boolean;
    owner_id?: number;
    owner_name?: string;
    chart_pdf_url?: string | null;
    owner_avatar?: string;
    owner_role?: string;
    owner_email?: string;
    lyrics_text?: string | null;
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
      setError(t("errors.serverTryLater"));
    } finally {
      setLoading(false);
    }
  }, [t]);
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
  useEffect(() => {
    let disposed = false;
    let nextSocket: Socket | null = null;

    let token = localStorage.getItem("ari_token");
    if (!token) {
      try {
        const raw = localStorage.getItem("ari_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.token) token = parsed.token;
        }
      } catch {
        // ignore
      }
    }

    if (!token) {
      setSocket(null);
      return () => {
        disposed = true;
      };
    }

    void loadSocketClient()
      .then(({ io }) => {
        if (disposed) return;

        nextSocket = io(API_ORIGIN, {
          transports: ["websocket", "polling"],
          withCredentials: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          timeout: 20000,
          auth: token ? { token } : undefined,
        });

        setSocket(nextSocket);
      })
      .catch(() => {
        if (!disposed) {
          setSocket(null);
        }
      });

    return () => {
      disposed = true;
      if (nextSocket) {
        nextSocket.disconnect();
      }
    };
  }, []);
  useEffect(() => {
    load();
    if (!socket) return;
    async function checkGuest() {
      try {
        const { data } = await api.get("/users/check-guest", {
          skipErrorToast: true,
        });
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
    const handleDataRefresh = (event: Event) => {
      const { type } = ((event as CustomEvent<{ type?: string }>).detail ||
        {}) as {
        type?: string;
      };
      if (type === "song") {
        load();
      }
    };
    window.addEventListener("data-refresh", handleDataRefresh as EventListener);
    return () => {
      if (socket) {
        socket.off("song:created");
        socket.off("song:updated");
        socket.off("song:deleted");
        socket.off("song:chart-uploaded");
        socket.off("song:chart-deleted");
        socket.disconnect();
      }
      window.removeEventListener(
        "data-refresh",
        handleDataRefresh as EventListener,
      );
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
  const remove = async (songId: number) => {
    if (!addSongsEnabled) {
      showToast(t("songs.addSongsModuleDisabled"), "warning");
      return;
    }
    const ok = await confirm({
      title: t("songs.deleteSong"),
      message: t("songs.confirmDelete"),
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
      showToast(t("songs.addSongsModuleDisabled"), "warning");
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

  const removeLineup = async (id: number) => {
    const ok = await confirm({
      title: t("lineups.deleteLineup"),
      message: t("lineups.confirmDeleteLineup"),
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
        <h1 className="text-3xl font-bold">{t("nav.personal")}</h1>
      </header>

      {loading && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          {t("common.loading")}
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
                {t("songs.addSong")}
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
                  <Suspense fallback={null}>
                    <Charts
                      song={s}
                      privateCharts={privateCharts[s.id] || []}
                      setPrivateCharts={setPrivateCharts}
                      fileInputRefs={fileInputRefs}
                      setViewingChart={setViewingChart}
                      onConfirm={confirm}
                    />
                  </Suspense>
                }
                lyricsComponent={
                  <Suspense fallback={null}>
                    <SongLyrics
                      songId={s.id}
                      songTitle={s.title}
                      lyricsText={s.lyrics_text}
                      canEdit={!!s.is_owner}
                      onConfirm={confirm}
                      onChanged={load}
                    />
                  </Suspense>
                }
              />
            ))}
          </div>
          {/* מודאל הוספה/עריכה */}
          <Suspense fallback={null}>
            {showModal ? (
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
                        showToast(t("songs.addSongsModuleDisabled"), "warning");
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
              />
            ) : null}
            {viewingChart ? (
              <ChartViewerModal
                viewingChart={viewingChart}
                onClose={() => setViewingChart(null)}
                maxWidth="max-w-6xl"
              />
            ) : null}
          </Suspense>
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
                {t("lineups.addLineup")}
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
              {t("lineups.noLineups")}
            </p>
          )}

          {/* Create/Edit Lineup modal (new component) */}
          <Suspense fallback={null}>
            {showLineupModal ? (
              <CreateLineup
                open={showLineupModal}
                onClose={() => {
                  setShowLineupModal(false);
                  setIsEditingLineup(false);
                  setEditLineupId(null);
                }}
                onSubmit={async ({
                  name,
                  description,
                  date,
                  time,
                  location,
                }) => {
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
            ) : null}
          </Suspense>
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
                title={t("users.inviteArtistTooltip")}
                style={{ minWidth: 0 }}
              >
                <UserPlus size={18} />
                {t("artists.inviteArtist")}
              </DesignActionButton>
            </div>
            <div>
              {myInvitedArtistsLoading ? (
                <div className="text-neutral-400 text-center py-4">
                  {t("common.loading")}
                </div>
              ) : myInvitedArtists.length === 0 ? (
                <div className="bg-neutral-850 rounded-2xl p-6 text-center">
                  <User size={32} className="mx-auto mb-3 text-neutral-600" />
                  <p className="text-neutral-400 text-sm">
                    {t("artists.noArtistsInPool")}
                  </p>
                  <p className="text-neutral-500 text-xs mt-1">
                    {t("artists.inviteToPoolHint")}
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
                          const artistName =
                            artist.full_name || t("artists.unnamedArtist");
                          const ok = await confirm({
                            title: t("artists.uninviteConfirmTitle"),
                            message: t("artists.uninviteConfirmMessage", {
                              artistName,
                            }),
                          });
                          if (!ok) return;

                          setInviteLoading(true);
                          try {
                            await api.post("/users/uninvite-artist", {
                              artist_id: artist.id,
                            });
                            showToast(t("artists.uninviteSuccess"), "success");
                            loadMyInvitedArtists();
                          } catch (err) {
                            const errorMsg = getApiErrorMessage(
                              err,
                              "artists.uninviteError",
                            );
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
        title={t("artists.inviteToPoolTitle")}
        maxWidth="max-w-md"
      >
        <h2 className="text-xl font-bold mb-4 text-start">
          {t("artists.inviteToPoolTitle")}
        </h2>

        <p className="text-neutral-400 text-sm mb-4 text-start">
          {t("artists.inviteToPoolDescription")}
        </p>

        <form onSubmit={sendInvitation} className="space-y-4">
          <div>
            <EmailInput
              placeholder={t("artists.inviteEmailPlaceholder")}
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
                {t("artists.sendingInvite")}
              </>
            ) : (
              <>{t("artists.sendInvite")}</>
            )}
          </DesignActionButtonBig>
        </form>
      </BaseModal>
    </div>
  );
}
