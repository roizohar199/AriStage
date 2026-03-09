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

type TranslationFunction = (key: string) => string;

export function getNavItems(
  role: string,
  pendingCount: number,
  t: TranslationFunction,
): NavItem[] {
  let items: NavItem[] = [
    { to: "/my", label: t("nav.personal"), icon: <User size={22} /> },
    { to: "/MyArtist", label: t("nav.shared"), icon: <Users size={22} /> },
  ];
  // הסתרה לאדמין – החלטת UX בצד הלקוח בלבד.
  // בצד השרת admin עדיין יכול לגשת לאותם APIs בדיוק כמו user.
  if (role === "admin") {
    items = items.filter(
      (item) => item.to !== "/my" && item.to !== "/MyArtist",
    );
    items.push({
      to: "/admin",
      label: t("nav.admin"),
      icon: <Shield size={22} />,
    });
  }
  return items;
}
