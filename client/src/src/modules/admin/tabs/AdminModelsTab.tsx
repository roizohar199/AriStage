import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Save, ToggleLeft, ToggleRight, X } from "lucide-react";

import api from "@/modules/shared/lib/api.ts";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import { useToast } from "@/modules/shared/components/ToastProvider";

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
  { key: "module.charts", label: "צ'ארטים", description: "ניהול צ'ארטים וקבצי תווים" },
  { key: "module.lyrics", label: "מילים", description: "ניהול מילים לשירים" },
  { key: "module.addSongs", label: "הוספת שירים", description: "יצירה/עריכה/מחיקה של שירים" },
  { key: "module.lineups", label: "ליינאפים", description: "ניהול ליינאפים ושירים בליינאפ" },
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
};

export default function AdminModelsTab({
  searchValue,
  setSearchValue,
  CardContainer,
  SmallBadge,
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

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedShowModules, setAdvancedShowModules] = useState(false);

  const [editingFlagKey, setEditingFlagKey] = useState<string | null>(null);
  const [editingFlagDraft, setEditingFlagDraft] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setUnsupported(false);
      const { data } = await api.get("/feature-flags", { skipErrorToast: true } as any);
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
    const missingDefaults = DEFAULT_MODULES.filter((m) => !seen.has(m.key)).map((m) => ({
      key: m.key,
      label: m.label,
      description: m.description,
      enabled: true,
      source: "default" as const,
    }));

    return [...dbModules, ...missingDefaults].sort((a, b) => a.key.localeCompare(b.key));
  }, [rows]);

  const filteredModules = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) =>
      `${m.key} ${m.label} ${m.description}`.toLowerCase().includes(q)
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
    [load, showToast]
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
      setCreateForm({ key: "module.", label: "", description: "", enabled: true });
      showToast("מודול נוסף", "success");
    } finally {
      setAdding(false);
    }
  };

  const advancedFlags = useMemo(() => {
    const base = rows
      .filter((r) => {
        const key = String(r.key || "");
        if (advancedShowModules) return true;
        return !key.startsWith("module.");
      })
      .map((r) => ({
        key: String(r.key),
        description: (r.description ?? "").toString(),
        enabled: toBool(r.enabled),
      }));

    const q = searchValue.trim().toLowerCase();
    if (!q) return base;
    return base.filter((f) =>
      `${f.key} ${f.description}`.toLowerCase().includes(q)
    );
  }, [rows, advancedShowModules, searchValue]);

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="text-white font-bold">מודלים (Modules)</div>
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
            <label className="text-xs text-neutral-300 font-bold">Key</label>
            <input
              value={createForm.key}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, key: e.target.value }))
              }
              className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
              placeholder="module.myFeature"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-300 font-bold">Label</label>
            <input
              value={createForm.label}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, label: e.target.value }))
              }
              className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
              placeholder="לדוגמה: הוספת שירים"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs text-neutral-300 font-bold">Description</label>
            <input
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((p) => ({ ...p, description: e.target.value }))
              }
              className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
              placeholder="תיאור (אופציונלי) — אם ריק נשתמש ב-Label"
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
                className="accent-brand-orange"
              />
              enabled
            </label>

            <DesignActionButton type="button" onClick={create} disabled={adding}>
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
              <div className="flex-1 min-w-0 text-right">
                <h3 className="text-lg font-bold text-white mb-1">{m.label}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <SmallBadge variant="neutral">{m.key}</SmallBadge>
                  {m.source === "default" ? (
                    <SmallBadge variant="brand">default</SmallBadge>
                  ) : (
                    <SmallBadge variant="success">db</SmallBadge>
                  )}
                </div>
                {m.description ? (
                  <p className="text-sm text-neutral-300 mt-2">{m.description}</p>
                ) : null}
              </div>

              <div className="flex gap-6 flex-row-reverse items-center">
                <button
                  onClick={() => upsertFlag(m.key, !m.enabled, m.description)}
                  className="w-6 h-6 text-brand-orange hover:text-white"
                  title="toggle"
                  type="button"
                >
                  {m.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>
            </CardContainer>
          ))}
        </div>
      )}

      {/* Advanced */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
        <button
          type="button"
          className="w-full flex items-center justify-between"
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          <div className="text-white font-bold">מתקדם: Feature Flags</div>
          {advancedOpen ? (
            <ChevronUp className="text-neutral-300" size={18} />
          ) : (
            <ChevronDown className="text-neutral-300" size={18} />
          )}
        </button>

        {advancedOpen ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-neutral-200">
                <input
                  type="checkbox"
                  checked={advancedShowModules}
                  onChange={(e) => setAdvancedShowModules(e.target.checked)}
                  className="accent-brand-orange"
                />
                הצג גם module.* כאן (ברירת מחדל: מוסתר)
              </label>

              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                נקה חיפוש
              </button>
            </div>

            {advancedFlags.length === 0 ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center text-neutral-400 text-sm">
                אין Feature Flags להצגה
              </div>
            ) : (
              <div className="space-y-3">
                {advancedFlags.map((f) => {
                  const isEditing = editingFlagKey === f.key;
                  return (
                    <CardContainer key={`adv-${f.key}`}>
                      <div className="flex-1 min-w-0 text-right">
                        <h3 className="text-lg font-bold text-white mb-1">{f.key}</h3>
                        {isEditing ? (
                          <div className="mt-2">
                            <label className="text-xs text-neutral-300 font-bold">
                              description
                            </label>
                            <input
                              value={editingFlagDraft}
                              onChange={(e) => setEditingFlagDraft(e.target.value)}
                              className="mt-2 w-full bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
                              placeholder="תיאור"
                            />
                          </div>
                        ) : f.description ? (
                          <p className="text-sm text-neutral-300">{f.description}</p>
                        ) : (
                          <p className="text-sm text-neutral-500">—</p>
                        )}
                      </div>

                      <div className="flex gap-4 flex-row-reverse items-center">
                        <button
                          onClick={() => upsertFlag(f.key, !f.enabled, f.description)}
                          className="w-6 h-6 text-brand-orange hover:text-white"
                          title="toggle"
                          type="button"
                        >
                          {f.enabled ? (
                            <ToggleRight size={22} />
                          ) : (
                            <ToggleLeft size={22} />
                          )}
                        </button>

                        {!isEditing ? (
                          <button
                            type="button"
                            className="w-6 h-6 text-neutral-300 hover:text-white"
                            title="edit description"
                            onClick={() => {
                              setEditingFlagKey(f.key);
                              setEditingFlagDraft(f.description || "");
                            }}
                          >
                            <Pencil size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="w-6 h-6 text-neutral-300 hover:text-white"
                              title="cancel"
                              onClick={() => {
                                setEditingFlagKey(null);
                                setEditingFlagDraft("");
                              }}
                            >
                              <X size={18} />
                            </button>
                            <button
                              type="button"
                              className="w-6 h-6 text-green-400 hover:text-green-300"
                              title="save"
                              onClick={async () => {
                                try {
                                  await upsertFlag(f.key, f.enabled, editingFlagDraft);
                                  setEditingFlagKey(null);
                                  setEditingFlagDraft("");
                                  showToast("עודכן", "success");
                                } catch {
                                  // handled inside upsertFlag
                                }
                              }}
                            >
                              <Save size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </CardContainer>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

