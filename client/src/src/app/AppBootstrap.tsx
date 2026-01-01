import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { reloadAuth } from "@/modules/shared/lib/authReload.js";
import { emitToast } from "@/modules/shared/lib/toastBus.js";
import { io } from "socket.io-client";
import api from "@/modules/shared/lib/api.js";

import ProtectedRoute from "@/modules/shared/components/ProtectedRoute.tsx";
import Splash from "@/modules/shared/components/Splash.tsx";
import {
  RoleRoute,
  GuestOnlyRoute,
} from "@/modules/shared/components/RoleRoute.tsx";

import { publicRoutes, protectedRoutes } from "../modules/routes.js";
import LineupDetails from "../modules/lineups/pages/LineupDetails.tsx";
import AppLayout from "../layouts/AppLayout.tsx";

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  subscription_type?: string;
}

/* -------------------------------------------------------
   🟧 יציאה מייצוג — גרסה מתוקנת סופית (moved from App.tsx)
-------------------------------------------------------- */
function exitImpersonation(): void {
  const origUser = localStorage.getItem("ari_original_user");
  const origToken = localStorage.getItem("ari_original_token");

  if (!origUser || !origToken) {
    emitToast("⚠️ לא נמצא חשבון מקורי לחזרה", "error");
    return;
  }

  // ✔️ שחזור נתוני המשתמש המקורי
  localStorage.setItem("ari_user", origUser);
  localStorage.setItem("ari_token", origToken);

  // ✔️ ניקוי נתוני הייצוג
  localStorage.removeItem("ari_original_user");
  localStorage.removeItem("ari_original_token");

  reloadAuth();

  emitToast("✅ חזרת לחשבון המקורי", "success");

  // ❗ בעבר היה "/" → גרם לזריקה החוצה
  // ✔️ עכשיו מחזיר לדף המאובטח היחיד: /home
  setTimeout(() => {
    window.location.replace("/home");
  }, 250);
}

export default function AppBootstrap(): JSX.Element {
  const location = useLocation();

  /* -----------------------------------------
     🔥 Ghost Fix — טעינה חלקה (moved from App.tsx)
  ----------------------------------------- */
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  /* -----------------------------------------
     🟦 המשתמש הנוכחי (moved from App.tsx)
  ----------------------------------------- */
  const currentUser: User = JSON.parse(
    localStorage.getItem("ari_user") || "{}"
  );

  /* -----------------------------------------
     🔥 Socket גלובלי אחד לכל האפליקציה (moved from App.tsx)
  ----------------------------------------- */
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL;
    if (!url) {
      console.error("VITE_API_URL is not defined");
      return null;
    }
    return io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
  }, []);

  useEffect(() => {
    if (!socket || !currentUser?.id) {
      return;
    }

    // מצטרפים לכל ה־rooms הרלוונטיים עבור המשתמש
    socket.emit("join-user", currentUser.id);
    socket.emit("join-lineups", currentUser.id);
    socket.emit("join-songs", currentUser.id);

    // בדיקה אם המשתמש הוא אורח או מארח - הצטרפות לחדר המתאים
    api
      .get("/users/check-guest", { skipErrorToast: true })
      .then(({ data }) => {
        if (socket) {
          if (data.isHost) {
            socket.emit("join-host", currentUser.id);
          }
          if (data.hostId) {
            socket.emit("join-host", data.hostId);
          }
        }
      })
      .catch(() => {});

    // כל event global:refresh → הופך ל־data-refresh לכל האפליקציה
    const handleGlobalRefresh = (payload: any) => {
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: payload || { type: "global" },
        })
      );
    };

    // האזנה לעדכוני ליינאפים - גם כשלא בדף הליינאפ
    const handleLineupSongReordered = ({ lineupId }) => {
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "lineup-song", action: "reordered", lineupId },
        })
      );
    };

    socket.on("global:refresh", handleGlobalRefresh);
    socket.on("lineup-song:reordered", handleLineupSongReordered);

    return () => {
      if (socket) {
        socket.off("global:refresh", handleGlobalRefresh);
        socket.off("lineup-song:reordered", handleLineupSongReordered);
        // לא מנתקים את ה-socket - הוא נשאר פעיל לכל האפליקציה
      }
    };
  }, [socket, currentUser?.id]);

  /* -----------------------------------------
     🔥 Early return רק אחרי כל ה-hooks (moved from App.tsx)
  ----------------------------------------- */
  if (loading) return <Splash />;

  /* -----------------------------------------
     🟥 הסתרת ניווט תחתון (moved from App.tsx)
  ----------------------------------------- */
  const hideNav =
    location.pathname === "/login" ||
    location.pathname.startsWith("/reset") ||
    location.pathname.startsWith("/share") ||
    location.pathname === "/" || // דף Landing
    !currentUser?.id;

  /* -----------------------------------------
     🎭 האם בייצוג? (moved from App.tsx)
  ----------------------------------------- */
  const isImpersonating = !!localStorage.getItem("ari_original_token");

  return (
    <AppLayout
      isImpersonating={isImpersonating}
      currentUser={currentUser}
      onExitImpersonation={exitImpersonation}
      hideNav={hideNav}
    >
      <Routes>
        {/* GuestOnlyRoute: חוסם דפי אורח למשתמשים מחוברים */}
        {(() => {
          const LandingComponent = publicRoutes[0].component;
          return (
            <Route
              path="/"
              element={
                <GuestOnlyRoute redirectTo="/my">
                  <LandingComponent />
                </GuestOnlyRoute>
              }
            />
          );
        })()}
        {(() => {
          const LoginComponent = publicRoutes[1].component;
          return (
            <Route
              path="/login"
              element={
                <GuestOnlyRoute redirectTo="/my">
                  <LoginComponent />
                </GuestOnlyRoute>
              }
            />
          );
        })()}
        {/* שאר דפי public */}
        {publicRoutes.slice(2).map(({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}

        {/* RoleRoute: חוסם דפי My ו-MyArtist לאדמין */}
        {(() => {
          const MyComponent = protectedRoutes[0].component;
          return (
            <Route
              path="/my/*"
              element={
                <RoleRoute denyRoles={["admin"]} redirectTo="/admin">
                  <ProtectedRoute>
                    <MyComponent />
                  </ProtectedRoute>
                </RoleRoute>
              }
            />
          );
        })()}
        {(() => {
          const MyArtistComponent = protectedRoutes[1].component;
          return (
            <Route
              path="/MyArtist"
              element={
                <RoleRoute denyRoles={["admin"]} redirectTo="/admin">
                  <ProtectedRoute>
                    <MyArtistComponent />
                  </ProtectedRoute>
                </RoleRoute>
              }
            />
          );
        })()}

        {/* שאר דפי protected */}
        {protectedRoutes
          .slice(2)
          .map(({ path, component: Component, roles = undefined }) => {
            if (path === "/artist/:id/*") {
              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute roles={roles}>
                      <Component />
                    </ProtectedRoute>
                  }
                >
                  <Route path="lineups/:lineupId" element={<LineupDetails />} />
                </Route>
              );
            }
            return (
              <Route
                key={path}
                path={path}
                element={
                  <ProtectedRoute roles={roles}>
                    <Component />
                  </ProtectedRoute>
                }
              />
            );
          })}

        <Route path="*" element={<Navigate to="/my" replace />} />
      </Routes>
    </AppLayout>
  );
}
