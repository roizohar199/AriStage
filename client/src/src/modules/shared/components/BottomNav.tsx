import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  getNavItems,
  getStoredUser,
} from "@/modules/shared/components/navConfig.tsx";
import { usePendingInvitations } from "@/modules/shared/hooks/usePendingInvitations.ts";

// שמרנו alias לשם הישן כדי למנוע ReferenceError אם קובץ חם שמור במטמון
const getUser = getStoredUser;

export default function BottomNav() {
  const user = getUser();
  const role = user?.role || "user";
  const pendingCount = usePendingInvitations(user?.id);

  const nav = useMemo(
    () => getNavItems(role, pendingCount),
    [role, pendingCount]
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-neutral-800/80 backdrop-blur-md md:hidden">
      <div className="h-full flex items-center justify-between px-4 w-full">
        {nav.map(({ to, label, icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-center relative flex-1
           ${
             isActive
               ? "text-brand-orange font-semibold"
               : "text-neutral-300 font-semibold hover:text-white"
           }`
            }
          >
            <div className="relative">
              {icon}
              {badge && badge > 0 && (
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
