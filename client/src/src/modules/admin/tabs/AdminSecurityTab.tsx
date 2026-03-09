import React, { useEffect, useState } from "react";
import {
  Shield,
  Activity,
  Lock,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  Monitor,
  XCircle,
} from "lucide-react";
import api from "@/modules/shared/lib/api";
import { useToast } from "@/modules/shared/components/ToastProvider";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";
import { useTranslation } from "@/hooks/useTranslation.ts";

type SecurityOverview = {
  stats: {
    totalEvents: number;
    failedLogins: number;
    lockedAccounts: number;
    criticalEvents: number;
    active2FAUsers: number;
    activeSessions: number;
  };
  recentEvents: Array<{
    id: number;
    user_id: number | null;
    event_type: string;
    event_category: string;
    event_action: string;
    ip_address: string | null;
    user_agent: string | null;
    severity: string;
    success: boolean;
    created_at: string;
  }>;
  topFailedLogins: Array<{
    email: string;
    attempts: number;
  }>;
  riskIndicators: {
    bruteForceAttempts: number;
    suspiciousIPs: number;
    unusualHours: number;
  };
};

type ActiveSession = {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  lastUsed: string | null;
};

type LockedAccount = {
  email: string;
  lockedAt: string;
  remainingMinutes: number;
};

type Props = {
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  SmallBadge: React.ComponentType<{
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: "neutral" | "brand" | "success" | "danger";
  }>;
  setDashboardCards?: (cards: DashboardCard[]) => void;
};

export default function AdminSecurityTab({
  CardContainer,
  SmallBadge,
  setDashboardCards,
}: Props) {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [selectedView, setSelectedView] = useState<
    "overview" | "events" | "sessions" | "locked"
  >("overview");
  const { showToast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [overviewRes, sessionsRes, lockedRes] = await Promise.all([
        api.get("/admin/security/overview"),
        api.get("/admin/security/active-sessions"),
        api.get("/admin/security/locked-accounts"),
      ]);

      setOverview(overviewRes.data);
      setActiveSessions(sessionsRes.data);
      setLockedAccounts(lockedRes.data);

      // Update dashboard cards
      if (setDashboardCards && overviewRes.data) {
        const { stats, riskIndicators } = overviewRes.data;
        const totalRisk =
          riskIndicators.bruteForceAttempts +
          riskIndicators.suspiciousIPs +
          riskIndicators.unusualHours;

        setDashboardCards([
          {
            id: "total-events",
            title: t("admin.securityTab.dashboard.totalEvents.title"),
            value: stats.totalEvents.toString(),
            icon: <Activity />,
            variant: "brand",
            description: t(
              "admin.securityTab.dashboard.totalEvents.description",
            ),
          },
          {
            id: "failed-logins",
            title: t("admin.securityTab.dashboard.failedLogins.title"),
            value: stats.failedLogins.toString(),
            icon: <XCircle />,
            variant: stats.failedLogins > 10 ? "danger" : "neutral",
            description: t(
              "admin.securityTab.dashboard.failedLogins.description",
            ),
          },
          {
            id: "2fa-users",
            title: t("admin.securityTab.dashboard.twoFAUsers.title"),
            value: stats.active2FAUsers.toString(),
            icon: <Shield />,
            variant: "success",
            description: t(
              "admin.securityTab.dashboard.twoFAUsers.description",
            ),
          },
          {
            id: "risk-score",
            title: t("admin.securityTab.dashboard.riskIndicators.title"),
            value: totalRisk.toString(),
            icon: <AlertTriangle />,
            variant:
              totalRisk > 5 ? "danger" : totalRisk > 0 ? "neutral" : "success",
            description: t(
              "admin.securityTab.dashboard.riskIndicators.description",
            ),
          },
        ]);
      }
    } catch (error: any) {
      console.error("Failed to load security data:", error);
      showToast(t("admin.securityTab.messages.loadFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: number) => {
    try {
      await api.post(`/admin/security/revoke-session/${sessionId}`);
      showToast(t("admin.securityTab.messages.sessionRevoked"), "success");
      loadSecurityData();
    } catch (error: any) {
      console.error("Failed to revoke session:", error);
      showToast(t("admin.securityTab.messages.revokeFailed"), "error");
    }
  };

  const unlockAccount = async (email: string) => {
    try {
      await api.post("/admin/security/unlock-account", { email });
      showToast(t("admin.securityTab.messages.accountUnlocked"), "success");
      loadSecurityData();
    } catch (error: any) {
      console.error("Failed to unlock account:", error);
      showToast(t("admin.securityTab.messages.unlockFailed"), "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale || "he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  const getSeverityBadge = (severity: string) => {
    const variant =
      severity === "critical"
        ? "danger"
        : severity === "high"
          ? "danger"
          : severity === "medium"
            ? "neutral"
            : "success";
    return variant;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      AUTH: "bg-blue-600",
      ACCESS: "bg-purple-600",
      DATA: "bg-yellow-600",
      ADMIN: "bg-red-600",
      SECURITY: "bg-orange-600",
    };
    return colors[category] || "bg-neutral-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-neutral-400">{t("admin.securityTab.loading")}</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-neutral-400">
          {t("admin.securityTab.loadFailed")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedView("overview")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === "overview"
              ? "bg-brand-primary text-white"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          <Shield className="inline-block w-4 h-4 ml-2" />
          {t("admin.securityTab.views.overview")}
        </button>
        <button
          onClick={() => setSelectedView("events")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === "events"
              ? "bg-brand-primary text-white"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          <Activity className="inline-block w-4 h-4 ml-2" />
          {t("admin.securityTab.views.events")} ({overview.recentEvents.length})
        </button>
        <button
          onClick={() => setSelectedView("sessions")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === "sessions"
              ? "bg-brand-primary text-white"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          <Monitor className="inline-block w-4 h-4 ml-2" />
          {t("admin.securityTab.views.sessions")} ({activeSessions.length})
        </button>
        <button
          onClick={() => setSelectedView("locked")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === "locked"
              ? "bg-brand-primary text-white"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          <Lock className="inline-block w-4 h-4 ml-2" />
          {t("admin.securityTab.views.locked")} ({lockedAccounts.length})
        </button>
      </div>

      {/* Overview View */}
      {selectedView === "overview" && (
        <div className="space-y-6">
          {/* Top Failed Logins */}
          {overview.topFailedLogins.length > 0 && (
            <CardContainer>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-neutral-100 font-semibold">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  {t("admin.securityTab.sections.topFailedLogins")}
                </div>
                <div className="space-y-2">
                  {overview.topFailedLogins.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg"
                    >
                      <span className="text-neutral-300 text-sm">
                        {item.email}
                      </span>
                      <SmallBadge
                        variant={item.attempts > 5 ? "danger" : "neutral"}
                      >
                        {t("admin.securityTab.topFailedLogins.attempts", {
                          count: item.attempts,
                        })}
                      </SmallBadge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContainer>
          )}

          {/* Risk Indicators */}
          <CardContainer>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-neutral-100 font-semibold">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                {t("admin.securityTab.sections.riskIndicators")}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-neutral-900 p-4 rounded-lg">
                  <div className="text-neutral-400 text-xs mb-1">
                    {t("admin.securityTab.riskIndicators.bruteForce")}
                  </div>
                  <div className="text-2xl font-bold text-neutral-100">
                    {overview.riskIndicators.bruteForceAttempts}
                  </div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-lg">
                  <div className="text-neutral-400 text-xs mb-1">
                    {t("admin.securityTab.riskIndicators.suspiciousIPs")}
                  </div>
                  <div className="text-2xl font-bold text-neutral-100">
                    {overview.riskIndicators.suspiciousIPs}
                  </div>
                </div>
                <div className="bg-neutral-900 p-4 rounded-lg">
                  <div className="text-neutral-400 text-xs mb-1">
                    {t("admin.securityTab.riskIndicators.unusualHours")}
                  </div>
                  <div className="text-2xl font-bold text-neutral-100">
                    {overview.riskIndicators.unusualHours}
                  </div>
                </div>
              </div>
            </div>
          </CardContainer>
        </div>
      )}

      {/* Recent Events View */}
      {selectedView === "events" && (
        <div className="space-y-3">
          {overview.recentEvents.map((event) => (
            <CardContainer key={event.id}>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs text-white ${getCategoryBadge(event.event_category)}`}
                    >
                      {event.event_category}
                    </span>
                    <span className="text-neutral-300 text-sm">
                      {event.event_action}
                    </span>
                  </div>
                  <SmallBadge variant={getSeverityBadge(event.severity)}>
                    {event.severity}
                  </SmallBadge>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-400">
                  {event.ip_address && (
                    <span>
                      {t("admin.securityTab.labels.ip")}: {event.ip_address}
                    </span>
                  )}
                  <span>
                    <Clock className="inline w-3 h-3 ml-1" />
                    {formatDate(event.created_at)}
                  </span>
                  {event.user_id && (
                    <span>
                      {t("admin.securityTab.labels.userId")}: {event.user_id}
                    </span>
                  )}
                </div>
              </div>
            </CardContainer>
          ))}
        </div>
      )}

      {/* Active Sessions View */}
      {selectedView === "sessions" && (
        <div className="space-y-3">
          {activeSessions.map((session) => (
            <CardContainer key={session.id}>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-neutral-100 font-semibold">
                      {session.userName}
                    </div>
                    <div className="text-neutral-400 text-sm">
                      {session.userEmail}
                    </div>
                  </div>
                  <button
                    onClick={() => revokeSession(session.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    {t("admin.securityTab.sessions.actions.revoke")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
                  {session.ipAddress && (
                    <span>
                      {t("admin.securityTab.labels.ip")}: {session.ipAddress}
                    </span>
                  )}
                  <span>
                    {t("admin.securityTab.sessions.labels.created")}:{" "}
                    {formatDate(session.createdAt)}
                  </span>
                  <span>
                    {t("admin.securityTab.sessions.labels.expires")}:{" "}
                    {formatDate(session.expiresAt)}
                  </span>
                  {session.lastUsed && (
                    <span>
                      {t("admin.securityTab.sessions.labels.lastUsed")}:{" "}
                      {formatDate(session.lastUsed)}
                    </span>
                  )}
                </div>
              </div>
            </CardContainer>
          ))}
          {activeSessions.length === 0 && (
            <div className="text-center text-neutral-400 py-10">
              {t("admin.securityTab.sessions.empty")}
            </div>
          )}
        </div>
      )}

      {/* Locked Accounts View */}
      {selectedView === "locked" && (
        <div className="space-y-3">
          {lockedAccounts.map((account, idx) => (
            <CardContainer key={idx}>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-neutral-100 font-semibold">
                      {account.email}
                    </div>
                    <div className="text-neutral-400 text-sm">
                      {t("admin.securityTab.locked.labels.lockedAt")}:{" "}
                      {formatDate(account.lockedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => unlockAccount(account.email)}
                    className="px-3 py-1 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm rounded-lg transition-colors"
                  >
                    {t("admin.securityTab.locked.actions.unlock")}
                  </button>
                </div>
                <SmallBadge variant="danger">
                  <Clock className="w-3 h-3" />
                  {t("admin.securityTab.locked.labels.remainingMinutes", {
                    minutes: account.remainingMinutes,
                  })}
                </SmallBadge>
              </div>
            </CardContainer>
          ))}
          {lockedAccounts.length === 0 && (
            <div className="text-center text-neutral-400 py-10">
              {t("admin.securityTab.locked.empty")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
