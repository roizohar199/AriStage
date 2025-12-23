import { ReactNode } from "react";
import { Home, ListMusic, Music, Users, User } from "lucide-react";

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
    { to: "/home", label: "בית", icon: <Home size={22} /> },
    { to: "/my", label: "אישי", icon: <User size={22} /> },
    { to: "/artist2", label: "אמנים", icon: <Users size={22} /> },
    { to: "/songs", label: "שירים", icon: <Music size={22} /> },
    { to: "/lineup", label: "ליינאפ", icon: <ListMusic size={22} /> },
    ...(role === "admin" || role === "manager"
      ? [
          {
            to: "/users",
            label: "משתמשים",
            icon: <Users size={22} />,
            badge: pendingCount,
          },
        ]
      : []),
    // settings removed per request
  ];
}
