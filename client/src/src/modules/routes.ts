import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import Landing from "./landing/pages/Landing.tsx";
import Login from "./auth/pages/Login.tsx";
import ResetPassword from "./auth/pages/ResetPassword.tsx";
import AcceptInvitation from "./auth/pages/AcceptInvitation.tsx";
import Logout from "./auth/pages/Logout.tsx";
import AccessibilityStatement from "./landing/pages/AccessibilityStatement.tsx";

import My from "./my/pages/My.tsx";

const ShareLineup = lazy(() => import("./share/pages/ShareLineup.tsx"));
const SubscriptionBlocked = lazy(
  () => import("./billing/pages/SubscriptionBlocked.tsx"),
);
const PayPalReturn = lazy(() => import("./billing/pages/PayPalReturn.tsx"));
const Settings = lazy(() => import("./settings/pages/Settings.tsx"));
const MyArtist = lazy(() => import("./artists/pages/MyArtist.tsx"));
const ArtistProfile = lazy(() => import("./artists/pages/ArtistProfile.tsx"));
const Admin = lazy(() => import("./admin/pages/Admin.tsx"));

type RouteComponent =
  | ComponentType<any>
  | LazyExoticComponent<ComponentType<any>>;

interface PublicRoute {
  path: string;
  component: RouteComponent;
}

interface ProtectedRoute {
  path: string;
  component: RouteComponent;
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
  { path: "/billing/paypal-return", component: PayPalReturn },
  { path: "/logout", component: Logout },
  // { path: "/users", component: Users, roles: ["admin", "manager"] },
  { path: "/admin", component: Admin },
];
