import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, ListChecks, Plus, ToggleLeft, ToggleRight } from "lucide-react";

import api from "@/modules/shared/lib/api.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { useToast } from "@/modules/shared/components/ToastProvider";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";
import { Input } from "@/modules/shared/components/FormControls";

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

type FeatureFlagRow = {
  key: string;
  description?: string | null;
  enabled?: boolean | number | null;
};

type ModuleRow = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  source: "default" | "db";
};

const DEFAULT_MODULES: Array<{
  key: string;
  label: string;
  description: string;
}> = [
  {
    key: "module.charts",
    label: "צ'ארטים",
    description: "ניהול צ'ארטים וקבצי תווים",
  },
  { key: "module.lyrics", label: "מילים", description: "ניהול מילים לשירים" },
  {
    key: "module.addSongs",
    label: "הוספת שירים",
    description: "יצירה/עריכה/מחיקה של שירים",
  },
  {
    key: "module.lineups",
    label: "ליינאפים",
    description: "ניהול ליינאפים ושירים בליינאפ",
  },
  {
    key: "module.plans",
    label: "מסלולים",
    description: "ניהול מסלולים / תוכניות תמחור",
  },
  {
    key: "module.pendingInvitations",
    label: "הזמנות ממתינות",
    description: "צפייה והחלטה על הזמנות ממתינות",
  },
  {
    key: "module.inviteArtist",
    label: "הזמנת אמן - אישי",
    description: "שליחת/ביטול הזמנה לאמן",
  },
  {
    key: "module.invitedMeArtists",
    label: "אמנים שהזמינו אותי - משותפים",
    description: "הצגת המאגר: מי הזמין אותי",
  },
  {
    key: "module.payments",
    label: "תשלומים",
    description: "יצירת תשלום ואישור תשלום להפעלת מנוי",
  },
  {
    key: "module.shareLineup",
    label: "שיתוף ליינאפ",
    description: "שיתוף וצפייה בליינאפ ציבורי באמצעות קישור",
  },
];

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  return Boolean(v);
}

type Props = {
  searchValue: string;
  setSearchValue: (value: string) => void;
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  SmallBadge: React.ComponentType<{
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: SmallBadgeVariant;
  }>;
  setDashboardCards?: (cards: DashboardCard[]) => void;
};

export default function AdminModelsTab({
  searchValue,
  setSearchValue,
  CardContainer,
  SmallBadge,
  setDashboardCards,
}: Props) {
  const { showToast } = useToast();

  const [rows, setRows] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsupported, setUnsupported] = useState(false);

  const [adding, setAdding] = useState(false);
  const [createForm, setCreateForm] = useState({
    key: "module.",
    label: "",
    description: "",
    enabled: true,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setUnsupported(false);
      const { data } = await api.get("/feature-flags", {
        skipErrorToast: true,
      } as any);
      setRows(Array.isArray(data) ? (data as FeatureFlagRow[]) : []);
    } catch (err: any) {
      if (err?.response?.status === 404) setUnsupported(true);
      console.error("AdminModelsTab load failed", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const modules: ModuleRow[] = useMemo(() => {
    const defaultsByKey = new Map(DEFAULT_MODULES.map((m) => [m.key, m]));

    const dbModules = rows
      .filter((r) => String(r.key || "").startsWith("module."))
      .map((r) => {
        const def = defaultsByKey.get(String(r.key));
        const dbLabel = (r.description || "").toString().trim();
        return {
          key: String(r.key),
          label: def?.label || dbLabel || String(r.key),
          description: def?.description || dbLabel || "",
          enabled: toBool(r.enabled),
          source: "db" as const,
        };
      });

    const seen = new Set(dbModules.map((m) => m.key));
    const missingDefaults = DEFAULT_MODULES.filter((m) => !seen.has(m.key)).map(
      (m) => ({
        key: m.key,
        label: m.label,
        description: m.description,
        enabled: true,
        source: "default" as const,
      }),
    );

    return [...dbModules, ...missingDefaults].sort((a, b) =>
      a.key.localeCompare(b.key),
    );
  }, [rows]);

  const filteredModules = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) =>
      `${m.key} ${m.label} ${m.description}`.toLowerCase().includes(q),
    );
  }, [modules, searchValue]);

  const upsertFlag = useCallback(
    async (key: string, enabled: boolean, description?: string) => {
      try {
        await api.put(`/feature-flags/${encodeURIComponent(key)}`, {
          enabled,
          description: description?.trim() || undefined,
        });
        await load();
      } catch (err: any) {
        const msg =
          err?.response?.data?.message || "שגיאה בעדכון (feature flag)";
        showToast(msg, "error");
      }
    },
    [load, showToast],
  );

  const create = async () => {
    const key = createForm.key.trim();
    if (!key || !key.startsWith("module.")) {
      showToast('Key חייב להתחיל ב-"module."', "error");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
      showToast("Key לא חוקי (רק אותיות/ספרות/._-)", "error");
      return;
    }
    const label = createForm.label.trim();
    const desc = createForm.description.trim();
    const effectiveDesc = desc || label;
    if (!effectiveDesc) {
      showToast("יש למלא לפחות Label או Description", "error");
      return;
    }

    setAdding(true);
    try {
      await upsertFlag(key, !!createForm.enabled, effectiveDesc);
      setCreateForm({
        key: "module.",
        label: "",
        description: "",
        enabled: true,
      });
      showToast("מודול נוסף", "success");
    } finally {
      setAdding(false);
    }
  };

  const dashboard = useMemo(() => {
    const flagsTotal = rows.length;
    const modulesTotal = modules.length;
    const enabledModules = modules.filter((m) => m.enabled).length;
    const disabledModules = modulesTotal - enabledModules;
    return { flagsTotal, modulesTotal, enabledModules, disabledModules };
  }, [rows.length, modules]);

  useEffect(() => {
    setDashboardCards?.([
      {
        icon: <ListChecks size={32} />,
        value: dashboard.flagsTotal,
        label: "Feature Flags",
      },
      {
        icon: <Boxes size={32} />,
        value: dashboard.modulesTotal,
        label: "Modules",
      },
      {
        icon: <ToggleRight size={32} />,
        value: dashboard.enabledModules,
        label: "Enabled",
      },
      {
        icon: <ToggleLeft size={32} />,
        value: dashboard.disabledModules,
        label: "Disabled",
      },
    ]);
  }, [
    setDashboardCards,
    dashboard.disabledModules,
    dashboard.enabledModules,
    dashboard.flagsTotal,
    dashboard.modulesTotal,
  ]);

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="text-neutral-100 font-bold">מודלים (Modules)</div>
            <div className="text-xs text-neutral-400">
              הפעלה/כיבוי מודולים דרך Feature Flags (`module.*`)
            </div>
          </div>
          <DesignActionButton type="button" onClick={load}>
            רענן
          </DesignActionButton>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <Input
              label="Key"
              value={createForm.key}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, key: e.target.value }))
              }
              placeholder="module.myFeature"
              className="mb-0"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Input
              label="Label"
              value={createForm.label}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, label: e.target.value }))
              }
              placeholder="לדוגמה: הוספת שירים"
              className="mb-0"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Input
              label="Description"
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="תיאור (אופציונלי) — אם ריק נשתמש ב-Label"
              className="mb-0"
            />
          </div>

          <div className="flex items-center justify-between md:col-span-4">
            <label className="flex items-center gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={createForm.enabled}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, enabled: e.target.checked }))
                }
                className="accent-brand-primary"
              />
              enabled
            </label>

            <DesignActionButton
              type="button"
              onClick={create}
              disabled={adding}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                {adding ? "מוסיף..." : "הוסף מודול"}
              </span>
            </DesignActionButton>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען מודלים...
        </div>
      ) : unsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <p className="text-neutral-400 text-sm">Endpoint לא זמין</p>
          <p className="text-neutral-500 text-xs mt-1">GET /feature-flags</p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <p className="text-neutral-400 text-sm">אין מודלים להצגה</p>
          {searchValue.trim() ? (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="text-xs text-neutral-400 hover:text-neutral-200 mt-2"
            >
              נקה חיפוש
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredModules.map((m) => (
            <CardContainer key={m.key}>
              <div className="flex-1 min-w-0 text-start">
                <h3 className="text-lg font-bold text-neutral-100 mb-1">
                  {m.label}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <SmallBadge variant="neutral">{m.key}</SmallBadge>
                  {m.source === "default" ? (
                    <SmallBadge variant="brand">default</SmallBadge>
                  ) : (
                    <SmallBadge variant="success">db</SmallBadge>
                  )}
                </div>
                {m.description ? (
                  <p className="text-sm text-neutral-300 mt-2">
                    {m.description}
                  </p>
                ) : null}
              </div>

              <div className="flex gap-6 flex-row-reverse items-center">
                <button
                  onClick={() => upsertFlag(m.key, !m.enabled, m.description)}
                  className="w-6 h-6"
                  title="toggle"
                  type="button"
                >
                  {m.enabled ? (
                    <ToggleRight
                      size={22}
                      className="text-green-600 hover:text-green-500"
                    />
                  ) : (
                    <ToggleLeft
                      size={22}
                      className="text-red-600 hover:text-red-500"
                    />
                  )}
                </button>
              </div>
            </CardContainer>
          ))}
        </div>
      )}
    </div>
  );
}
