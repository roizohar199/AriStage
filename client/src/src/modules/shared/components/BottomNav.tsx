import React, { useEffect, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { Home, Music, Users, Settings, ListMusic, UserCheck } from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { io } from "socket.io-client";

function getUser() {
  try {
    const raw = localStorage.getItem("ari_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function BottomNav() {
  const user = getUser();
  const role = user?.role || "user";
  const [pendingCount, setPendingCount] = useState(0);

  // Socket.IO connection
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return io(url, {
      withCredentials: true,
      // לא מגדירים transports – Socket.IO מנהל לבד polling → websocket
    });
  }, []);

  // טעינת מספר הזמנות ממתינות
  useEffect(() => {
    if (!user?.id) return;

    const loadPendingInvitations = async () => {
      try {
        const { data } = await api.get("/users/pending-invitation", {
          skipErrorToast: true,
        });
        const count = Array.isArray(data) ? data.length : 0;
        setPendingCount(count);
      } catch (err) {
        // שקט - לא להציג שגיאה אם אין הרשאה
        setPendingCount(0);
      }
    };

    loadPendingInvitations();
    
    // הצטרפות ל-socket room
    socket.emit("join-user", user.id);
    
    // האזנה לעדכונים בזמן אמת
    socket.on("invitation:pending", () => {
      loadPendingInvitations();
    });
    
    socket.on("user:invitation-accepted", () => {
      loadPendingInvitations();
    });
    
    socket.on("user:invitation-rejected", () => {
      loadPendingInvitations();
    });
    
    // האזנה לעדכון מיידי דרך custom event
    const handlePendingUpdate = () => {
      loadPendingInvitations();
    };
    window.addEventListener("pending-invitations-updated", handlePendingUpdate);
    
    // רענון כל 30 שניות (fallback)
    const interval = setInterval(loadPendingInvitations, 30000);
    
    return () => {
      socket.off("invitation:pending");
      socket.off("user:invitation-accepted");
      socket.off("user:invitation-rejected");
      // לא מנתקים את ה-socket - הוא נשאר פעיל לכל האפליקציה
      window.removeEventListener("pending-invitations-updated", handlePendingUpdate);
      clearInterval(interval);
    };
  }, [user?.id, socket]);

  const nav = [
    { to: "/home", label: "בית", icon: <Home size={22} /> },
    { to: "/songs", label: "שירים", icon: <Music size={22} /> },
    { to: "/lineup", label: "ליינאפ", icon: <ListMusic size={22} /> },
    { to: "/artists", label: "אמנים", icon: <UserCheck size={22} />, badge: pendingCount },
    ...(role === "admin" || role === "manager"
      ? [{ to: "/users", label: "משתמשים", icon: <Users size={22} /> }]
      : []),
    { to: "/settings", label: "הגדרות", icon: <Settings size={22} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full py-2 backdrop-blur-xl border-t border-white/10 bg-black/40 shadow-[0_-2px_20px_rgba(0,0,0,0.4)]">
      <div
        className="flex items-center justify-between px-4 
                  w-full max-w-2xl mx-auto"
      >
        {nav.map(({ to, label, icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-center transition-all duration-300 relative
           flex-1 sm:flex-none sm:w-20
           ${
             isActive
               ? "text-brand-orange scale-110"
               : "text-gray-400 hover:text-white"
           }`
            }
          >
            <div className="relative">
              {icon}
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-black">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
