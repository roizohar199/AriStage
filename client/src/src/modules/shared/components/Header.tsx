import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { getNavItems } from "@/modules/shared/components/navConfig.tsx";
import { usePendingInvitations } from "@/modules/shared/hooks/usePendingInvitations.ts";
import { useCurrentUser } from "@/modules/shared/hooks/useCurrentUser.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

interface HeaderProps {
  rightActions?: React.ReactNode;
}

// Pure presentational header: title/logo on the left, optional actions on the right.
export default function Header({ rightActions }: HeaderProps): JSX.Element {
  const { user } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = user?.role || "user";
  const pendingCount = usePendingInvitations(user?.id);
  const nav = getNavItems(role, pendingCount);

  const initials = (user?.full_name || user?.email || "A")
    .slice(0, 1)
    .toUpperCase();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const handleSettings = () => {
    navigate("/settings");
    setMenuOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 w-full h-16 bg-neutral-800/80 backdrop-blur-md">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between md:grid md:grid-cols-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-neutral-700 border border-neutral-600" />
          <span className="text-sm sm:text-base font-semibold tracking-wide text-white">
            AriStage
          </span>
        </div>

        {/* Center: Nav */}
        <nav className="justify-self-center hidden md:flex items-center gap-4">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm px-2 py-1  ${
                  isActive
                    ? "border-brand-orange text-brand-orange font-semibold"
                    : "border-transparent text-neutral-300 hover:text-white font-semibold hover:border-brand-orange/50"
                }`
              }
            >
              <span className="opacity-90">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: User avatar with dropdown */}
        <div className="md:justify-self-end flex items-center gap-3 relative">
          {rightActions}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 w-8 rounded-full overflow-hidden border border-brand-orange flex items-center justify-center text-white text-sm"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="h-full w-full flex items-center justify-center bg-neutral-700">
                  {initials}
                </span>
              )}
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute left-0 top-10 bg-neutral-800 rounded-2xl shadow-lg z-50 min-w-max">
                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:text-brand-orange"
                >
                  <Settings size={16} />
                  הגדרות מערכת
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:text-brand-orange border-t border-neutral-700"
                >
                  <LogOut size={16} />
                  התנתק
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
