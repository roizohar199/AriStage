import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, BadgeCheck, Files, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Search from "@/modules/shared/components/Search";
import api from "@/modules/shared/lib/api.ts";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";
import { normalizeSubscriptionType } from "@/modules/shared/hooks/useSubscription.ts";
import AdminSubscriptionsTab from "../tabs/AdminSubscriptionsTab";
import AdminUsersTab from "../tabs/AdminUsersTab";
import AdminPlansTab from "../tabs/AdminPlansTab";
import AdminFilesTab from "../tabs/AdminFilesTab";
import AdminLogsTab from "../tabs/AdminLogsTab";
import AdminErrorsTab from "../tabs/AdminErrorsTab";
import AdminMonitoringTab from "../tabs/AdminMonitoringTab";
import AdminModelsTab from "../tabs/AdminModelsTab";

type AdminTab =
  | "users"
  | "subscriptions"
  | "plans"
  | "files"
  | "logs"
  | "errors"
  | "monitoring"
  | "models";

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: "users", label: "משתמשים" },
  { key: "subscriptions", label: "מנויים" },
  { key: "plans", label: "מסלולים" },
  { key: "files", label: "קבצים" },
  { key: "logs", label: "לוגים" },
  { key: "errors", label: "תקלות" },
  { key: "monitoring", label: "ניטור מערכת" },
  { key: "models", label: "מודלים" },
];

function getTabFromLocationSearch(search: string): AdminTab {
  const params = new URLSearchParams(search);
  const raw = params.get("tab") || "";

  // Backward compatibility: old tab name
  if (raw === "featureFlags") return "models";

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

export default function AdminReal() {
  const { showToast } = useToast();

  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const selectedTab = useMemo(
    () => getTabFromLocationSearch(location.search),
    [location.search],
  );
  console.log("ADMIN RENDERED");

  const setTab = useCallback(
    (tab: AdminTab) => {
      navigate(`/admin?tab=${tab}`);
    },
    [navigate],
  );

  const [searchByTab, setSearchByTab] = useState<Record<AdminTab, string>>({
    users: "",
    subscriptions: "",
    plans: "",
    files: "",
    logs: "",
    errors: "",
    monitoring: "",
    models: "",
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
      `${u.full_name || ""} ${u.email} ${u.role}`.toLowerCase().includes(q),
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
  // Stats (counts)
  const [filesCount, setFilesCount] = useState(0);
  const [openIssuesCount, setOpenIssuesCount] = useState(0);

  const refreshStatsCounts = useCallback(async () => {
    try {
      const [filesRes, errorsRes] = await Promise.all([
        api.get("/files", { skipErrorToast: true } as any),
        api.get("/errors", { skipErrorToast: true } as any),
      ]);

      const f = Array.isArray(filesRes?.data) ? filesRes.data : [];
      const e = Array.isArray(errorsRes?.data) ? errorsRes.data : [];

      setFilesCount(f.length);
      setOpenIssuesCount(
        e.filter(
          (row: any) =>
            (row.status || (row.resolved ? "resolved" : "open")) === "open" ||
            row.resolved === false,
        ).length,
      );
    } catch {
      setFilesCount(0);
      setOpenIssuesCount(0);
    }
  }, []);

  useEffect(() => {
    // Non-blocking stats loads
    void refreshStatsCounts();
  }, [refreshStatsCounts]);

  const stats = useMemo(() => {
    return {
      users: users.length,
      activeSubscriptions: users.filter(
        (u) => (u.subscription_type || "trial") !== "trial",
      ).length,
      files: filesCount,
      openIssues: openIssuesCount,
    };
  }, [users, filesCount, openIssuesCount]);

  // reload() used by Users/Subscriptions tab flows
  const reload = useCallback(async () => {
    await loadUsers();
    void refreshStatsCounts();
  }, [loadUsers, refreshStatsCounts]);

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
        <AdminFilesTab
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          users={users}
          CardContainer={CardContainer}
          SmallBadge={SmallBadge}
        />
      ) : selectedTab === "logs" ? (
        <AdminLogsTab
          users={users}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          CardContainer={CardContainer}
          SmallBadge={SmallBadge}
        />
      ) : selectedTab === "errors" ? (
        <AdminErrorsTab
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          CardContainer={CardContainer}
          SmallBadge={SmallBadge}
        />
      ) : selectedTab === "models" ? (
        <AdminModelsTab
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          CardContainer={CardContainer}
          SmallBadge={SmallBadge}
        />
      ) : (
        <AdminMonitoringTab />
      )}
    </div>
  );
}
