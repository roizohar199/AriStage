import React from "react";
import { NavLink } from "react-router-dom";
import { getNavItems } from "@/modules/shared/components/navConfig.tsx";
import { usePendingInvitations } from "@/modules/shared/hooks/usePendingInvitations.ts";
import { useCurrentUser } from "@/modules/shared/hooks/useCurrentUser.ts";

interface HeaderProps {
  rightActions?: React.ReactNode;
}

// Pure presentational header: title/logo on the left, optional actions on the right.
export default function Header({ rightActions }: HeaderProps): JSX.Element {
  const { user } = useCurrentUser();
  const role = user?.role || "user";
  const pendingCount = usePendingInvitations(user?.id);
  const nav = getNavItems(role, pendingCount);

  const initials = (user?.full_name || user?.email || "A")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="fixed top-0 left-0 right-0 z-40 w-full h-16 bg-neutral-800 border-b border-neutral-700">
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
                    : "border-transparent text-neutral-300 hover:text-white hover:border-brand-orange/50"
                }`
              }
            >
              <span className="opacity-90">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: User avatar */}
        <div className="md:justify-self-end flex items-center gap-3">
          {rightActions}
          <NavLink
            to="/settings"
            className="h-8 w-8 rounded-full overflow-hidden border border-neutral-600 flex items-center justify-center text-white text-sm"
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
          </NavLink>
        </div>
      </div>
    </div>
  );
}
