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
import { useTranslation } from "@/hooks/useTranslation.ts";

export default function RouteAnnouncer() {
  const location = useLocation();
  const { t } = useTranslation();
  const [announcement, setAnnouncement] = useState("");

  function getPageName(pathname: string): string {
    const routeNames: Record<string, string> = {
      "/": t("a11y.routeAnnouncer.home"),
      "/login": t("a11y.routeAnnouncer.login"),
      "/register": t("a11y.routeAnnouncer.register"),
      "/settings": t("a11y.routeAnnouncer.settings"),
      "/accessibility": t("a11y.routeAnnouncer.accessibility"),
      "/my/profile": t("a11y.routeAnnouncer.myProfile"),
      "/my/lineups": t("a11y.routeAnnouncer.myLineups"),
      "/admin": t("a11y.routeAnnouncer.admin"),
    };

    if (routeNames[pathname]) return routeNames[pathname];

    if (pathname.startsWith("/artist/"))
      return t("a11y.routeAnnouncer.artistPage");
    if (pathname.startsWith("/my/"))
      return t("a11y.routeAnnouncer.personalArea");
    if (pathname.startsWith("/admin/")) return t("a11y.routeAnnouncer.admin");
    if (pathname.startsWith("/share/")) return t("a11y.routeAnnouncer.sharing");
    if (pathname.startsWith("/invite/"))
      return t("a11y.routeAnnouncer.invitation");
    if (pathname.startsWith("/reset/"))
      return t("a11y.routeAnnouncer.resetPassword");

    return t("a11y.routeAnnouncer.unknownPage");
  }

  useEffect(() => {
    const pageName = getPageName(location.pathname);
    setAnnouncement(`${t("a11y.routeAnnouncer.pageLoaded")}: ${pageName}`);

    // Clear announcement after it's been read
    const timer = setTimeout(() => setAnnouncement(""), 1000);
    return () => clearTimeout(timer);
  }, [location.pathname, t]);

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
