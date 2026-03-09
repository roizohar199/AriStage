import React from "react";
import {
  Activity,
  BadgeCheck,
  Mail,
  Pencil,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";

import BaseModal from "@/modules/shared/components/BaseModal";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { Input, Select } from "@/modules/shared/components/FormControls";
import { useTranslation } from "@/hooks/useTranslation.ts";

import type { AdminUser } from "../pages/Admin";

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

function formatLastSeen(
  lastSeenAt: string | null | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
): {
  text: string;
  variant: SmallBadgeVariant;
} {
  if (!lastSeenAt)
    return { text: t("admin.usersTab.lastSeen.never"), variant: "neutral" };

  const raw = String(lastSeenAt).trim();
  if (!raw)
    return { text: t("admin.usersTab.lastSeen.never"), variant: "neutral" };

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  if (Number.isNaN(ms))
    return { text: t("admin.usersTab.lastSeen.never"), variant: "neutral" };

  const diffMs = Date.now() - ms;
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return { text: t("admin.usersTab.lastSeen.never"), variant: "neutral" };
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return { text: t("admin.usersTab.lastSeen.justNow"), variant: "success" };
  }
  if (diffMs < 5 * minute) {
    const m = Math.floor(diffMs / minute);
    return {
      text: t("admin.usersTab.lastSeen.minutesAgo", { minutes: m }),
      variant: "success",
    };
  }
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return {
      text: t("admin.usersTab.lastSeen.minutesAgo", { minutes: m }),
      variant: "brand",
    };
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return {
      text: t("admin.usersTab.lastSeen.hoursAgo", { hours: h }),
      variant: "neutral",
    };
  }
  const d = Math.floor(diffMs / day);
  return {
    text: t("admin.usersTab.lastSeen.daysAgo", { days: d }),
    variant: "neutral",
  };
}

function parseDateMs(raw?: string | null): number | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  return Number.isNaN(ms) ? null : ms;
}

type Props = {
  usersLoading: boolean;
  usersUnsupported: boolean;
  filteredUsers: AdminUser[];
  openEditUser: (u: AdminUser) => void;
  impersonateUser: (userId: number) => void;
  deleteUser: (userId: number) => void;
  userModalOpen: boolean;
  setUserModalOpen: (open: boolean) => void;
  userForm: {
    full_name: string;
    role: string;
  };
  setUserForm: React.Dispatch<
    React.SetStateAction<{
      full_name: string;
      role: string;
    }>
  >;
  saveUser: (e: React.FormEvent) => void;
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  SmallBadge: React.ComponentType<{
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: SmallBadgeVariant;
  }>;
  setDashboardCards?: (cards: DashboardCard[]) => void;
};

export default function AdminUsersTab({
  usersLoading,
  usersUnsupported,
  filteredUsers,
  openEditUser,
  impersonateUser,
  deleteUser,
  userModalOpen,
  setUserModalOpen,
  userForm,
  setUserForm,
  saveUser,
  CardContainer,
  SmallBadge,
  setDashboardCards,
}: Props) {
  const { t, locale } = useTranslation();

  const roleLabel = React.useCallback(
    (role: string) => {
      switch (role) {
        case "user":
          return t("admin.usersTab.roles.user");
        case "manager":
          return t("admin.usersTab.roles.manager");
        case "admin":
          return t("admin.usersTab.roles.admin");
        default:
          return role;
      }
    },
    [t],
  );

  const stats = React.useMemo(() => {
    const total = filteredUsers.length;
    const admins = filteredUsers.filter(
      (u) => u.role === "admin" || u.role === "manager",
    ).length;

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const active7d = filteredUsers.filter((u) => {
      const ms = parseDateMs(u.last_seen_at ?? null);
      return ms != null && now - ms <= sevenDaysMs;
    }).length;

    const new30d = filteredUsers.filter((u) => {
      const ms = parseDateMs(u.created_at ?? null);
      return ms != null && now - ms <= thirtyDaysMs;
    }).length;

    return { total, admins, active7d, new30d };
  }, [filteredUsers]);

  React.useLayoutEffect(() => {
    setDashboardCards?.([
      {
        icon: <Users size={32} />,
        value: stats.total,
        label: t("admin.usersTab.dashboard.total"),
      },
      {
        icon: <Shield size={32} />,
        value: stats.admins,
        label: t("admin.usersTab.dashboard.admins"),
      },
      {
        icon: <Activity size={32} />,
        value: stats.active7d,
        label: t("admin.usersTab.dashboard.active7d"),
      },
      {
        icon: <BadgeCheck size={32} />,
        value: stats.new30d,
        label: t("admin.usersTab.dashboard.new30d"),
      },
    ]);
  }, [
    setDashboardCards,
    stats.active7d,
    stats.admins,
    stats.new30d,
    stats.total,
    t,
  ]);

  return (
    <>
      <div className="space-y-3">
        {usersLoading ? (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
            {t("admin.usersTab.loading")}
          </div>
        ) : usersUnsupported ? (
          <div className="bg-neutral-800 rounded-2xl p-6 text-center">
            <Users size={32} className="mx-auto mb-3 text-neutral-600" />
            <p className="text-neutral-400 text-sm">
              {t("admin.usersTab.unsupported.title")}
            </p>
            <p className="text-neutral-500 text-xs mt-1">
              {t("admin.usersTab.unsupported.endpoint")}
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-neutral-800 rounded-2xl p-6 text-center">
            <Users size={32} className="mx-auto mb-3 text-neutral-600" />
            <p className="text-neutral-400 text-sm">
              {t("admin.usersTab.empty")}
            </p>
          </div>
        ) : (
          [...filteredUsers]
            .sort((a, b) => {
              // Sort by created_at descending (newest first)
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            })
            .map((u) => {
              const lastSeen = formatLastSeen(u.last_seen_at, t);
              return (
                <CardContainer key={u.id}>
                  <div className="flex-1 min-w-0 text-start">
                    <h3 className="text-lg font-bold text-neutral-100 mb-1">
                      {u.full_name ? u.full_name : ""}
                    </h3>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <SmallBadge icon={<Mail size={14} />}>
                        {u.email}
                      </SmallBadge>
                      <SmallBadge icon={<Shield size={14} />} variant="brand">
                        {roleLabel(u.role)}
                      </SmallBadge>
                      <SmallBadge
                        icon={<Activity size={14} />}
                        variant={lastSeen.variant}
                      >
                        {lastSeen.text}
                      </SmallBadge>
                      <SmallBadge
                        icon={<BadgeCheck size={14} />}
                        variant="neutral"
                      >
                        {u.created_at
                          ? new Date(u.created_at).toLocaleString(
                              locale || undefined,
                            )
                          : ""}
                      </SmallBadge>
                    </div>
                  </div>

                  <div className="flex gap-6 items-center">
                    <button
                      onClick={() => impersonateUser(u.id)}
                      className="w-6 h-6 text-neutral-100 hover:text-brand-primary"
                      title={t("admin.impersonate")}
                      type="button"
                    >
                      <UserCog size={20} />
                    </button>

                    <button
                      onClick={() => openEditUser(u)}
                      className="w-6 h-6 text-neutral-100 hover:text-brand-primary"
                      title={t("common.edit")}
                      type="button"
                    >
                      <Pencil size={20} />
                    </button>

                    <button
                      onClick={() => deleteUser(u.id)}
                      className="w-6 h-6 text-red-500 hover:text-red-400"
                      title={t("common.delete")}
                      type="button"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </CardContainer>
              );
            })
        )}
      </div>

      {/* User modal */}
      <BaseModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={t("admin.editUser")}
        maxWidth="max-w-md"
      >
        <form onSubmit={saveUser} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t("admin.editUser")}</h2>

          <Input
            value={userForm.full_name}
            onChange={(e) =>
              setUserForm((p) => ({ ...p, full_name: e.target.value }))
            }
            placeholder={t("admin.usersTab.form.fullNamePlaceholder")}
            className="mb-0"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Select
                label={t("admin.userRole")}
                value={userForm.role}
                onChange={(role) => setUserForm((p) => ({ ...p, role }))}
                options={[
                  { value: "user", label: t("admin.usersTab.roles.user") },
                  {
                    value: "manager",
                    label: t("admin.usersTab.roles.manager"),
                  },
                  { value: "admin", label: t("admin.usersTab.roles.admin") },
                ]}
              />
            </div>
          </div>

          <DesignActionButton type="submit">
            {t("common.save")}
          </DesignActionButton>
        </form>
      </BaseModal>
    </>
  );
}
