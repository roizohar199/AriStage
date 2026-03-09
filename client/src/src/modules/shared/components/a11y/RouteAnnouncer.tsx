/**
 * RouteAnnouncer Component
 *
 * Israeli Standard ת״י 5568 / WCAG 2.0 AA Compliant
 *
 * Announces route changes to screen readers using ARIA live regions
 * Improves navigation experience for visually impaired users
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Map routes to Hebrew page names
const routeNames: Record<string, string> = {
  "/": "דף הבית",
  "/login": "התחברות",
  "/register": "הרשמה",
  "/settings": "הגדרות",
  "/accessibility": "הצהרת נגישות",
  "/my/profile": "הפרופיל שלי",
  "/my/lineups": "הלהקות שלי",
  "/admin": "ניהול מערכת",
};

function getPageName(pathname: string): string {
  // Check exact match first
  if (routeNames[pathname]) {
    return routeNames[pathname];
  }

  // Check partial matches
  if (pathname.startsWith("/artist/")) return "עמוד אמן";
  if (pathname.startsWith("/my/")) return "האזור האישי";
  if (pathname.startsWith("/admin/")) return "ניהול מערכת";
  if (pathname.startsWith("/share/")) return "שיתוף";
  if (pathname.startsWith("/invite/")) return "הזמנה";
  if (pathname.startsWith("/reset/")) return "איפוס סיסמה";

  return "עמוד חדש";
}

export default function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const pageName = getPageName(location.pathname);
    setAnnouncement(`עמוד נטען: ${pageName}`);

    // Clear announcement after it's been read
    const timer = setTimeout(() => setAnnouncement(""), 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
