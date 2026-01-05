import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  ClipboardList,
  Database,
  Files,
  Flag,
  Mail,
  Pencil,
  Shield,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCog,
  Users, // icon only
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Search from "@/modules/shared/components/Search";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import BaseModal from "@/modules/shared/components/BaseModal";
import api from "@/modules/shared/lib/api.ts";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";
import CardSong from "@/modules/shared/components/cardsong";
import BlockLineup from "@/modules/shared/components/blocklineup";
import { normalizeSubscriptionType } from "@/modules/shared/hooks/useSubscription.ts";
import AdminPayments from "../components/AdminPayments";

type AdminTab =
  | "users"
  | "repos"
  | "subscriptions"
  | "payments"
  | "files"
  | "invitations"
  | "logs"
  | "errors"
  | "featureFlags"
  | "monitoring"
  | "plans";

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: "users", label: "משתמשים" },
  { key: "repos", label: "מאגרים" },
  { key: "subscriptions", label: "מנויים" },
  { key: "payments", label: "תשלומים" },
  { key: "plans", label: "מסלולים" },
  { key: "files", label: "קבצים" },
  { key: "invitations", label: "הזמנות" },
  { key: "logs", label: "לוגים" },
  { key: "errors", label: "תקלות" },
  { key: "featureFlags", label: "Feature Flags" },
  { key: "monitoring", label: "ניטור מערכת" },
];

function getTabFromLocationSearch(search: string): AdminTab {
  const params = new URLSearchParams(search);
  const raw = params.get("tab") || "";
  const allowed = new Set<AdminTab>(TABS.map((t) => t.key));
  const tab = raw as AdminTab;
  return allowed.has(tab) ? tab : "users";
}

function CardContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {children}
    </div>
  );
}

function SmallBadge({
  icon,
  children,
  variant = "neutral",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "neutral" | "brand" | "success" | "danger";
}) {
  const cls =
    variant === "brand"
      ? "bg-brand-orange text-black font-semibold"
      : variant === "success"
      ? "bg-green-600 text-white font-semibold"
      : variant === "danger"
      ? "bg-red-600 text-white font-semibold"
      : "bg-neutral-900 text-white";

  return (
    <span
      className={`flex flex-row-reverse items-center gap-1 px-2 py-1 rounded-2xl text-xs ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}

function AdminStats({
  stats,
}: {
  stats: {
    users: number;
    repos: number;
    activeSubscriptions: number;
    files: number;
    pendingInvitations: number;
    openIssues: number;
  };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Users size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.users}</span>
          <span className="text-sm text-neutral-300">משתמשים</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Database size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.repos}</span>
          <span className="text-sm text-neutral-300">מאגרים</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <BadgeCheck size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.activeSubscriptions}</span>
          <span className="text-sm text-neutral-300">מנויים פעילים</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Files size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.files}</span>
          <span className="text-sm text-neutral-300">קבצים</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <Mail size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.pendingInvitations}</span>
          <span className="text-sm text-neutral-300">הזמנות ממתינות</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4">
        <AlertCircle size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.openIssues}</span>
          <span className="text-sm text-neutral-300">תקלות פתוחות</span>
        </div>
      </div>
    </div>
  );
}

type AdminUser = {
  id: number;
  full_name?: string;
  email: string;
  role: string;
  subscription_type?: string;
  // Optional subscription fields from backend; do not infer.
  subscription_status?: string;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
};

type SubscriptionEdit = {
  subscription_type: string;
  subscription_status: string;
  subscription_started_at: string;
  subscription_expires_at: string;
};

function formatSubscriptionDate(raw?: string | null): string {
  if (!raw) return "—";
  try {
    const trimmed = String(raw).trim();
    if (!trimmed) return "—";
    const normalized = trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T");
    const d = new Date(normalized);
    const ms = d.getTime();
    if (Number.isNaN(ms)) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "—";
  }
}

// Normalize raw DB/ISO date string for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
function toDateTimeLocalInput(raw?: string | null): string {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  // Handle common MySQL and ISO formats
  let normalized = trimmed.replace(" ", "T");
  if (normalized.endsWith("Z")) {
    normalized = normalized.slice(0, -1);
  }

  if (normalized.length >= 16) {
    return normalized.slice(0, 16);
  }

  // Fallback: parse and format
  const d = new Date(trimmed);
  const ms = d.getTime();
  if (Number.isNaN(ms)) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

type Song = {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key_sig: string;
  duration_sec: number;
  notes?: string;
  owner_id?: number;
  owner_name?: string;
  owner_email?: string;
};

type Lineup = {
  id: number;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  owner_id?: number;
  created_by?: number;
  owner_name?: string;
  owner_email?: string;
};

type RepoSummary = {
  ownerId: number;
  ownerName: string;
  ownerEmail?: string;
  songsCount: number;
  lineupsCount: number;
};

type ConnectedArtist = {
  id: number;
  full_name?: string;
  email?: string;
  artist_role?: string;
  avatar?: string;
};

type FileRow = {
  id: number;
  name?: string;
  file_name?: string;
  type?: string;
  mime_type?: string;
  owner_name?: string;
  owner_email?: string;
  size?: number;
  size_bytes?: number;
  created_at?: string;
};

type LogRow = {
  id: number;
  level?: "info" | "warn" | "error";
  action?: string;
  message?: string;
  explanation?: string;
  actorLabel?: string;
  userId?: number;
  createdAt?: string;
  context?: any;

  // legacy/fallback fields
  user?: string;
  entity?: string;
  created_at?: string;
};

type ErrorRow = {
  id: number;
  message?: string;
  route?: string;
  user?: string;
  status?: string;
  resolved?: boolean;
  created_at?: string;
};

type FeatureFlagRow = {
  key: string;
  description?: string;
  enabled?: boolean;
};

type PrivateChart = { id: number; file_path: string };

export default function AdminReal() {
  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<{ [tier: string]: number }>({});
  const { showToast } = useToast();

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const { data } = await api.get("/subscriptions/plans");
      setPlans(data);
    } catch (err: any) {
      setPlansError("שגיאה בטעינת מסלולים");
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const selectedTab = useMemo(
    () => getTabFromLocationSearch(location.search),
    [location.search]
  );
  useEffect(() => {
    if (selectedTab === "plans") loadPlans();
  }, [selectedTab, loadPlans]);
  console.log("ADMIN RENDERED");

  const setTab = useCallback(
    (tab: AdminTab) => {
      navigate(`/admin?tab=${tab}`);
    },
    [navigate]
  );

  const [searchByTab, setSearchByTab] = useState<Record<AdminTab, string>>({
    users: "",
    repos: "",
    subscriptions: "",
    payments: "",
    files: "",
    invitations: "",
    logs: "",
    errors: "",
    featureFlags: "",
    monitoring: "",
    plans: "",
  });

  const searchValue = searchByTab[selectedTab];
  const setSearchValue = (value: string) =>
    setSearchByTab((prev) => ({ ...prev, [selectedTab]: value }));

  // ------------------------
  // Users
  // ------------------------
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersUnsupported, setUsersUnsupported] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersUnsupported(false);

      const { data } = await api.get("/admin/users", {
        skipErrorToast: true,
      } as any);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setUsersUnsupported(true);
        setUsers([]);
        return;
      }
      console.error("Admin loadUsers failed", err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    // Used also for stats
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (selectedTab === "users" || selectedTab === "subscriptions") {
      loadUsers();
    }
  }, [selectedTab, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = searchByTab.users.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.full_name || ""} ${u.email} ${u.role} ${u.subscription_type || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [users, searchByTab.users]);

  // Edit modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    full_name: "",
    role: "user",
    subscription_type: "trial",
  });
  const [subscriptionTypeLocked, setSubscriptionTypeLocked] = useState(false);
  const [subscriptionTypeOriginal, setSubscriptionTypeOriginal] = useState<
    string | null
  >(null);

  const [subscriptionEdits, setSubscriptionEdits] = useState<
    Record<number, SubscriptionEdit>
  >({});
  const [editingSubscriptionUserId, setEditingSubscriptionUserId] = useState<
    number | null
  >(null);

  const openEditUser = (u: AdminUser) => {
    setEditingUserId(u.id);
    const normalizedType = normalizeSubscriptionType(u.subscription_type);
    const rawType = (u.subscription_type || "").toLowerCase();
    const isIllegalType = !!rawType && rawType !== "trial" && rawType !== "pro";

    setUserForm({
      full_name: u.full_name || "",
      role: u.role,
      subscription_type: normalizedType,
    });
    setSubscriptionTypeLocked(isIllegalType);
    setSubscriptionTypeOriginal(
      isIllegalType ? u.subscription_type || null : null
    );
    setUserModalOpen(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      await api.put(`/users/${editingUserId}`, {
        full_name: userForm.full_name,
        role: userForm.role,
      });

      if (!subscriptionTypeLocked) {
        await api.put(`/admin/users/${editingUserId}/subscription`, {
          subscription_type: userForm.subscription_type,
        });
      }
      setUserModalOpen(false);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה בשמירת המשתמש";
      showToast(msg, "error");
    }
  };

  const deleteUser = async (userId: number) => {
    const ok = await confirm({
      title: "מחיקה",
      message: "בטוח למחוק משתמש זה?",
    });
    if (!ok) return;

    try {
      await api.delete(`/users/${userId}`);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה במחיקת המשתמש";
      showToast(msg, "error");
    }
  };

  const impersonateUser = async (userId: number) => {
    const ok = await confirm({
      title: "ייצוג משתמש",
      message: "להיכנס לחשבון שלו?",
    });
    if (!ok) return;

    try {
      localStorage.setItem("ari_auth_lock", "1");
      const { data } = await api.post(`/users/${userId}/impersonate`);

      const rawUser = localStorage.getItem("ari_user");
      const rawToken = localStorage.getItem("ari_token");

      if (!localStorage.getItem("ari_original_user")) {
        localStorage.setItem("ari_original_user", rawUser || "");
        localStorage.setItem("ari_original_token", rawToken || "");
      }

      localStorage.setItem("ari_user", JSON.stringify(data.user));
      localStorage.setItem("ari_token", data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      setTimeout(() => {
        localStorage.removeItem("ari_auth_lock");
        window.location.replace("/home");
      }, 150);
    } catch (err: any) {
      localStorage.removeItem("ari_auth_lock");
      const msg = err?.response?.data?.message || "שגיאה בייצוג משתמש";
      showToast(msg, "error");
    }
  };

  // ------------------------
  // Songs + Lineups (Repositories)
  // ------------------------
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [lineupsLoading, setLineupsLoading] = useState(true);

  const loadSongs = useCallback(async () => {
    try {
      setSongsLoading(true);
      const { data } = await api.get("/songs", { skipErrorToast: true } as any);
      setSongs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Admin loadSongs failed", err);
      setSongs([]);
    } finally {
      setSongsLoading(false);
    }
  }, []);

  const loadLineups = useCallback(async () => {
    try {
      setLineupsLoading(true);
      const { data } = await api.get("/lineups", {
        skipErrorToast: true,
      } as any);
      setLineups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Admin loadLineups failed", err);
      setLineups([]);
    } finally {
      setLineupsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "repos") {
      loadSongs();
      loadLineups();
    }
  }, [selectedTab, loadSongs, loadLineups]);

  const repos = useMemo<RepoSummary[]>(() => {
    const byOwner = new Map<number, RepoSummary>();

    const ensure = (
      ownerId: number,
      ownerName: string,
      ownerEmail?: string
    ) => {
      const existing = byOwner.get(ownerId);
      if (existing) {
        if (!existing.ownerEmail && ownerEmail)
          existing.ownerEmail = ownerEmail;
        if (!existing.ownerName && ownerName) existing.ownerName = ownerName;
        return existing;
      }
      const created: RepoSummary = {
        ownerId,
        ownerName: ownerName || `user:${ownerId}`,
        ownerEmail,
        songsCount: 0,
        lineupsCount: 0,
      };
      byOwner.set(ownerId, created);
      return created;
    };

    songs.forEach((s) => {
      const ownerId = Number(s.owner_id ?? 0);
      if (!ownerId) return;
      const rec = ensure(
        ownerId,
        s.owner_name || `user:${ownerId}`,
        s.owner_email
      );
      rec.songsCount += 1;
    });

    lineups.forEach((l) => {
      const ownerId = Number(l.owner_id ?? l.created_by ?? 0);
      if (!ownerId) return;
      const rec = ensure(
        ownerId,
        l.owner_name || `user:${ownerId}`,
        l.owner_email
      );
      rec.lineupsCount += 1;
    });

    return Array.from(byOwner.values());
  }, [songs, lineups]);

  const filteredRepos = useMemo(() => {
    const q = searchByTab.repos.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((r) =>
      `${r.ownerName} ${r.ownerEmail || ""}`.toLowerCase().includes(q)
    );
  }, [repos, searchByTab.repos]);

  // Repo manage modal
  const [repoModalOpen, setRepoModalOpen] = useState(false);
  const [repoOwnerId, setRepoOwnerId] = useState<number | null>(null);
  const [chartsBySong, setChartsBySong] = useState<
    Record<number, PrivateChart[]>
  >({});
  const chartsLoadAbortRef = useRef({ aborted: false });

  const openRepoManage = (ownerId: number) => {
    setRepoOwnerId(ownerId);
    setRepoModalOpen(true);
  };

  const closeRepoManage = () => {
    setRepoModalOpen(false);
    setRepoOwnerId(null);
    setChartsBySong({});
  };

  const repoSongs = useMemo(() => {
    if (!repoOwnerId) return [];
    return songs.filter((s) => Number(s.owner_id) === repoOwnerId);
  }, [songs, repoOwnerId]);

  const repoLineups = useMemo(() => {
    if (!repoOwnerId) return [];
    return lineups.filter(
      (l) => Number(l.owner_id ?? l.created_by) === repoOwnerId
    );
  }, [lineups, repoOwnerId]);

  const loadRepoCharts = useCallback(async () => {
    if (!repoOwnerId) return;

    chartsLoadAbortRef.current.aborted = false;
    const localAbort = chartsLoadAbortRef.current;

    try {
      const results = await Promise.all(
        repoSongs.map(async (s) => {
          try {
            const { data } = await api.get(`/songs/${s.id}/private-charts`, {
              skipErrorToast: true,
            } as any);
            const charts = Array.isArray(data?.charts)
              ? data.charts
              : Array.isArray(data)
              ? data
              : [];
            return { songId: s.id, charts };
          } catch {
            return { songId: s.id, charts: [] };
          }
        })
      );

      if (localAbort.aborted) return;
      setChartsBySong((prev) => {
        const next = { ...prev };
        results.forEach(({ songId, charts }) => {
          next[songId] = charts;
        });
        return next;
      });
    } catch (err) {
      console.error("Admin loadRepoCharts failed", err);
    }
  }, [repoOwnerId, repoSongs]);

  useEffect(() => {
    if (!repoModalOpen) return;
    loadRepoCharts();
    return () => {
      chartsLoadAbortRef.current.aborted = true;
    };
  }, [repoModalOpen, loadRepoCharts]);

  // Song edit
  const [songModalOpen, setSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songForm, setSongForm] = useState({
    title: "",
    artist: "",
    bpm: "",
    key_sig: "C Major",
    duration_sec: "00:00",
    notes: "",
  });

  const openSongEdit = (song: Song) => {
    setEditingSong(song);
    setSongForm({
      title: song.title || "",
      artist: song.artist || "",
      bpm: String(song.bpm ?? ""),
      key_sig: song.key_sig || "C Major",
      duration_sec: String(song.duration_sec ?? "00:00"),
      notes: song.notes || "",
    });
    setSongModalOpen(true);
  };

  const saveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    try {
      await api.put(`/songs/${editingSong.id}`, songForm);
      setSongModalOpen(false);
      setEditingSong(null);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה בעריכת השיר";
      showToast(msg, "error");
    }
  };

  const deleteSong = async (songId: number) => {
    const ok = await confirm({ title: "מחיקה", message: "בטוח למחוק שיר זה?" });
    if (!ok) return;
    try {
      await api.delete(`/songs/${songId}`);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה במחיקת השיר";
      showToast(msg, "error");
    }
  };

  // Lineup edit
  const [lineupModalOpen, setLineupModalOpen] = useState(false);
  const [editingLineup, setEditingLineup] = useState<Lineup | null>(null);
  const [lineupForm, setLineupForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  });

  const openLineupEdit = (lineup: Lineup) => {
    setEditingLineup(lineup);
    setLineupForm({
      title: lineup.title || "",
      date: lineup.date ? String(lineup.date).slice(0, 10) : "",
      time: lineup.time ? String(lineup.time).slice(0, 5) : "",
      location: lineup.location || "",
      description: lineup.description || "",
    });
    setLineupModalOpen(true);
  };

  const saveLineup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLineup) return;
    try {
      await api.put(`/lineups/${editingLineup.id}`, lineupForm);
      setLineupModalOpen(false);
      setEditingLineup(null);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה בעריכת הליינאפ";
      showToast(msg, "error");
    }
  };

  const deleteLineup = async (lineupId: number) => {
    const ok = await confirm({
      title: "מחיקה",
      message: "בטוח למחוק ליינאפ זה?",
    });
    if (!ok) return;
    try {
      await api.delete(`/lineups/${lineupId}`);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה במחיקת הליינאפ";
      showToast(msg, "error");
    }
  };

  // ------------------------
  // Invitations
  // ------------------------
  const [invitedArtists, setInvitedArtists] = useState<ConnectedArtist[]>([]);
  const [invitedArtistsLoading, setInvitedArtistsLoading] = useState(true);

  const loadInvitations = useCallback(async () => {
    try {
      setInvitedArtistsLoading(true);
      const { data } = await api.get("/users/connected-to-me", {
        skipErrorToast: true,
      } as any);
      setInvitedArtists(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Admin loadInvitations failed", err);
      setInvitedArtists([]);
    } finally {
      setInvitedArtistsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "invitations") {
      loadInvitations();
    }
  }, [selectedTab, loadInvitations]);

  const filteredInvitedArtists = useMemo(() => {
    const q = searchByTab.invitations.trim().toLowerCase();
    if (!q) return invitedArtists;
    return invitedArtists.filter((a) =>
      `${a.full_name || ""} ${a.email || ""} ${a.artist_role || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [invitedArtists, searchByTab.invitations]);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      showToast("נא להזין כתובת אימייל תקינה", "error");
      return;
    }

    try {
      setInviteLoading(true);
      await api.post("/users/send-invitation", { email: inviteEmail });
      setInviteEmail("");
      setInviteModalOpen(false);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה בשליחת ההזמנה";
      showToast(msg, "error");
    } finally {
      setInviteLoading(false);
    }
  };

  const uninviteArtist = async (artistId: number, artistName?: string) => {
    const ok = await confirm({
      title: "ביטול שיתוף",
      message: `בטוח שאתה רוצה לבטל את השיתוף עם ${
        artistName || "האמן"
      }? האמן לא יוכל עוד לצפות בליינאפים והשירים שלך.`,
    });
    if (!ok) return;

    try {
      await api.post("/users/uninvite-artist", { artist_id: artistId });
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "שגיאה בביטול השיתוף";
      showToast(msg, "error");
    }
  };

  // ------------------------
  // Files
  // ------------------------
  const [files, setFiles] = useState<FileRow[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesUnsupported, setFilesUnsupported] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      setFilesUnsupported(false);
      const { data } = await api.get("/files", { skipErrorToast: true } as any);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 404) setFilesUnsupported(true);
      console.error("Admin loadFiles failed", err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "files") loadFiles();
  }, [selectedTab, loadFiles]);

  const filteredFiles = useMemo(() => {
    const q = searchByTab.files.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => {
      const name = f.name || f.file_name || "";
      const type = f.type || f.mime_type || "";
      const owner = `${f.owner_name || ""} ${f.owner_email || ""}`;
      return `${name} ${type} ${owner}`.toLowerCase().includes(q);
    });
  }, [files, searchByTab.files]);

  const deleteFile = async (fileId: number) => {
    const ok = await confirm({
      title: "מחיקה",
      message: "בטוח למחוק קובץ זה?",
    });
    if (!ok) return;

    try {
      await api.delete(`/files/${fileId}`);
      await reload();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast("TODO: backend endpoint required: DELETE /files/:id", "info");
        return;
      }
      const msg = err?.response?.data?.message || "שגיאה במחיקת הקובץ";
      showToast(msg, "error");
    }
  };

  // ------------------------
  // Logs
  // ------------------------
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLimit, setLogsLimit] = useState(50);
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsLevel, setLogsLevel] = useState<"" | "info" | "warn" | "error">(
    ""
  );
  const [logsAction, setLogsAction] = useState("");
  const [logsUserId, setLogsUserId] = useState<"" | number>("");
  const [logsFromDate, setLogsFromDate] = useState("");
  const [logsToDate, setLogsToDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState("");
  const [cleanupOlderThanDays, setCleanupOlderThanDays] = useState(30);
  const [cleanupBeforeDate, setCleanupBeforeDate] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsUnsupported, setLogsUnsupported] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      setLogsUnsupported(false);
      const q = searchByTab.logs.trim();

      const params: any = {
        limit: logsLimit,
        offset: logsOffset,
        sort: "createdAt DESC",
      };
      if (q) params.q = q;
      if (logsLevel) params.level = logsLevel;
      if (logsAction) params.action = logsAction;
      if (logsUserId !== "") params.userId = logsUserId;
      if (logsFromDate) params.fromDate = logsFromDate;
      if (logsToDate) params.toDate = logsToDate;

      const { data } = await api.get("/logs", {
        params,
        skipErrorToast: true,
      } as any);

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      setLogs(rows);
      setLogsTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (err: any) {
      if (err?.response?.status === 404) setLogsUnsupported(true);
      console.error("Admin loadLogs failed", err);
      setLogs([]);
      setLogsTotal(0);
    } finally {
      setLogsLoading(false);
    }
  }, [
    logsLimit,
    logsOffset,
    logsLevel,
    logsAction,
    logsUserId,
    logsFromDate,
    logsToDate,
    searchByTab.logs,
  ]);

  useEffect(() => {
    if (selectedTab !== "logs") return;
    const t = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(t);
  }, [
    selectedTab,
    loadLogs,
    logsLimit,
    logsOffset,
    logsLevel,
    logsAction,
    logsUserId,
    logsFromDate,
    logsToDate,
    searchByTab.logs,
  ]);

  const logsActionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of logs) {
      if (row?.action) set.add(String(row.action));
    }
    return Array.from(set).sort();
  }, [logs]);

  const runLogsCleanup = useCallback(async () => {
    if (cleanupConfirmText.trim() !== "DELETE LOGS") {
      showToast('יש להקליד בדיוק "DELETE LOGS" כדי לאשר', "error");
      return;
    }

    try {
      setCleanupLoading(true);

      const params: any = {};
      if (cleanupBeforeDate.trim())
        params.beforeDate = cleanupBeforeDate.trim();
      else params.olderThanDays = cleanupOlderThanDays;

      const { data } = await api.delete("/logs/cleanup", { params } as any);
      showToast(`נמחקו ${data?.deletedCount ?? 0} לוגים`, "success");
      setCleanupOpen(false);
      setCleanupConfirmText("");
      setLogsOffset(0);
      await loadLogs();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "שגיאה בניקוי לוגים";
      showToast(msg, "error");
    } finally {
      setCleanupLoading(false);
    }
  }, [
    cleanupConfirmText,
    cleanupBeforeDate,
    cleanupOlderThanDays,
    loadLogs,
    showToast,
  ]);

  // ------------------------
  // Errors
  // ------------------------
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [errorsUnsupported, setErrorsUnsupported] = useState(false);

  const loadErrors = useCallback(async () => {
    try {
      setErrorsLoading(true);
      setErrorsUnsupported(false);
      const { data } = await api.get("/errors", {
        skipErrorToast: true,
      } as any);
      setErrors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 404) setErrorsUnsupported(true);
      console.error("Admin loadErrors failed", err);
      setErrors([]);
    } finally {
      setErrorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "errors") loadErrors();
  }, [selectedTab, loadErrors]);

  const filteredErrors = useMemo(() => {
    const q = searchByTab.errors.trim().toLowerCase();
    if (!q) return errors;
    return errors.filter((e) =>
      `${e.message || ""} ${e.route || ""} ${e.user || ""} ${e.status || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [errors, searchByTab.errors]);

  const resolveError = async (errorId: number) => {
    const ok = await confirm({
      title: "סגירת תקלה",
      message: "לסמן תקלה כ-resolved?",
    });
    if (!ok) return;

    try {
      await api.put(`/errors/${errorId}`, { resolved: true });
      await reload();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast("TODO: backend endpoint required: PUT /errors/:id", "info");
        return;
      }
      const msg = err?.response?.data?.message || "שגיאה בסגירת התקלה";
      showToast(msg, "error");
    }
  };

  // ------------------------
  // Feature Flags
  // ------------------------
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagRow[]>([]);
  const [featureFlagsLoading, setFeatureFlagsLoading] = useState(true);
  const [featureFlagsUnsupported, setFeatureFlagsUnsupported] = useState(false);

  const loadFeatureFlags = useCallback(async () => {
    try {
      setFeatureFlagsLoading(true);
      setFeatureFlagsUnsupported(false);
      const { data } = await api.get("/feature-flags", {
        skipErrorToast: true,
      } as any);
      setFeatureFlags(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 404) setFeatureFlagsUnsupported(true);
      console.error("Admin loadFeatureFlags failed", err);
      setFeatureFlags([]);
    } finally {
      setFeatureFlagsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "featureFlags") loadFeatureFlags();
  }, [selectedTab, loadFeatureFlags]);

  const filteredFeatureFlags = useMemo(() => {
    const q = searchByTab.featureFlags.trim().toLowerCase();
    if (!q) return featureFlags;
    return featureFlags.filter((f) =>
      `${f.key} ${f.description || ""}`.toLowerCase().includes(q)
    );
  }, [featureFlags, searchByTab.featureFlags]);

  const toggleFeatureFlag = async (flag: FeatureFlagRow) => {
    try {
      await api.put(`/feature-flags/${encodeURIComponent(flag.key)}`, {
        enabled: !flag.enabled,
      });
      await reload();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast(
          "TODO: backend endpoint required: PUT /feature-flags/:key",
          "info"
        );
        return;
      }
      const msg = err?.response?.data?.message || "שגיאה בעדכון ה-flag";
      showToast(msg, "error");
    }
  };

  // ------------------------
  // Monitoring
  // ------------------------
  const [monitoring, setMonitoring] = useState<any>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(true);

  const loadMonitoring = useCallback(async () => {
    try {
      setMonitoringLoading(true);
      const { data } = await api.get("/dashboard-stats", {
        skipErrorToast: true,
      } as any);
      setMonitoring(data || null);
    } catch (err) {
      console.error("Admin loadMonitoring failed", err);
      setMonitoring(null);
    } finally {
      setMonitoringLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "monitoring") loadMonitoring();
  }, [selectedTab, loadMonitoring]);

  const monitoringCards = useMemo(() => {
    const activeUsers =
      monitoring?.activeUsers ?? monitoring?.active_users ?? "TODO";
    const cpu = monitoring?.cpu ?? monitoring?.cpu_percent ?? "TODO";
    const memory = monitoring?.memory ?? monitoring?.memory_used ?? "TODO";

    return [
      {
        label: "CPU",
        value: typeof cpu === "number" ? `${cpu}%` : String(cpu),
        icon: <Activity size={20} />,
      },
      { label: "Memory", value: String(memory), icon: <Activity size={20} /> },
      {
        label: "Active Users",
        value: String(activeUsers),
        icon: <Users size={20} />,
      },
    ];
  }, [monitoring]);

  // ------------------------
  // Stats
  // ------------------------
  const stats = useMemo(() => {
    return {
      users: users.length,
      repos: repos.length,
      activeSubscriptions: users.filter(
        (u) => (u.subscription_type || "trial") !== "trial"
      ).length,
      files: files.length,
      pendingInvitations: 0, // TODO: אין endpoint מפורש ל-count גלובלי
      openIssues: errors.filter(
        (e) =>
          (e.status || (e.resolved ? "resolved" : "open")) === "open" ||
          e.resolved === false
      ).length,
    };
  }, [users, repos, files, errors]);

  // ------------------------
  // reload() per spec
  // ------------------------
  const reload = useCallback(async () => {
    if (selectedTab === "users" || selectedTab === "subscriptions") {
      await loadUsers();
      return;
    }

    if (selectedTab === "repos") {
      await Promise.all([loadSongs(), loadLineups()]);
      return;
    }

    if (selectedTab === "invitations") {
      await loadInvitations();
      return;
    }

    if (selectedTab === "files") {
      await loadFiles();
      return;
    }

    if (selectedTab === "logs") {
      await loadLogs();
      return;
    }

    if (selectedTab === "errors") {
      await loadErrors();
      return;
    }

    if (selectedTab === "featureFlags") {
      await loadFeatureFlags();
      return;
    }

    if (selectedTab === "monitoring") {
      await loadMonitoring();
      return;
    }
  }, [
    selectedTab,
    loadUsers,
    loadSongs,
    loadLineups,
    loadInvitations,
    loadFiles,
    loadLogs,
    loadErrors,
    loadFeatureFlags,
    loadMonitoring,
  ]);

  // ========================
  // Render
  // ========================
  return (
    <div dir="rtl" className="min-h-screen text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">אדמין</h1>
      </header>

      <AdminStats stats={stats} />

      <div className="flex justify-between mt-8 bg-neutral-800 rounded-2xl mb-6 overflow-hidden w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-6 py-2 transition ${
              selectedTab === tab.key
                ? "w-fit border-b-2 border-brand-orange overflow-hidden text-brand-orange font-bold"
                : "font-bold text-white"
            }`}
            onClick={() => setTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Search
          value={searchValue}
          variant="full"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchValue(e.target.value)
          }
        />

        {selectedTab === "invitations" && (
          <DesignActionButton onClick={() => setInviteModalOpen(true)}>
            <Mail size={18} />
            הזמן אמן
          </DesignActionButton>
        )}
      </div>

      {selectedTab === "users" ? (
        <div className="space-y-3">
          {usersLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען משתמשים...
            </div>
          ) : usersUnsupported ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Users size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">Admin endpoint missing</p>
              <p className="text-neutral-500 text-xs mt-1">GET /admin/users</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Users size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">אין משתמשים להצגה</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <CardContainer key={u.id}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {u.full_name || "משתמש ללא שם"}
                  </h3>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <SmallBadge icon={<Mail size={14} />}>{u.email}</SmallBadge>
                    <SmallBadge icon={<Shield size={14} />} variant="brand">
                      {u.role}
                    </SmallBadge>
                    <SmallBadge icon={<BadgeCheck size={14} />} variant="brand">
                      {u.subscription_type || "trial"}
                    </SmallBadge>
                  </div>
                </div>

                <div className="flex gap-6 items-center">
                  <button
                    onClick={() => openEditUser(u)}
                    className="w-6 h-6 text-white hover:text-brand-orange"
                    title="עריכה"
                    type="button"
                  >
                    <Pencil size={20} />
                  </button>

                  <button
                    onClick={() => impersonateUser(u.id)}
                    className="w-6 h-6 text-white hover:text-brand-orange"
                    title="ייצוג"
                    type="button"
                  >
                    <UserCog size={20} />
                  </button>

                  <button
                    onClick={() => deleteUser(u.id)}
                    className="w-6 h-6 text-red-500 hover:text-red-400"
                    title="מחיקה"
                    type="button"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </CardContainer>
            ))
          )}
        </div>
      ) : selectedTab === "repos" ? (
        <div className="space-y-3">
          {songsLoading || lineupsLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען מאגרים...
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Database size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">אין מאגרים להצגה</p>
              <p className="text-neutral-500 text-xs mt-1">
                נגזר מ-GET /songs ו-GET /lineups
              </p>
            </div>
          ) : (
            filteredRepos.map((r) => (
              <CardContainer key={r.ownerId}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {r.ownerName}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.ownerEmail && (
                      <SmallBadge icon={<Mail size={14} />}>
                        {r.ownerEmail}
                      </SmallBadge>
                    )}
                    <SmallBadge icon={<BadgeCheck size={14} />} variant="brand">
                      {r.songsCount} שירים
                    </SmallBadge>
                    <SmallBadge icon={<BadgeCheck size={14} />} variant="brand">
                      {r.lineupsCount} ליינאפים
                    </SmallBadge>
                  </div>
                </div>

                <div className="flex gap-6 items-center">
                  <button
                    onClick={() => openRepoManage(r.ownerId)}
                    className="w-6 h-6 text-white hover:text-brand-orange"
                    title="ניהול"
                    type="button"
                  >
                    <Pencil size={20} />
                  </button>

                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "השבתה",
                        message: "TODO: אין endpoint קיים להשבתה/הפעלה של מאגר",
                      });
                      if (!ok) return;
                      showToast(
                        "TODO: אין endpoint קיים להשבתה/הפעלה של מאגר",
                        "info"
                      );
                    }}
                    className="w-6 h-6 text-white hover:text-brand-orange"
                    title="השבת"
                    type="button"
                  >
                    <ToggleLeft size={22} />
                  </button>

                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "מחיקה",
                        message: "TODO: אין endpoint קיים למחיקת מאגר",
                      });
                      if (!ok) return;
                      showToast("TODO: אין endpoint קיים למחיקת מאגר", "info");
                    }}
                    className="w-6 h-6 text-red-500 hover:text-red-400"
                    title="מחיקה"
                    type="button"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </CardContainer>
            ))
          )}
        </div>
      ) : selectedTab === "subscriptions" ? (
        <div className="space-y-3">
          {usersLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען מנויים...
            </div>
          ) : usersUnsupported ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <BadgeCheck size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">Admin endpoint missing</p>
              <p className="text-neutral-500 text-xs mt-1">GET /admin/users</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <BadgeCheck size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">אין נתונים להצגה</p>
              <p className="text-neutral-500 text-xs mt-1">GET /admin/users</p>
            </div>
          ) : (
            users
              .filter((u) => {
                const q = searchByTab.subscriptions.trim().toLowerCase();
                if (!q) return true;
                return `${u.full_name || ""} ${u.email} ${
                  u.subscription_type || ""
                }`
                  .toLowerCase()
                  .includes(q);
              })
              .map((u) => {
                const isEditing = editingSubscriptionUserId === u.id;

                // subscription_status is the source of truth for admin UI – do not infer from subscription_type
                const rawStatus = u.subscription_status;
                const statusLabel =
                  typeof rawStatus === "string" && rawStatus.trim()
                    ? rawStatus
                    : "—";

                const startedLabel = formatSubscriptionDate(
                  u.subscription_started_at ?? null
                );
                const expiresLabel = formatSubscriptionDate(
                  u.subscription_expires_at ?? null
                );

                const baseSubForm: SubscriptionEdit = {
                  subscription_type: normalizeSubscriptionType(
                    u.subscription_type
                  ),
                  subscription_status:
                    typeof rawStatus === "string" && rawStatus.trim()
                      ? rawStatus
                      : "",
                  subscription_started_at: u.subscription_started_at || "",
                  subscription_expires_at: u.subscription_expires_at || "",
                };

                const subForm = subscriptionEdits[u.id] ?? baseSubForm;

                return (
                  <CardContainer key={`sub-${u.id}`}>
                    <div className="flex-1 min-w-0 text-right">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {u.full_name || "משתמש ללא שם"}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <SmallBadge icon={<Mail size={14} />}>
                          {u.email}
                        </SmallBadge>
                        <SmallBadge
                          icon={<BadgeCheck size={14} />}
                          variant="brand"
                        >
                          {normalizeSubscriptionType(u.subscription_type)}
                        </SmallBadge>
                        <SmallBadge>{statusLabel}</SmallBadge>
                        <SmallBadge>{startedLabel}</SmallBadge>
                        <SmallBadge>{expiresLabel}</SmallBadge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      {!isEditing ? (
                        <DesignActionButton
                          type="button"
                          onClick={() => {
                            setEditingSubscriptionUserId(u.id);
                            setSubscriptionEdits((prev) => ({
                              ...prev,
                              [u.id]: baseSubForm,
                            }));
                          }}
                        >
                          ערוך מנוי
                        </DesignActionButton>
                      ) : (
                        <>
                          <label className="text-xs text-neutral-300 font-bold">
                            מסלול מנוי
                          </label>
                          <select
                            value={subForm.subscription_type}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSubscriptionEdits((prev) => {
                                const current = prev[u.id] ?? baseSubForm;
                                return {
                                  ...prev,
                                  [u.id]: {
                                    ...current,
                                    subscription_type: value,
                                  },
                                };
                              });
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm"
                          >
                            <option value="trial">trial</option>
                            <option value="pro">pro</option>
                          </select>

                          <label className="text-xs text-neutral-300 font-bold mt-2">
                            סטטוס מנוי
                          </label>
                          <select
                            value={subForm.subscription_status}
                            onChange={async (e) => {
                              const value = e.target.value;

                              // Update local edit state so UI reflects the selection immediately
                              setSubscriptionEdits((prev) => {
                                const current = prev[u.id] ?? baseSubForm;
                                return {
                                  ...prev,
                                  [u.id]: {
                                    ...current,
                                    subscription_status: value,
                                  },
                                };
                              });

                              try {
                                // Explicitly update only subscription_status on the backend
                                await api.put(
                                  `/admin/users/${u.id}/subscription`,
                                  {
                                    subscription_status: value,
                                  }
                                );
                                showToast(
                                  "Subscription status updated",
                                  "success"
                                );
                                await reload();
                              } catch (err: any) {
                                // Subscription updates are intentionally handled via /admin/users/:id/subscription
                                const msg =
                                  err?.response?.data?.message ||
                                  "שגיאה בעדכון סטטוס המנוי";
                                showToast(msg, "error");
                              }
                            }}
                            className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm"
                          >
                            <option value="active">active</option>
                            <option value="trial">trial</option>
                            <option value="expired">expired</option>
                          </select>

                          <label className="text-xs text-neutral-300 font-bold mt-2">
                            תאריכי מנוי (start / end)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                            <input
                              type="datetime-local"
                              placeholder="subscription_started_at"
                              value={toDateTimeLocalInput(
                                subForm.subscription_started_at || ""
                              )}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSubscriptionEdits((prev) => {
                                  const current = prev[u.id] ?? baseSubForm;
                                  return {
                                    ...prev,
                                    [u.id]: {
                                      ...current,
                                      subscription_started_at: value,
                                    },
                                  };
                                });
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-xs"
                            />
                            <input
                              type="datetime-local"
                              placeholder="subscription_expires_at"
                              value={toDateTimeLocalInput(
                                subForm.subscription_expires_at || ""
                              )}
                              onChange={(e) => {
                                const value = e.target.value;
                                setSubscriptionEdits((prev) => {
                                  const current = prev[u.id] ?? baseSubForm;
                                  return {
                                    ...prev,
                                    [u.id]: {
                                      ...current,
                                      subscription_expires_at: value,
                                    },
                                  };
                                });
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-xs"
                            />
                          </div>

                          <div className="flex gap-2 mt-2">
                            <DesignActionButton
                              type="button"
                              onClick={async () => {
                                try {
                                  const payload: any = {
                                    subscription_type:
                                      subForm.subscription_type,
                                    subscription_status:
                                      subForm.subscription_status,
                                    subscription_started_at:
                                      subForm.subscription_started_at || null,
                                    subscription_expires_at:
                                      subForm.subscription_expires_at || null,
                                  };
                                  await api.put(
                                    `/admin/users/${u.id}/subscription`,
                                    payload
                                  );
                                  showToast("Subscription updated", "success");
                                  setEditingSubscriptionUserId(null);
                                  await reload();
                                } catch (err: any) {
                                  const msg =
                                    err?.response?.data?.message ||
                                    "שגיאה בעדכון מנוי";
                                  showToast(msg, "error");
                                }
                              }}
                            >
                              שמור מנוי
                            </DesignActionButton>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubscriptionUserId(null);
                                setSubscriptionEdits((prev) => {
                                  const next = { ...prev };
                                  delete next[u.id];
                                  return next;
                                });
                              }}
                              className="text-xs text-neutral-400 hover:text-neutral-200"
                            >
                              ביטול
                            </button>
                          </div>

                          <p className="text-[11px] text-neutral-500">
                            שינוי זה מעדכן רק שדות מנוי של המשתמש (plan/status/
                            start/end) ולא משנה מחירי מסלולים.
                          </p>
                        </>
                      )}
                    </div>
                  </CardContainer>
                );
              })
          )}
        </div>
      ) : selectedTab === "plans" ? (
        <div className="space-y-3">
          {plansLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען מסלולים...
            </div>
          ) : plansError ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <BadgeCheck size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">{plansError}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <BadgeCheck size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">אין מסלולים להצגה</p>
            </div>
          ) : (
            plans.map((plan) => (
              <CardContainer key={plan.tier}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {plan.tier}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <SmallBadge variant="brand">{plan.currency}</SmallBadge>
                    <SmallBadge>{plan.billing_period || "monthly"}</SmallBadge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-start">
                  <label className="text-xs text-neutral-300 font-bold">
                    מחיר
                  </label>
                  {typeof plan.monthlyPrice === "number" ? (
                    <input
                      type="number"
                      value={editPrice[plan.tier] ?? plan.monthlyPrice}
                      onChange={(e) =>
                        setEditPrice((prev) => ({
                          ...prev,
                          [plan.tier]: Number(e.target.value),
                        }))
                      }
                      className="w-24 bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm"
                    />
                  ) : (
                    <span>{plan.monthlyPrice}</span>
                  )}
                  <button
                    className="bg-brand-orange text-black px-3 py-1 rounded-2xl text-xs font-bold mt-1"
                    onClick={async () => {
                      try {
                        await api.put("/admin/subscriptions/settings", {
                          price_ils: editPrice[plan.tier] ?? plan.monthlyPrice,
                        });
                        showToast("Subscription price updated", "success");
                        await loadPlans();
                      } catch (err) {
                        showToast("שגיאה בעדכון מחיר המנוי", "error");
                      }
                    }}
                    disabled={typeof plan.monthlyPrice !== "number"}
                  >
                    שמור מחיר
                  </button>
                  {typeof plan.enabled === "boolean" ? (
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={plan.enabled}
                        disabled
                        className="accent-brand-orange"
                      />
                      <span>Enabled</span>
                      <span className="text-xs text-neutral-500">
                        TODO: אין endpoint לעריכת enabled
                      </span>
                    </label>
                  ) : null}
                </div>
              </CardContainer>
            ))
          )}
        </div>
      ) : selectedTab === "payments" ? (
        <AdminPayments />
      ) : selectedTab === "files" ? (
        <div className="space-y-3">
          {filesLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען קבצים...
            </div>
          ) : filesUnsupported ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Files size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">
                TODO: backend endpoint required
              </p>
              <p className="text-neutral-500 text-xs mt-1">GET /files</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Files size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">אין קבצים להצגה</p>
            </div>
          ) : (
            filteredFiles.map((f) => (
              <CardContainer key={f.id}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {f.name || f.file_name || `file:${f.id}`}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <SmallBadge icon={<Files size={14} />} variant="brand">
                      {f.type || f.mime_type || "file"}
                    </SmallBadge>
                    {(f.owner_name || f.owner_email) && (
                      <SmallBadge icon={<Users size={14} />}>
                        {f.owner_name || f.owner_email}
                      </SmallBadge>
                    )}
                    {(typeof f.size === "number" ||
                      typeof f.size_bytes === "number") && (
                      <SmallBadge>
                        {Math.round(
                          ((f.size_bytes ?? f.size) as number) / 1024
                        )}
                        KB
                      </SmallBadge>
                    )}
                  </div>
                </div>

                <div className="flex gap-6 flex-row-reverse items-center">
                  <button
                    onClick={() => deleteFile(f.id)}
                    className="w-6 h-6 text-red-500 hover:text-red-400"
                    title="מחיקה"
                    type="button"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </CardContainer>
            ))
          )}
        </div>
      ) : selectedTab === "invitations" ? (
        <div className="space-y-3">
          {invitedArtistsLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען הזמנות...
            </div>
          ) : filteredInvitedArtists.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Mail size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">אין הזמנות להצגה</p>
              <p className="text-neutral-500 text-xs mt-1">
                GET /users/connected-to-me
              </p>
            </div>
          ) : (
            filteredInvitedArtists.map((a) => (
              <CardContainer key={a.id}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {a.full_name || "אמן ללא שם"}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {a.email && (
                      <SmallBadge icon={<Mail size={14} />}>
                        {a.email}
                      </SmallBadge>
                    )}
                    {a.artist_role && (
                      <SmallBadge
                        icon={<BadgeCheck size={14} />}
                        variant="brand"
                      >
                        {a.artist_role}
                      </SmallBadge>
                    )}
                  </div>
                </div>

                <div className="flex gap-6 flex-row-reverse items-center">
                  <button
                    onClick={() => uninviteArtist(a.id, a.full_name)}
                    className="w-6 h-6 text-red-500 hover:text-red-400"
                    title="ביטול שיתוף"
                    type="button"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </CardContainer>
            ))
          )}
        </div>
      ) : selectedTab === "logs" ? (
        <div className="space-y-3">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-300 font-bold">
                    Level
                  </label>
                  <select
                    value={logsLevel}
                    onChange={(e) => {
                      setLogsLevel(e.target.value as any);
                      setLogsOffset(0);
                    }}
                    className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
                  >
                    <option value="">All</option>
                    <option value="info">info</option>
                    <option value="warn">warn</option>
                    <option value="error">error</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-300 font-bold">
                    Action
                  </label>
                  <select
                    value={logsAction}
                    onChange={(e) => {
                      setLogsAction(e.target.value);
                      setLogsOffset(0);
                    }}
                    className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm min-w-40"
                  >
                    <option value="">All</option>
                    {logsActionOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-300 font-bold">
                    User
                  </label>
                  <select
                    value={logsUserId === "" ? "" : String(logsUserId)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setLogsUserId(v ? Number(v) : "");
                      setLogsOffset(0);
                    }}
                    className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm min-w-56"
                  >
                    <option value="">All</option>
                    {users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {(u.full_name || "User").trim()} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-300 font-bold">
                    From
                  </label>
                  <input
                    type="datetime-local"
                    value={logsFromDate}
                    onChange={(e) => {
                      setLogsFromDate(e.target.value);
                      setLogsOffset(0);
                    }}
                    className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-300 font-bold">
                    To
                  </label>
                  <input
                    type="datetime-local"
                    value={logsToDate}
                    onChange={(e) => {
                      setLogsToDate(e.target.value);
                      setLogsOffset(0);
                    }}
                    className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-neutral-300 font-bold">
                    Page Size
                  </label>
                  <select
                    value={String(logsLimit)}
                    onChange={(e) => {
                      setLogsLimit(Number(e.target.value));
                      setLogsOffset(0);
                    }}
                    className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div className="flex-1" />

                <DesignActionButton
                  type="button"
                  onClick={() => setCleanupOpen(true)}
                >
                  ניקוי לוגים
                </DesignActionButton>
              </div>

              <div className="text-xs text-neutral-400">
                {logsTotal > 0 ? (
                  <span>
                    מציג {Math.min(logsOffset + 1, logsTotal)}-
                    {Math.min(logsOffset + logsLimit, logsTotal)} מתוך{" "}
                    {logsTotal}
                  </span>
                ) : (
                  <span>אין תוצאות</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-sm disabled:opacity-50"
                  disabled={logsOffset <= 0}
                  onClick={() =>
                    setLogsOffset((v) => Math.max(0, v - logsLimit))
                  }
                >
                  הקודם
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-sm disabled:opacity-50"
                  disabled={logsOffset + logsLimit >= logsTotal}
                  onClick={() => setLogsOffset((v) => v + logsLimit)}
                >
                  הבא
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-2xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-sm"
                  onClick={() => {
                    setLogsLevel("");
                    setLogsAction("");
                    setLogsUserId("");
                    setLogsFromDate("");
                    setLogsToDate("");
                    setSearchValue("");
                    setLogsOffset(0);
                  }}
                >
                  נקה פילטרים
                </button>
              </div>
            </div>
          </div>

          {logsLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען לוגים...
            </div>
          ) : logsUnsupported ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <ClipboardList
                size={32}
                className="mx-auto mb-3 text-neutral-600"
              />
              <p className="text-neutral-400 text-sm">Endpoint לא זמין</p>
              <p className="text-neutral-500 text-xs mt-1">GET /api/logs</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <ClipboardList
                size={32}
                className="mx-auto mb-3 text-neutral-600"
              />
              <p className="text-neutral-400 text-sm">אין לוגים להצגה</p>
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="grid grid-cols-1">
                <div className="hidden md:grid md:grid-cols-5 gap-2 px-4 py-2 text-xs text-neutral-400 bg-neutral-950 border-b border-neutral-800">
                  <div>Time</div>
                  <div>Level</div>
                  <div>Action</div>
                  <div className="md:col-span-2">Explanation</div>
                </div>

                {logs.map((l) => {
                  const ts = l.createdAt || l.created_at || "";
                  const level = (l.level as any) || "info";
                  const actor =
                    l.actorLabel ||
                    l.user ||
                    (l.userId ? `User ${l.userId}` : "System");
                  const explanation =
                    l.explanation || l.entity || l.message || "";

                  const levelVariant =
                    level === "error"
                      ? "danger"
                      : level === "warn"
                      ? "brand"
                      : "success";

                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedLog(l)}
                      className="w-full text-right px-4 py-3 border-b border-neutral-800 hover:bg-neutral-800/50 transition"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                        <div className="text-xs text-neutral-400 break-all">
                          {ts}
                        </div>
                        <div>
                          <SmallBadge variant={levelVariant as any}>
                            {level}
                          </SmallBadge>
                        </div>
                        <div className="text-sm font-bold text-white break-all">
                          {l.action || "LOG"}
                        </div>
                        <div className="md:col-span-2 text-sm text-neutral-200">
                          <div className="truncate md:whitespace-normal">
                            {explanation}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {actor}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedLog && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="text-white font-bold">Log Details</div>
                  <button
                    type="button"
                    className="text-neutral-300 hover:text-white"
                    onClick={() => setSelectedLog(null)}
                  >
                    סגור
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <div className="text-xs text-neutral-400">Timestamp</div>
                      <div className="text-white break-all">
                        {selectedLog.createdAt || selectedLog.created_at || ""}
                      </div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <div className="text-xs text-neutral-400">UserId</div>
                      <div className="text-white">
                        {selectedLog.userId ?? "—"}
                      </div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <div className="text-xs text-neutral-400">Action</div>
                      <div className="text-white break-all">
                        {selectedLog.action || ""}
                      </div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <div className="text-xs text-neutral-400">Level</div>
                      <div className="text-white">
                        {selectedLog.level || "info"}
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                    <div className="text-xs text-neutral-400 mb-2">Context</div>
                    <pre className="text-xs text-neutral-200 whitespace-pre-wrap break-words max-h-[40vh] overflow-auto">
                      {JSON.stringify(selectedLog.context ?? null, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {cleanupOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                  <div className="text-white font-bold">ניקוי לוגים</div>
                  <button
                    type="button"
                    className="text-neutral-300 hover:text-white"
                    onClick={() => {
                      setCleanupOpen(false);
                      setCleanupConfirmText("");
                    }}
                  >
                    סגור
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="text-sm text-neutral-300">
                    פעולה זו מוחקת לוגים מהמערכת. כדי לאשר, הקלד{" "}
                    <span className="font-bold text-white">DELETE LOGS</span>.
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <div className="text-xs text-neutral-400">
                        olderThanDays
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={cleanupOlderThanDays}
                        onChange={(e) =>
                          setCleanupOlderThanDays(Number(e.target.value))
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm mt-2"
                      />
                      <div className="text-[11px] text-neutral-500 mt-1">
                        אם beforeDate ריק, יימחקו לוגים ישנים מ-X ימים.
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <div className="text-xs text-neutral-400">
                        beforeDate (ISO)
                      </div>
                      <input
                        type="text"
                        placeholder="2026-01-01T00:00:00Z"
                        value={cleanupBeforeDate}
                        onChange={(e) => setCleanupBeforeDate(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm mt-2"
                      />
                      <div className="text-[11px] text-neutral-500 mt-1">
                        אם ממולא — מתעלם מ-olderThanDays.
                      </div>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                      <div className="text-xs text-neutral-400">
                        Confirmation
                      </div>
                      <input
                        type="text"
                        value={cleanupConfirmText}
                        onChange={(e) => setCleanupConfirmText(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm mt-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-sm"
                      onClick={() => {
                        setCleanupOpen(false);
                        setCleanupConfirmText("");
                      }}
                    >
                      ביטול
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-2xl bg-red-600 hover:bg-red-500 text-sm disabled:opacity-50"
                      disabled={cleanupLoading}
                      onClick={runLogsCleanup}
                    >
                      {cleanupLoading ? "מנקה..." : "מחק לוגים"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : selectedTab === "errors" ? (
        <div className="space-y-3">
          {errorsLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען תקלות...
            </div>
          ) : errorsUnsupported ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <AlertCircle
                size={32}
                className="mx-auto mb-3 text-neutral-600"
              />
              <p className="text-neutral-400 text-sm">
                TODO: backend endpoint required
              </p>
              <p className="text-neutral-500 text-xs mt-1">GET /errors</p>
            </div>
          ) : filteredErrors.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <AlertCircle
                size={32}
                className="mx-auto mb-3 text-neutral-600"
              />
              <p className="text-neutral-400 text-sm">אין תקלות להצגה</p>
            </div>
          ) : (
            filteredErrors.map((e) => (
              <CardContainer key={e.id}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {e.message || "תקלה"}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {e.route && <SmallBadge>{e.route}</SmallBadge>}
                    {e.user && (
                      <SmallBadge icon={<Users size={14} />}>
                        {e.user}
                      </SmallBadge>
                    )}
                    <SmallBadge
                      icon={<AlertCircle size={14} />}
                      variant={
                        (e.status || (e.resolved ? "resolved" : "open")) ===
                          "open" || e.resolved === false
                          ? "danger"
                          : "success"
                      }
                    >
                      {e.status || (e.resolved ? "resolved" : "open")}
                    </SmallBadge>
                  </div>
                </div>

                <div className="flex gap-6 flex-row-reverse items-center">
                  <button
                    onClick={() => resolveError(e.id)}
                    disabled={
                      !(
                        (e.status || (e.resolved ? "resolved" : "open")) ===
                          "open" || e.resolved === false
                      )
                    }
                    className={`w-6 h-6 ${
                      (e.status || (e.resolved ? "resolved" : "open")) ===
                        "open" || e.resolved === false
                        ? "text-brand-orange hover:text-white"
                        : "text-neutral-500"
                    }`}
                    title="resolve"
                    type="button"
                  >
                    <BadgeCheck size={20} />
                  </button>
                </div>
              </CardContainer>
            ))
          )}
        </div>
      ) : selectedTab === "featureFlags" ? (
        <div className="space-y-3">
          {featureFlagsLoading ? (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען flags...
            </div>
          ) : featureFlagsUnsupported ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Flag size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">
                TODO: backend endpoint required
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                GET /feature-flags
              </p>
            </div>
          ) : filteredFeatureFlags.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <Flag size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">אין Flags להצגה</p>
            </div>
          ) : (
            filteredFeatureFlags.map((f) => (
              <CardContainer key={f.key}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">{f.key}</h3>
                  {f.description && (
                    <p className="text-sm text-neutral-300">{f.description}</p>
                  )}
                </div>
                <div className="flex gap-6 flex-row-reverse items-center">
                  <button
                    onClick={() => toggleFeatureFlag(f)}
                    className="w-6 h-6 text-brand-orange hover:text-white"
                    title="toggle"
                    type="button"
                  >
                    {f.enabled ? (
                      <ToggleRight size={22} />
                    ) : (
                      <ToggleLeft size={22} />
                    )}
                  </button>
                </div>
              </CardContainer>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {monitoringLoading && (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
              טוען ניטור...
            </div>
          )}
          {monitoringCards.map((c) => (
            <div
              key={c.label}
              className="bg-neutral-800 rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="text-brand-orange shrink-0">{c.icon}</div>
              <div className="flex flex-col">
                <span className="text-xl font-bold">{c.value}</span>
                <span className="text-sm text-neutral-300">{c.label}</span>
              </div>
            </div>
          ))}

          <div className="bg-neutral-800 rounded-2xl p-6 text-center">
            <p className="text-neutral-500 text-xs">
              GET /dashboard-stats (light)
            </p>
          </div>
        </div>
      )}

      {/* User modal */}
      <BaseModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="עריכת משתמש"
        maxWidth="max-w-md"
      >
        <form onSubmit={saveUser} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">עריכת משתמש</h2>

          <input
            value={userForm.full_name}
            onChange={(e) =>
              setUserForm((p) => ({ ...p, full_name: e.target.value }))
            }
            placeholder="שם"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-neutral-300 font-bold">role</label>
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, role: e.target.value }))
                }
                className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
              >
                <option value="user">user</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-neutral-300 font-bold">
                subscription
              </label>
              <select
                value={userForm.subscription_type}
                onChange={(e) =>
                  setUserForm((p) => ({
                    ...p,
                    subscription_type: e.target.value,
                  }))
                }
                disabled={subscriptionTypeLocked}
                className="w-full bg-neutral-800 p-2 rounded-2xl text-sm disabled:opacity-60"
              >
                <option value="trial">trial</option>
                <option value="pro">pro</option>
              </select>
              {subscriptionTypeLocked && subscriptionTypeOriginal && (
                <p className="text-[11px] text-red-400 mt-1">
                  ערך מנוי לא חוקי מהשרת ("{subscriptionTypeOriginal}")
                   a0 a0 a0מוצג כ‑trial לקריאה בלבד. אי אפשר לערוך מפה.
                </p>
              )}
            </div>
          </div>

          <DesignActionButton type="submit">שמור</DesignActionButton>
        </form>
      </BaseModal>

      {/* Repo management modal */}
      <BaseModal
        open={repoModalOpen}
        onClose={closeRepoManage}
        title="ניהול מאגר"
        maxWidth="max-w-3xl"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">ניהול מאגר</h2>
            <button
              onClick={() => reload()}
              className="text-brand-orange font-bold"
              type="button"
            ></button>
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-bold">שירים</h3>
            {repoSongs.length === 0 ? (
              <div className="bg-neutral-800 rounded-2xl p-6 text-center">
                <p className="text-neutral-400 text-sm">אין שירים במאגר</p>
              </div>
            ) : (
              repoSongs.map((s, idx) => (
                <CardSong
                  key={s.id}
                  song={{ ...s, is_owner: true }}
                  index={idx}
                  safeKey={(k: unknown) => String(k || "").trim() || "-"}
                  safeDuration={(d: unknown) => String(d ?? "-")}
                  onEdit={() => openSongEdit(s)}
                  onRemove={() => deleteSong(s.id)}
                  chartsComponent={
                    <div className="mt-2">
                      <SmallBadge icon={<Files size={14} />}>
                        צ'ארטים פרטיים: {(chartsBySong[s.id] || []).length}
                      </SmallBadge>
                    </div>
                  }
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold">ליינאפים</h3>
            {repoLineups.length === 0 ? (
              <div className="bg-neutral-800 rounded-2xl p-6 text-center">
                <p className="text-neutral-400 text-sm">אין ליינאפים במאגר</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {repoLineups.map((l, idx) => (
                  <BlockLineup
                    key={l.id}
                    lineup={{ ...l, is_owner: true }}
                    index={idx}
                    onEdit={() => openLineupEdit(l)}
                    onDelete={() => deleteLineup(l.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </BaseModal>

      {/* Invite modal */}
      <BaseModal
        open={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteEmail("");
        }}
        title="הזמן אמן"
        maxWidth="max-w-md"
      >
        <h2 className="text-xl font-bold mb-4 text-center">הזמן אמן</h2>
        <p className="text-neutral-400 text-sm mb-4 text-center">
          הזן את כתובת האימייל של האמן.
        </p>
        <form onSubmit={sendInvitation} className="flex flex-col gap-3">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="אימייל"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <DesignActionButton type="submit" disabled={inviteLoading}>
            {inviteLoading ? "שולח..." : "שלח הזמנה"}
          </DesignActionButton>
        </form>
      </BaseModal>

      {/* Song edit modal */}
      <BaseModal
        open={songModalOpen}
        onClose={() => {
          setSongModalOpen(false);
          setEditingSong(null);
        }}
        title="עריכת שיר"
        maxWidth="max-w-md"
      >
        <form onSubmit={saveSong} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">עריכת שיר</h2>
          <input
            value={songForm.title}
            onChange={(e) =>
              setSongForm((p) => ({ ...p, title: e.target.value }))
            }
            placeholder="שם השיר"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <input
            value={songForm.artist}
            onChange={(e) =>
              setSongForm((p) => ({ ...p, artist: e.target.value }))
            }
            placeholder="אמן"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={songForm.bpm}
              onChange={(e) =>
                setSongForm((p) => ({ ...p, bpm: e.target.value }))
              }
              placeholder="BPM"
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
            />
            <input
              value={songForm.key_sig}
              onChange={(e) =>
                setSongForm((p) => ({ ...p, key_sig: e.target.value }))
              }
              placeholder="Key"
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
            />
          </div>
          <input
            value={songForm.duration_sec}
            onChange={(e) =>
              setSongForm((p) => ({ ...p, duration_sec: e.target.value }))
            }
            placeholder="Duration"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <input
            value={songForm.notes}
            onChange={(e) =>
              setSongForm((p) => ({ ...p, notes: e.target.value }))
            }
            placeholder="Notes"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <DesignActionButton type="submit">שמור</DesignActionButton>
        </form>
      </BaseModal>

      {/* Lineup edit modal */}
      <BaseModal
        open={lineupModalOpen}
        onClose={() => {
          setLineupModalOpen(false);
          setEditingLineup(null);
        }}
        title="עריכת ליינאפ"
        maxWidth="max-w-md"
      >
        <form onSubmit={saveLineup} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">עריכת ליינאפ</h2>
          <input
            value={lineupForm.title}
            onChange={(e) =>
              setLineupForm((p) => ({ ...p, title: e.target.value }))
            }
            placeholder="כותרת"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={lineupForm.date}
              onChange={(e) =>
                setLineupForm((p) => ({ ...p, date: e.target.value }))
              }
              type="date"
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
            />
            <input
              value={lineupForm.time}
              onChange={(e) =>
                setLineupForm((p) => ({ ...p, time: e.target.value }))
              }
              type="time"
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
            />
          </div>
          <input
            value={lineupForm.location}
            onChange={(e) =>
              setLineupForm((p) => ({ ...p, location: e.target.value }))
            }
            placeholder="מיקום"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <input
            value={lineupForm.description}
            onChange={(e) =>
              setLineupForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="תיאור"
            className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          />
          <DesignActionButton type="submit">שמור</DesignActionButton>
        </form>
      </BaseModal>
    </div>
  );
}
