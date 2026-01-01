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
  let items: NavItem[] = [
    { to: "/my", label: "אישי", icon: <User size={22} /> },
    { to: "/MyArtist", label: "משותפים", icon: <Users size={22} /> },
  ];
  // הסתרה לאדמין
  if (role === "admin") {
    items = items.filter(
      (item) => item.to !== "/my" && item.to !== "/MyArtist"
    );
    items.push({ to: "/admin", label: "אדמין", icon: <Shield size={22} /> });
  }
  return items;
}
