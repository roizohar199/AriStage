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

import BaseModal from "@/modules/shared/components/BaseModal";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";

import type { AdminUser } from "../pages/Admin";

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

function formatLastSeen(lastSeenAt?: string | null): {
  text: string;
  variant: SmallBadgeVariant;
} {
  if (!lastSeenAt) return { text: "לא היה פעיל", variant: "neutral" };

  const raw = String(lastSeenAt).trim();
  if (!raw) return { text: "לא היה פעיל", variant: "neutral" };

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  if (Number.isNaN(ms)) return { text: "לא היה פעיל", variant: "neutral" };

  const diffMs = Date.now() - ms;
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return { text: "לא היה פעיל", variant: "neutral" };
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return { text: "לפני רגע", variant: "success" };
  }
  if (diffMs < 5 * minute) {
    const m = Math.floor(diffMs / minute);
    return { text: `לפני ${m} דק׳`, variant: "success" };
  }
  if (diffMs < hour) {
    const m = Math.floor(diffMs / minute);
    return { text: `לפני ${m} דק׳`, variant: "brand" };
  }
  if (diffMs < day) {
    const h = Math.floor(diffMs / hour);
    return { text: `לפני ${h} שעות`, variant: "neutral" };
  }
  const d = Math.floor(diffMs / day);
  return { text: `לפני ${d} ימים`, variant: "neutral" };
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
}: Props) {
  return (
    <>
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
          [...filteredUsers]
            .sort((a, b) => {
              // Sort by created_at descending (newest first)
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            })
            .map((u) => (
              <CardContainer key={u.id}>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {u.full_name ? u.full_name : ""}
                  </h3>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <SmallBadge icon={<Mail size={14} />}>{u.email}</SmallBadge>
                    <SmallBadge icon={<Shield size={14} />} variant="brand">
                      {u.role}
                    </SmallBadge>
                    <SmallBadge
                      icon={<Activity size={14} />}
                      variant={formatLastSeen(u.last_seen_at).variant}
                    >
                      {formatLastSeen(u.last_seen_at).text}
                    </SmallBadge>
                    <SmallBadge
                      icon={<BadgeCheck size={14} />}
                      variant="neutral"
                    >
                      {u.created_at
                        ? new Date(u.created_at).toLocaleString()
                        : ""}
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
          </div>

          <DesignActionButton type="submit">שמור</DesignActionButton>
        </form>
      </BaseModal>
    </>
  );
}
