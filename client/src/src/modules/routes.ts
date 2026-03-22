import { ComponentType } from "react";
import Landing from "./landing/pages/Landing.tsx";
import Login from "./auth/pages/Login.tsx";
import ResetPassword from "./auth/pages/ResetPassword.tsx";
import AcceptInvitation from "./auth/pages/AcceptInvitation.tsx";
import ShareLineup from "./share/pages/ShareLineup.tsx";
import Logout from "./auth/pages/Logout.tsx";
import SubscriptionBlocked from "./billing/pages/SubscriptionBlocked.tsx";
import AccessibilityStatement from "./landing/pages/AccessibilityStatement.tsx";

import Settings from "./settings/pages/Settings.tsx";
import MyArtist from "./artists/pages/MyArtist.tsx";
import ArtistProfile from "./artists/pages/ArtistProfile.tsx";
import My from "./my/pages/My.tsx";
import Admin from "./admin/pages/Admin.tsx";

interface PublicRoute {
  path: string;
  component: ComponentType;
}

interface ProtectedRoute {
  path: string;
  component: ComponentType;
  roles?: string[];
}

export const publicRoutes: PublicRoute[] = [
  { path: "/", component: Landing },
  { path: "/login", component: Login },
  { path: "/reset/:token", component: ResetPassword },
  { path: "/invite/:token", component: AcceptInvitation },
  { path: "/share/:id", component: ShareLineup },
  { path: "/accessibility", component: AccessibilityStatement },
];

export const protectedRoutes: ProtectedRoute[] = [
  // { path: "/home", component: Home },
  { path: "/my/*", component: My },
  { path: "/MyArtist", component: MyArtist },
  { path: "/artist/:id/*", component: ArtistProfile },
  { path: "/settings", component: Settings },
  { path: "/billing", component: SubscriptionBlocked },
  { path: "/logout", component: Logout },
  // { path: "/users", component: Users, roles: ["admin", "manager"] },
  { path: "/admin", component: Admin },
];
