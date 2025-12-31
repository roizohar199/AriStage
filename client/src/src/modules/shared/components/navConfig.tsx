import { ReactNode } from "react";
import { Home, ListMusic, Music, Shield, Users, User } from "lucide-react";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("ari_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

export function getNavItems(role: string, pendingCount: number): NavItem[] {
  return [
    { to: "/my", label: "אישי", icon: <User size={22} /> },
    { to: "/MyArtist", label: "משותפים", icon: <Users size={22} /> },
    ...(role === "admin"
      ? [{ to: "/admin", label: "אדמין", icon: <Shield size={22} /> }]
      : []),
    // Removed /users nav item (Users.tsx removed)
    // settings removed per request
  ];
}
