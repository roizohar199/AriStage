import React from "react";
import { NavLink } from "react-router-dom";

// Pure presentational footer: small, non-intrusive, dark-theme friendly.
export default function Footer(): JSX.Element {
  return (
    <div className="w-full h-16 bg-neutral-800 border-t border-neutral-700 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-6 text-sm">
        <NavLink to="/about" className="text-neutral-300 hover:text-white">
          אודות
        </NavLink>
        <NavLink to="/support" className="text-neutral-300 hover:text-white">
          תמיכה
        </NavLink>
        <NavLink to="/terms" className="text-neutral-300 hover:text-white">
          תנאים
        </NavLink>
        <NavLink to="/privacy" className="text-neutral-300 hover:text-white">
          פרטיות
        </NavLink>
      </nav>
    </div>
  );
}
