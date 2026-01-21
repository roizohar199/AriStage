import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Users } from "lucide-react";

import api from "@/modules/shared/lib/api.ts";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";

type MonitoringCard = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

export default function AdminMonitoringTab({
  setDashboardCards,
}: {
  setDashboardCards?: (cards: DashboardCard[]) => void;
}) {
  const [monitoring, setMonitoring] = useState<any>(null);
  const [monitoringLoading, setMonitoringLoading] = useState(true);

  const loadMonitoring = useCallback(async () => {
    try {
      setMonitoringLoading(true);
      const { data } = await api.get("/dashboard-stats", {
        skipErrorToast: true,
      } as any);
      setMonitoring(data || null);
    } catch (err) {
      console.error("Admin loadMonitoring failed", err);
      setMonitoring(null);
    } finally {
      setMonitoringLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoring();
  }, [loadMonitoring]);

  const monitoringCards: MonitoringCard[] = useMemo(() => {
    const activeUsers =
      monitoring?.activeUsers ?? monitoring?.active_users ?? "TODO";
    const cpu = monitoring?.cpu ?? monitoring?.cpu_percent ?? "TODO";
    const memory = monitoring?.memory ?? monitoring?.memory_used ?? "TODO";

    return [
      {
        label: "CPU",
        value: typeof cpu === "number" ? `${cpu}%` : String(cpu),
        icon: <Activity size={32} />,
      },
      { label: "Memory", value: String(memory), icon: <Activity size={32} /> },
      {
        label: "Active Users",
        value: String(activeUsers),
        icon: <Users size={32} />,
      },
    ];
  }, [monitoring]);

  useEffect(() => {
    const cards: DashboardCard[] = monitoringCards.map((c) => ({
      icon: c.icon,
      value: c.value,
      label: c.label,
    }));
    setDashboardCards?.(cards);
  }, [monitoringCards, setDashboardCards]);

  return (
    <div className="space-y-3">
      {monitoringLoading && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען ניטור...
        </div>
      )}

      <div className="bg-neutral-800 rounded-2xl p-6 text-center">
        <p className="text-neutral-500 text-xs">GET /dashboard-stats (light)</p>
      </div>
    </div>
  );
}
