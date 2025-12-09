import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { reloadAuth } from "@/modules/shared/lib/authReload.js";
import { emitToast } from "@/modules/shared/lib/toastBus.js";
import { io } from "socket.io-client";

import ToastProvider from "@/modules/shared/components/ToastProvider.tsx";
import BottomNav from "@/modules/shared/components/BottomNav.tsx";
import ProtectedRoute from "@/modules/shared/components/ProtectedRoute.tsx";
import Splash from "@/modules/shared/components/Splash.tsx";

import { publicRoutes, protectedRoutes } from "./modules/routes.js";

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  subscription_type?: string;
}

/* -------------------------------------------------------
   🟧 יציאה מייצוג — גרסה מתוקנת סופית
------------------------------------------------------- */
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

export default function App(): JSX.Element {
  const location = useLocation();

  /* -----------------------------------------
     🔥 Ghost Fix — טעינה חלקה
  ----------------------------------------- */
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  /* -----------------------------------------
     🟦 המשתמש הנוכחי
  ----------------------------------------- */
  const currentUser: User = JSON.parse(localStorage.getItem("ari_user") || "{}");

  /* -----------------------------------------
     🔥 Socket גלובלי אחד לכל האפליקציה
     ⚠️ חשוב: כל ה-Hooks חייבים להיות לפני early return!
  ----------------------------------------- */
  const socket = useMemo(() => {
    const url =
      import.meta.env.VITE_API_URL || "http://localhost:5000";
    return io(url, {
      withCredentials: true,
      // לא מגדירים transports – Socket.IO מנהל לבד polling → websocket
    });
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    // מצטרפים לכל ה־rooms הרלוונטיים עבור המשתמש
    socket.emit("join-user", currentUser.id);
    socket.emit("join-host", currentUser.id);
    socket.emit("join-lineups", currentUser.id);
    socket.emit("join-songs", currentUser.id);

    // כל event global:refresh → הופך ל־data-refresh לכל האפליקציה
    const handleGlobalRefresh = (payload: any) => {
      window.dispatchEvent(
        new CustomEvent("data-refresh", {
          detail: payload || { type: "global" },
        })
      );
    };

    socket.on("global:refresh", handleGlobalRefresh);

    return () => {
      socket.off("global:refresh", handleGlobalRefresh);
      // לא מנתקים את ה-socket - הוא נשאר פעיל לכל האפליקציה
    };
  }, [socket, currentUser?.id]);

  /* -----------------------------------------
     Early return - רק אחרי כל ה-Hooks!
  ----------------------------------------- */
  if (loading) return <Splash />;

  /* -----------------------------------------
     🟥 הסתרת ניווט תחתון
  ----------------------------------------- */
  const hideNav =
    location.pathname === "/login" ||
    location.pathname.startsWith("/reset") ||
    location.pathname.startsWith("/share") ||
    location.pathname === "/" || // דף Landing
    !currentUser?.id;

  /* -----------------------------------------
     🎭 האם בייצוג?
  ----------------------------------------- */
  const isImpersonating = !!localStorage.getItem("ari_original_token");

  return (
    <ToastProvider>
      <div className="min-h-screen pb-20 bg-neutral-950 text-white flex flex-col">
        {/* 🟧 פס התראה לייצוג */}
        {isImpersonating && (
          <div
            className="w-full bg-gradient-to-r from-amber-400/80 via-orange-500/90 to-amber-400/80
            text-black py-2 px-4 text-center font-semibold 
            flex flex-col sm:flex-row items-center justify-center gap-3
            shadow-lg backdrop-blur-md sticky top-0 z-50 border-b border-orange-400/40"
          >
            <span>
              🎭 אתה כרגע מייצג את:{" "}
              <strong>{currentUser.full_name || "משתמש לא מזוהה"}</strong>
            </span>

            <button
              onClick={exitImpersonation}
              className="bg-black/30 hover:bg-black/40 transition px-3 py-1 rounded-lg
              text-white font-bold text-sm border border-black/20 shadow-sm"
            >
              חזרה לחשבון המקורי
            </button>
          </div>
        )}

        {/* 🔥 גוף האתר */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-0 sm:px-6 lg:px-8 pt-6">
          <Routes>
            {publicRoutes.map(({ path, component: Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}

            {protectedRoutes.map(
              ({ path, component: Component, roles = undefined }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute roles={roles}>
                      <Component />
                    </ProtectedRoute>
                  }
                />
              )
            )}

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>

        {/* תפריט תחתון */}
        {!hideNav && <BottomNav />}
      </div>
    </ToastProvider>
  );
}
