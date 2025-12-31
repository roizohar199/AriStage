import { ComponentType } from "react";
import Landing from "./landing/pages/Landing.tsx";
import Login from "./auth/pages/Login.tsx";
import ResetPassword from "./auth/pages/ResetPassword.tsx";
import AcceptInvitation from "./auth/pages/AcceptInvitation.tsx";
import ShareLineup from "./share/pages/ShareLineup.tsx";
// Removed unused Home, Songs, Lineup imports
import LineupDetails from "./lineups/pages/LineupDetails.tsx";
// import Users from "./users/pages/Users.tsx";
import Settings from "./settings/pages/Settings.tsx";
import Artists from "./artists/pages/Artists.tsx";
import MyArtist from "./artists/pages/MyArtist.tsx";
import ArtistProfile from "./artists/pages/ArtistProfile.tsx";
import ProfileArtist from "./artists/pages/ProfileArtist.tsx";
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
];

export const protectedRoutes: ProtectedRoute[] = [
  // { path: "/home", component: Home },
  { path: "/my/*", component: My },
  { path: "/MyArtist", component: MyArtist },
  { path: "/artist/:id/*", component: ArtistProfile },
  { path: "/settings", component: Settings },
  // { path: "/users", component: Users, roles: ["admin", "manager"] },
  { path: "/admin", component: Admin, roles: ["admin"] },
];
