import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  ClipboardList,
  Files,
  Flag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users, // icon only
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Search from "@/modules/shared/components/Search";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import api from "@/modules/shared/lib/api.ts";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";
import { normalizeSubscriptionType } from "@/modules/shared/hooks/useSubscription.ts";
import AdminSubscriptionsTab from "../tabs/AdminSubscriptionsTab";
import AdminUsersTab from "../tabs/AdminUsersTab";
import AdminPlansTab from "../tabs/AdminPlansTab";

type AdminTab =
  | "users"
  | "subscriptions"
  | "files"
  | "logs"
  | "errors"
  | "featureFlags"
  | "monitoring"
  | "plans";

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: "users", label: "משתמשים" },
  { key: "subscriptions", label: "מנויים" },
  { key: "plans", label: "מסלולים" },
  { key: "files", label: "קבצים" },
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
    activeSubscriptions: number;
    files: number;
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
        <AlertCircle size={32} className="text-brand-orange shrink-0" />
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.openIssues}</span>
          <span className="text-sm text-neutral-300">תקלות פתוחות</span>
        </div>
      </div>
    </div>
  );
}

export type AdminUser = {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
  last_seen_at?: string | null;
  subscription_type?: string | null;
  subscription_status?: string | null;
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

export default function AdminReal() {
  const { showToast } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const selectedTab = useMemo(
    () => getTabFromLocationSearch(location.search),
    [location.search]
  );
  console.log("ADMIN RENDERED");

  const setTab = useCallback(
    (tab: AdminTab) => {
      navigate(`/admin?tab=${tab}`);
    },
    [navigate]
  );

  const [searchByTab, setSearchByTab] = useState<Record<AdminTab, string>>({
    users: "",
    subscriptions: "",
    files: "",
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
      `${u.full_name || ""} ${u.email} ${u.role}`.toLowerCase().includes(q)
    );
  }, [users, searchByTab.users]);

  // Edit modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    full_name: "",
    role: "user",
  });

  const [subscriptionEdits, setSubscriptionEdits] = useState<
    Record<number, SubscriptionEdit>
  >({});
  const [editingSubscriptionUserId, setEditingSubscriptionUserId] = useState<
    number | null
  >(null);

  const openEditUser = (u: AdminUser) => {
    setEditingUserId(u.id);
    setUserForm({
      full_name: u.full_name || "",
      role: u.role,
    });
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
      activeSubscriptions: users.filter(
        (u) => (u.subscription_type || "trial") !== "trial"
      ).length,
      files: files.length,
      openIssues: errors.filter(
        (e) =>
          (e.status || (e.resolved ? "resolved" : "open")) === "open" ||
          e.resolved === false
      ).length,
    };
  }, [users, files, errors]);

  // ------------------------
  // reload() per spec
  // ------------------------
  const reload = useCallback(async () => {
    if (selectedTab === "users" || selectedTab === "subscriptions") {
      await loadUsers();
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
      </div>

      {selectedTab === "users" ? (
        <AdminUsersTab
          usersLoading={usersLoading}
          usersUnsupported={usersUnsupported}
          filteredUsers={filteredUsers}
          openEditUser={openEditUser}
          impersonateUser={impersonateUser}
          deleteUser={deleteUser}
          userModalOpen={userModalOpen}
          setUserModalOpen={setUserModalOpen}
          userForm={userForm}
          setUserForm={setUserForm}
          saveUser={saveUser}
          CardContainer={CardContainer}
          SmallBadge={SmallBadge}
        />
      ) : selectedTab === "subscriptions" ? (
        <AdminSubscriptionsTab
          users={users}
          usersLoading={usersLoading}
          usersUnsupported={usersUnsupported}
          searchValue={searchByTab.subscriptions}
          subscriptionEdits={subscriptionEdits}
          setSubscriptionEdits={setSubscriptionEdits}
          editingSubscriptionUserId={editingSubscriptionUserId}
          setEditingSubscriptionUserId={setEditingSubscriptionUserId}
          reload={reload}
          CardContainer={CardContainer}
          SmallBadge={SmallBadge}
          formatSubscriptionDate={formatSubscriptionDate}
          toDateTimeLocalInput={toDateTimeLocalInput}
          normalizeSubscriptionType={normalizeSubscriptionType}
          showToast={showToast}
          api={api}
        />
      ) : selectedTab === "plans" ? (
        <AdminPlansTab />
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
    </div>
  );
}
