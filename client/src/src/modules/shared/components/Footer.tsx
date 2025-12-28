import { NavLink } from "react-router-dom";

// Pure presentational footer: small, non-intrusive, dark-theme friendly.
export default function Footer() {
  return (
    <footer className="w-full bg-neutral-900 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center gap-3 py-4">
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

        <span className="text-neutral-500 text-sm text-center">
          © {new Date().getFullYear()} Ari Stage. כל הזכויות שמורות.
        </span>
      </div>
    </footer>
  );
}
