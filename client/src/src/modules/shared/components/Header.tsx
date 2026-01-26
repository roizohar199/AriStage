import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  CheckIcon,
  HardDrive,
  LogOut,
  Mic,
  MinusIcon,
  Music,
  Music2,
  Music2Icon,
  MusicIcon,
  PlayCircle,
  PlayIcon,
  Settings,
  Trash2,
  Upload,
  User,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { getNavItems } from "@/modules/shared/components/navConfig.tsx";
import BaseModal from "@/modules/shared/components/BaseModal.tsx";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { usePendingInvitations } from "@/modules/shared/hooks/usePendingInvitations.ts";
import { useCurrentUser } from "@/modules/shared/hooks/useCurrentUser.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import api from "@/modules/shared/lib/api.js";
import AcceptInvitation from "../../auth/pages/AcceptInvitation";
import { useOfflineStatus } from "@/modules/shared/hooks/useOfflineStatus";

interface HeaderProps {
  rightActions?: React.ReactNode;
}

interface PendingInvitation {
  id: number;
  full_name?: string | null;
  avatar?: string | null;
  artist_role?: string | null;
}

// Pure presentational header: title/logo on the left, optional actions on the right.
export default function Header({ rightActions }: HeaderProps): JSX.Element {
  const { user } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isEffectiveOffline, isForcedOffline, toggleForcedOffline } =
    useOfflineStatus();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [displayPendingCount, setDisplayPendingCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const [offlineCacheModalOpen, setOfflineCacheModalOpen] = useState(false);
  const [offlineCacheLoading, setOfflineCacheLoading] = useState(false);
  const [offlineCacheEntries, setOfflineCacheEntries] = useState<
    Array<{ cacheName: string; url: string }>
  >([]);

  const role = user?.role || "user";
  const pendingCount = usePendingInvitations(user?.id);
  const nav = getNavItems(role, pendingCount);

  const initials = (user?.full_name || user?.email || "A")
    .slice(0, 1)
    .toUpperCase();

  const loadPendingInvitations = useCallback(async () => {
    if (!user?.id) {
      setPendingInvitations([]);
      return;
    }

    setPendingLoading(true);
    try {
      const { data } = await api.get("/users/pending-invitation", {
        skipErrorToast: true,
      });
      setPendingInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      setPendingInvitations([]);
    } finally {
      setPendingLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setDisplayPendingCount(pendingCount || 0);
  }, [pendingCount]);

  useEffect(() => {
    if (pendingModalOpen || (pendingCount && pendingCount > 0)) {
      loadPendingInvitations();
    }
  }, [pendingModalOpen, pendingCount, loadPendingInvitations]);

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

  const handleInvitationHandled = (hostId: number) => {
    setPendingInvitations((prev) => {
      const updated = prev.filter((inv) => inv.id !== hostId);
      if (updated.length === 0) {
        setPendingModalOpen(false);
      }
      return updated;
    });
    setDisplayPendingCount((prev) => Math.max(prev - 1, 0));
    window.dispatchEvent(new CustomEvent("pending-invitations-updated"));
  };

  const handleAcceptInvitation = async (hostId: number) => {
    try {
      setProcessingId(hostId);
      await api.post("/users/accept-invitation", { hostId });
      showToast("הזמנה אושרה", "success");
      handleInvitationHandled(hostId);
    } catch (error: any) {
      const message = error?.response?.data?.message || "שגיאה באישור ההזמנה";
      showToast(message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectInvitation = async (hostId: number) => {
    try {
      setProcessingId(hostId);
      await api.post("/users/reject-invitation", { hostId });
      showToast("הזמנה נדחתה", "success");
      handleInvitationHandled(hostId);
    } catch (error: any) {
      const message = error?.response?.data?.message || "שגיאה בדחיית ההזמנה";
      showToast(message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const loadOfflineCacheEntries = useCallback(async () => {
    if (typeof window === "undefined" || !("caches" in window)) {
      setOfflineCacheEntries([]);
      return;
    }

    setOfflineCacheLoading(true);
    try {
      const cacheNames = await caches.keys();
      const rows: Array<{ cacheName: string; url: string }> = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        for (const req of requests) {
          rows.push({ cacheName, url: req.url });
        }
      }

      rows.sort((a, b) =>
        a.cacheName === b.cacheName
          ? a.url.localeCompare(b.url)
          : a.cacheName.localeCompare(b.cacheName),
      );
      setOfflineCacheEntries(rows);
    } catch {
      setOfflineCacheEntries([]);
    } finally {
      setOfflineCacheLoading(false);
    }
  }, []);

  useEffect(() => {
    if (offlineCacheModalOpen) {
      loadOfflineCacheEntries();
    }
  }, [offlineCacheModalOpen, loadOfflineCacheEntries]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] w-full h-16  bg-neutral-100/10 backdrop-blur-xl">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between md:grid md:grid-cols-3 shadow-surface">
        {/* Left: Logo */}
        <div className="flex items-center gap-0  ">
          <h1 className="h-page text-neutral-100 font-bold">AriStage</h1>
          <Music2Icon size={24} className="text-brand-primary" />
        </div>

        {/* Center: Nav */}
        <nav className="justify-self-center hidden md:flex items-center gap-4 ">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm px-2 py-1 transition ${
                  isActive
                    ? "h-section text-neutral-100 font-bold hover:bg-neutral-900 rounded-2xl"
                    : "h-section text-neutral-300 hover:bg-neutral-900 rounded-2xl"
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

          <button
            type="button"
            onClick={() => {
              toggleForcedOffline();
              const next = !isForcedOffline;
              showToast(
                next ? "עברת למצב Offline (ללא רשת)" : "חזרת למצב Online",
                "info",
              );
            }}
            className={`h-8 px-3 rounded-full text-label font-semibold flex items-center gap-2 transition \
              ${
                isEffectiveOffline
                  ? "text-red-600 hover:bg-neutral-900"
                  : "text-brand-primary hover:bg-neutral-900"
              }`}
            title={
              isForcedOffline
                ? "מצב Offline כפוי פעיל"
                : isEffectiveOffline
                  ? "אין חיבור אינטרנט"
                  : "Online"
            }
          >
            {isEffectiveOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {isEffectiveOffline ? "Offline" : "Online"}
          </button>

          <div ref={menuRef} className="relative">
            <div className="relative">
              {displayPendingCount > 0 && (
                <span className="absolute -top-[6px] -right-[6px] z-10 bg-red-500 text-neutral-100 text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border border-neutral-900">
                  {displayPendingCount > 99
                    ? "99+"
                    : displayPendingCount > 9
                      ? "9+"
                      : displayPendingCount}
                </span>
              )}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center text-neutral-100 text-sm shadow-surface"
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
            </div>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                // Semantic animation: dropdowns use `animation-overlay`
                className="absolute top-10 header-user-dropdown bg-neutral-950 rounded-2xl shadow-floating z-[210] min-w-max animation-overlay"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setOfflineCacheModalOpen(true);
                  }}
                  // Semantic animation: buttons use `animation-press`
                  className="w-full flex items-center gap-2 px-4 py-2 text-label text-neutral-100 rounded-2xl hover:bg-neutral-900 transition"
                >
                  <HardDrive size={16} />
                  תוכן Offline
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setPendingModalOpen(true);
                  }}
                  // Semantic animation: buttons use `animation-press`
                  className="w-full flex items-center gap-2 px-4 py-2 text-label text-neutral-100 rounded-2xl hover:bg-neutral-900 transition"
                >
                  <User size={16} />
                  הזמנות ממתינות
                </button>
                <button
                  onClick={handleSettings}
                  // Semantic animation: buttons use `animation-press`
                  className="w-full flex items-center gap-2 px-4 py-2 text-label text-neutral-100 rounded-2xl hover:bg-neutral-900 transition"
                >
                  <Settings size={16} />
                  הגדרות מערכת
                </button>
                <button
                  onClick={handleLogout}
                  // Semantic animation: buttons use `animation-press`
                  className="w-full flex items-center gap-2 px-4 py-2 text-label text-neutral-100 rounded-2xl hover:bg-neutral-900 transition"
                >
                  <LogOut size={16} />
                  התנתק
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <BaseModal
        open={offlineCacheModalOpen}
        onClose={() => setOfflineCacheModalOpen(false)}
        title="תוכן זמין במצב Offline"
        maxWidth="max-w-3xl"
      >
        <div className="w-full">
          <div className="text-sm text-neutral-300 mb-4">
            מוצגים כאן כל הקבצים/כתובות שכבר נשמרו בקאש בדפדפן. מה שלא ביקרו
            בו/נטען עדיין — לא יופיע כאן.
          </div>

          {offlineCacheLoading ? (
            <div className="text-neutral-300 text-sm">טוען…</div>
          ) : offlineCacheEntries.length === 0 ? (
            <div className="text-neutral-300 text-sm">
              אין תוכן מקאש כרגע. טען כמה דפים/נתונים במצב Online ואז נסה שוב.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto border border-neutral-700 rounded-xl">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-neutral-900">
                  <tr>
                    <th className="text-start px-3 py-2 text-neutral-300 font-semibold">
                      Cache
                    </th>
                    <th className="text-start px-3 py-2 text-neutral-300 font-semibold">
                      URL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {offlineCacheEntries.map((row, idx) => (
                    <tr
                      key={`${row.cacheName}:${row.url}:${idx}`}
                      className="border-t border-neutral-800"
                    >
                      <td className="px-3 py-2 text-neutral-200 whitespace-nowrap">
                        {row.cacheName}
                      </td>
                      <td className="px-3 py-2 text-neutral-200 break-all">
                        {row.url}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => loadOfflineCacheEntries()}
              className="px-4 py-2 rounded-xl bg-neutral-700/60 hover:bg-neutral-700 text-neutral-100 text-sm font-semibold"
            >
              רענן
            </button>
            <button
              type="button"
              onClick={() => {
                showToast(
                  "כדי להוסיף עוד תוכן ל-Offline: תטייל באתר במצב Online פעם אחת",
                  "info",
                );
              }}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700/70 text-neutral-100 text-sm font-semibold"
            >
              איך למלא קאש?
            </button>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        open={pendingModalOpen}
        onClose={() => setPendingModalOpen(false)}
        title="הזמנות ממתינות"
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col items-center text-center w-full">
          <h2 className="text-xl font-bold text-brand-primary mb-2">
            הזמנות ממתינות
          </h2>
          <p className="text-neutral-400 text-sm mb-4">
            בחר הזמנה לאישור או דחייה
          </p>

          <div className="w-full max-w-xl space-y-3 max-h-[60vh] overflow-y-auto mx-auto">
            {pendingLoading ? (
              <div className="text-neutral-400 text-sm">טוען הזמנות...</div>
            ) : pendingInvitations.length === 0 ? (
              <div className="text-neutral-400 text-sm">אין הזמנות ממתינות</div>
            ) : (
              pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-neutral-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-start">
                      <div className="h-24 w-24 rounded-full bg-neutral-800 border-2 border-brand-primary overflow-hidden flex items-center justify-center">
                        {invitation.avatar ? (
                          <img
                            src={invitation.avatar}
                            alt={invitation.full_name || "Avatar"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={20} className="text-neutral-400" />
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-semibold text-neutral-100">
                          {invitation.full_name || "משתמש"}
                        </span>
                        {invitation.artist_role && (
                          <span className="inline-flex items-center px-1 bg-brand-primary rounded-lg text-neutral-100 font-semibold text-xs">
                            {invitation.artist_role}
                          </span>
                        )}
                        <span className="text-xs text-neutral-300">
                          מזמין אותך להצטרף למאגר שלו
                        </span>
                      </div>
                    </div>

                    <div className="flex m-4 gap-6 items-center">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="w-6 h-6 text-neutral-100 hover:text-brand-primary"
                      >
                        <Check size={25} />
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="w-6 h-6 text-neutral-100 hover:text-brand-primary"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
