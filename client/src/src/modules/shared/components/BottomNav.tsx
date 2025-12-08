import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Music, Users, Settings, ListMusic } from "lucide-react";

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

  const nav = [
    { to: "/home", label: "בית", icon: <Home size={22} /> },
    { to: "/songs", label: "שירים", icon: <Music size={22} /> },
    { to: "/lineup", label: "ליינאפ", icon: <ListMusic size={22} /> },
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
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-center transition-all duration-300
           flex-1 sm:flex-none sm:w-20
           ${
             isActive
               ? "text-brand-orange scale-110"
               : "text-gray-400 hover:text-white"
           }`
            }
          >
            {icon}
            <span className="text-[11px] mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
