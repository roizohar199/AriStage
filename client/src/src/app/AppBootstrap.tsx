import React, { useEffect, useMemo, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { reloadAuth } from "@/modules/shared/lib/authReload.js";
import { emitToast } from "@/modules/shared/lib/toastBus.js";
import { io } from "socket.io-client";
import { API_ORIGIN } from "@/config/apiConfig";
import api from "@/modules/shared/lib/api.js";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import { useFeatureFlags } from "@/modules/shared/contexts/FeatureFlagsContext.tsx";
import { useOfflineStatus } from "@/modules/shared/hooks/useOfflineStatus";
import { applyThemeFromUser } from "@/modules/shared/lib/theme";
import { applyLocaleFromUser } from "@/modules/shared/lib/locale";
import { registerSW } from "virtual:pwa-register";
import { useTranslation } from "@/hooks/useTranslation.ts";

import ProtectedRoute from "@/modules/shared/components/ProtectedRoute.tsx";
import Splash from "@/modules/shared/components/Splash.tsx";
import {
  RoleRoute,
  GuestOnlyRoute,
} from "@/modules/shared/components/RoleRoute.tsx";

import { AdminGuard } from "@/modules/admin/components/AdminGuard.tsx";

import { publicRoutes, protectedRoutes } from "../modules/routes.js";
import LineupDetails from "../modules/lineups/pages/LineupDetails.tsx";
import AppLayout from "../layouts/AppLayout.tsx";

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  subscription_type?: string;
  theme?: number | string | null;
  preferred_locale?: string | null;
}

function exitImpersonationLocalized(
  t: (path: string, params?: any, fallback?: string) => string,
): void {
  const origUser = localStorage.getItem("ari_original_user");
  const origToken = localStorage.getItem("ari_original_token");

  if (!origUser || !origToken) {
    emitToast(t("auth.impersonationNoOriginalAccount"), "error");
    return;
  }

  localStorage.setItem("ari_user", origUser);
  localStorage.setItem("ari_token", origToken);
  localStorage.removeItem("ari_original_user");
  localStorage.removeItem("ari_original_token");

  reloadAuth();
  emitToast(t("auth.impersonationBackToOriginal"), "success");

  setTimeout(() => {
    window.location.replace("/home");
  }, 250);
}

export default function AppBootstrap(): JSX.Element {
  const location = useLocation();
  const { t } = useTranslation();
  const { user: ctxUser, loading: authLoading, subscriptionStatus } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const { isEffectiveOffline } = useOfflineStatus();

  const prevSocketRef = useRef<ReturnType<typeof io> | null>(null);

  const offlineOnlineEnabled = isEnabled("module.offlineOnline", true);
  const effectiveOffline = offlineOnlineEnabled ? isEffectiveOffline : false;

  /* -----------------------------------------
     🟦 המשתמש הנוכחי (moved from App.tsx)
  ----------------------------------------- */
  const currentUser: User = JSON.parse(
    localStorage.getItem("ari_user") || "{}",
  );

  const effectiveUser = (ctxUser?.id ? ctxUser : currentUser) as any;
  const isAdminUser = effectiveUser?.role === "admin";

  useEffect(() => {
    applyThemeFromUser(effectiveUser);
  }, [effectiveUser?.id, effectiveUser?.theme]);

  useEffect(() => {
    applyLocaleFromUser(effectiveUser);
  }, [effectiveUser?.id, effectiveUser?.preferred_locale]);

  const isAuthenticated = (() => {
    try {
      const token = localStorage.getItem("ari_token");
      if (token) return true;
      const raw = localStorage.getItem("ari_user");
      if (!raw) return !!effectiveUser?.id;
      const parsed = JSON.parse(raw);
      return !!parsed?.token || !!effectiveUser?.id;
    } catch {
      return !!effectiveUser?.id;
    }
  })();

  /* -----------------------------------------
     🔥 Socket גלובלי אחד לכל האפליקציה (moved from App.tsx)
  ----------------------------------------- */
  const socketToken = useMemo(() => {
    // Keep parity with api.ts (supports either ari_token or ari_user.token)
    try {
      let token = localStorage.getItem("ari_token");
      if (token) return token;
      const raw = localStorage.getItem("ari_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token ? String(parsed.token) : null;
    } catch {
      return null;
    }
    // Re-evaluate on auth state changes so token updates after login/logout.
  }, [ctxUser?.id]);

  const socket = useMemo(() => {
    const s = io(API_ORIGIN, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: Boolean(socketToken),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 20000,
      auth: socketToken ? { token: socketToken } : undefined,
    });
    return s;
  }, [socketToken]);

  // Ensure we disconnect the previous socket instance when token changes
  useEffect(() => {
    const prev = prevSocketRef.current;
    if (prev && prev !== socket) {
      try {
        prev.removeAllListeners();
        prev.disconnect();
      } catch {
        // ignore
      }
    }
    prevSocketRef.current = socket;

    return () => {
      // On unmount: cleanup current socket
      try {
        socket.removeAllListeners();
        socket.disconnect();
      } catch {
        // ignore
      }
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    if (effectiveOffline) {
      socket.disconnect();
      return;
    }

    // Connect only when authenticated; prevents pre-login connection attempts.
    if (socketToken) {
      if (!socket.connected) socket.connect();
    } else {
      if (socket.connected) socket.disconnect();
    }
  }, [effectiveOffline, socket, socketToken]);

  useEffect(() => {
    // Gate PWA offline behavior (service worker) behind feature flag.
    // If disabled, attempt to unregister existing SW registrations.
    if (!offlineOnlineEnabled) {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => {});
      }
      return;
    }

    registerSW({
      immediate: true,
      onOfflineReady() {
        emitToast(t("offline.ready"), "success");
      },
    });
  }, [offlineOnlineEnabled, t]);

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
        }),
      );
    };

    // האזנה לעדכוני ליינאפים - גם כשלא בדף הליינאפ
    const handleLineupSongReordered = ({ lineupId }) => {
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: { type: "lineup-song", action: "reordered", lineupId },
        }),
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
  if (isAuthenticated && (authLoading || subscriptionStatus === null)) {
    return <Splash />;
  }

  /* -----------------------------------------
     🟥 הסתרת ניווט תחתון (moved from App.tsx)
  ----------------------------------------- */
  const hideNav =
    location.pathname === "/login" ||
    location.pathname.startsWith("/reset") ||
    location.pathname.startsWith("/share") ||
    location.pathname === "/billing" ||
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
      onExitImpersonation={() => exitImpersonationLocalized(t)}
      hideNav={hideNav}
    >
      <Routes>
        {/* All routes available - subscription blocking is UI-only (Banner + action guards) */}
        <>
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

          {/* RoleRoute: חוסם דפי My ו-MyArtist לאדמין.
              הערה: זהו החלטת UX בצד הלקוח בלבד.
              בצד השרת admin עדיין יכול לגשת לאותם APIs בדיוק כמו user. */}
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
                    <Route
                      path="lineups/:lineupId"
                      element={<LineupDetails />}
                    />
                  </Route>
                );
              }
              if (path === "/admin") {
                return (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <ProtectedRoute>
                        <AdminGuard>
                          <Component />
                        </AdminGuard>
                      </ProtectedRoute>
                    }
                  />
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
        </>
      </Routes>
    </AppLayout>
  );
}
