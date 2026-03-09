import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, ListChecks, Plus, ToggleLeft, ToggleRight } from "lucide-react";

import api from "@/modules/shared/lib/api.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { useToast } from "@/modules/shared/components/ToastProvider";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";
import { Input } from "@/modules/shared/components/FormControls";
import { useTranslation } from "@/hooks/useTranslation.ts";

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
  labelKey: string;
  descriptionKey: string;
}> = [
  {
    key: "module.offlineOnline",
    labelKey: "admin.modelsTab.modules.offlineOnline.label",
    descriptionKey: "admin.modelsTab.modules.offlineOnline.description",
  },
  {
    key: "module.charts",
    labelKey: "admin.modelsTab.modules.charts.label",
    descriptionKey: "admin.modelsTab.modules.charts.description",
  },
  {
    key: "module.lyrics",
    labelKey: "admin.modelsTab.modules.lyrics.label",
    descriptionKey: "admin.modelsTab.modules.lyrics.description",
  },
  {
    key: "module.addSongs",
    labelKey: "admin.modelsTab.modules.addSongs.label",
    descriptionKey: "admin.modelsTab.modules.addSongs.description",
  },
  {
    key: "module.lineups",
    labelKey: "admin.modelsTab.modules.lineups.label",
    descriptionKey: "admin.modelsTab.modules.lineups.description",
  },
  {
    key: "module.plans",
    labelKey: "admin.modelsTab.modules.plans.label",
    descriptionKey: "admin.modelsTab.modules.plans.description",
  },
  {
    key: "module.pendingInvitations",
    labelKey: "admin.modelsTab.modules.pendingInvitations.label",
    descriptionKey: "admin.modelsTab.modules.pendingInvitations.description",
  },
  {
    key: "module.inviteArtist",
    labelKey: "admin.modelsTab.modules.inviteArtist.label",
    descriptionKey: "admin.modelsTab.modules.inviteArtist.description",
  },
  {
    key: "module.invitedMeArtists",
    labelKey: "admin.modelsTab.modules.invitedMeArtists.label",
    descriptionKey: "admin.modelsTab.modules.invitedMeArtists.description",
  },
  {
    key: "module.payments",
    labelKey: "admin.modelsTab.modules.payments.label",
    descriptionKey: "admin.modelsTab.modules.payments.description",
  },
  {
    key: "module.shareLineup",
    labelKey: "admin.modelsTab.modules.shareLineup.label",
    descriptionKey: "admin.modelsTab.modules.shareLineup.description",
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
  const { t } = useTranslation();

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
          label: def ? t(def.labelKey) : dbLabel || String(r.key),
          description: def ? t(def.descriptionKey) : dbLabel || "",
          enabled: toBool(r.enabled),
          source: "db" as const,
        };
      });

    const seen = new Set(dbModules.map((m) => m.key));
    const missingDefaults = DEFAULT_MODULES.filter((m) => !seen.has(m.key)).map(
      (m) => ({
        key: m.key,
        label: t(m.labelKey),
        description: t(m.descriptionKey),
        enabled: true,
        source: "default" as const,
      }),
    );

    return [...dbModules, ...missingDefaults].sort((a, b) =>
      a.key.localeCompare(b.key),
    );
  }, [rows, t]);

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
          err?.response?.data?.message ||
          t("admin.modelsTab.messages.updateError");
        showToast(msg, "error");
      }
    },
    [load, showToast, t],
  );

  const create = async () => {
    const key = createForm.key.trim();
    if (!key || !key.startsWith("module.")) {
      showToast(t("admin.modelsTab.messages.keyMustStartWithModule"), "error");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
      showToast(t("admin.modelsTab.messages.invalidKey"), "error");
      return;
    }
    const label = createForm.label.trim();
    const desc = createForm.description.trim();
    const effectiveDesc = desc || label;
    if (!effectiveDesc) {
      showToast(t("admin.modelsTab.messages.fillLabelOrDescription"), "error");
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
      showToast(t("admin.modelsTab.messages.moduleAdded"), "success");
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
        label: t("admin.featureFlags"),
      },
      {
        icon: <Boxes size={32} />,
        value: dashboard.modulesTotal,
        label: t("admin.modelsTab.dashboard.modules"),
      },
      {
        icon: <ToggleRight size={32} />,
        value: dashboard.enabledModules,
        label: t("admin.enabledModules"),
      },
      {
        icon: <ToggleLeft size={32} />,
        value: dashboard.disabledModules,
        label: t("admin.disabledModules"),
      },
    ]);
  }, [
    setDashboardCards,
    dashboard.disabledModules,
    dashboard.enabledModules,
    dashboard.flagsTotal,
    dashboard.modulesTotal,
    t,
  ]);

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="text-neutral-100 font-bold">
              {t("admin.modelsTab.header.title")}
            </div>
            <div className="text-xs text-neutral-400">
              {t("admin.modelsTab.header.description")}
            </div>
          </div>
          <DesignActionButton type="button" onClick={load}>
            {t("common.refresh")}
          </DesignActionButton>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <Input
              label={t("admin.modelsTab.form.keyLabel")}
              value={createForm.key}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, key: e.target.value }))
              }
              placeholder={t("admin.modelsTab.form.keyPlaceholder")}
              className="mb-0"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Input
              label={t("admin.modelsTab.form.labelLabel")}
              value={createForm.label}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, label: e.target.value }))
              }
              placeholder={t("admin.modelsTab.form.labelPlaceholder")}
              className="mb-0"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <Input
              label={t("admin.modelsTab.form.descriptionLabel")}
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder={t("admin.modelsTab.form.descriptionPlaceholder")}
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
              {t("admin.modelsTab.form.enabledLabel")}
            </label>

            <DesignActionButton
              type="button"
              onClick={create}
              disabled={adding}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                {adding
                  ? t("admin.modelsTab.form.adding")
                  : t("admin.modelsTab.form.addButton")}
              </span>
            </DesignActionButton>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          {t("admin.modelsTab.loading")}
        </div>
      ) : unsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <p className="text-neutral-400 text-sm">
            {t("admin.modelsTab.unsupported.title")}
          </p>
          <p className="text-neutral-500 text-xs mt-1">
            {t("admin.modelsTab.unsupported.endpoint")}
          </p>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <p className="text-neutral-400 text-sm">
            {t("admin.modelsTab.empty")}
          </p>
          {searchValue.trim() ? (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="text-xs text-neutral-400 hover:text-neutral-200 mt-2"
            >
              {t("admin.modelsTab.clearSearch")}
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
                    <SmallBadge variant="brand">
                      {t("admin.modelsTab.badges.default")}
                    </SmallBadge>
                  ) : (
                    <SmallBadge variant="success">
                      {t("admin.modelsTab.badges.db")}
                    </SmallBadge>
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
                  title={t("admin.modelsTab.actions.toggle")}
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
