import { ComponentType } from "react";
import Landing from "./landing/pages/Landing.tsx";
import Login from "./auth/pages/Login.tsx";
import ResetPassword from "./auth/pages/ResetPassword.tsx";
import AcceptInvitation from "./auth/pages/AcceptInvitation.tsx";
import ShareLineup from "./share/pages/ShareLineup.tsx";
import Home from "./dashboard/pages/Home.tsx";
import Songs from "./songs/pages/Songs.tsx";
import Lineup from "./lineups/pages/Lineup.tsx";
import LineupDetails from "./lineups/pages/LineupDetails.tsx";
import Users from "./users/pages/Users.tsx";
import Settings from "./settings/pages/Settings.tsx";
import Artists from "./artists/pages/Artists.tsx";
import ArtistProfile from "./artists/pages/ArtistProfile.tsx";

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
  { path: "/home", component: Home },
  { path: "/artists", component: Artists },
  { path: "/artist/:id", component: ArtistProfile },
  { path: "/songs", component: Songs },
  { path: "/lineup", component: Lineup },
  { path: "/lineup/:id", component: LineupDetails },
  { path: "/settings", component: Settings },
  { path: "/users", component: Users, roles: ["admin", "manager"] },
];
