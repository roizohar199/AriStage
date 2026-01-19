import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import DesignActionButton from "@/modules/shared/components/DesignActionButton";
import api from "@/modules/shared/lib/api.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";

import type { AdminUser } from "../pages/Admin";

type LogRow = {
  id: number;
  level?: "info" | "warn" | "error";
  action?: string;
  message?: string;
  explanation?: string;
  actorLabel?: string;
  userId?: number;
  createdAt?: string;
  context?: any;

  // legacy/fallback fields
  user?: string;
  entity?: string;
  created_at?: string;
};

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

type Props = {
  users: AdminUser[];
  searchValue: string;
  setSearchValue: (value: string) => void;
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  SmallBadge: React.ComponentType<{
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: SmallBadgeVariant;
  }>;
};

function formatLogTimestamp(raw?: string | null): string {
  if (!raw) return "—";
  try {
    const trimmed = String(raw).trim();
    if (!trimmed) return "—";

    // Normalize common MySQL format -> ISO-ish so Date can parse it.
    // Examples:
    // - "2026-01-05 22:57:48" -> "2026-01-05T22:57:48"
    // - "2026-01-05T22:57:48.000Z" -> same
    const normalized = trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T");

    const d = new Date(normalized);
    const ms = d.getTime();
    if (Number.isNaN(ms)) return trimmed;

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(raw);
  }
}

export default function AdminLogsTab({
  users,
  searchValue,
  setSearchValue,
  CardContainer,
  SmallBadge,
}: Props) {
  const { showToast } = useToast();

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLimit, setLogsLimit] = useState(50);
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsLevel, setLogsLevel] = useState<"" | "info" | "warn" | "error">(
    ""
  );
  const [logsAction, setLogsAction] = useState("");
  const [logsUserId, setLogsUserId] = useState<"" | number>("");
  const [logsFromDate, setLogsFromDate] = useState("");
  const [logsToDate, setLogsToDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState("");
  const [cleanupOlderThanDays, setCleanupOlderThanDays] = useState(30);
  const [cleanupBeforeDate, setCleanupBeforeDate] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsUnsupported, setLogsUnsupported] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      setLogsUnsupported(false);
      const q = searchValue.trim();

      const params: any = {
        limit: logsLimit,
        offset: logsOffset,
        sort: "createdAt DESC",
      };
      if (q) params.q = q;
      if (logsLevel) params.level = logsLevel;
      if (logsAction) params.action = logsAction;
      if (logsUserId !== "") params.userId = logsUserId;
      if (logsFromDate) params.fromDate = logsFromDate;
      if (logsToDate) params.toDate = logsToDate;

      const { data } = await api.get("/logs", {
        params,
        skipErrorToast: true,
      } as any);

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      setLogs(rows);
      setLogsTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (err: any) {
      if (err?.response?.status === 404) setLogsUnsupported(true);
      console.error("Admin loadLogs failed", err);
      setLogs([]);
      setLogsTotal(0);
    } finally {
      setLogsLoading(false);
    }
  }, [
    logsLimit,
    logsOffset,
    logsLevel,
    logsAction,
    logsUserId,
    logsFromDate,
    logsToDate,
    searchValue,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(t);
  }, [
    loadLogs,
    logsLimit,
    logsOffset,
    logsLevel,
    logsAction,
    logsUserId,
    logsFromDate,
    logsToDate,
    searchValue,
  ]);

  const logsActionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of logs) {
      if (row?.action) set.add(String(row.action));
    }
    return Array.from(set).sort();
  }, [logs]);

  const runLogsCleanup = useCallback(async () => {
    if (cleanupConfirmText.trim() !== "DELETE LOGS") {
      showToast('יש להקליד בדיוק "DELETE LOGS" כדי לאשר', "error");
      return;
    }

    try {
      setCleanupLoading(true);

      const params: any = {};
      if (cleanupBeforeDate.trim()) params.beforeDate = cleanupBeforeDate.trim();
      else params.olderThanDays = cleanupOlderThanDays;

      const { data } = await api.delete("/logs/cleanup", { params } as any);
      showToast(`נמחקו ${data?.deletedCount ?? 0} לוגים`, "success");
      setCleanupOpen(false);
      setCleanupConfirmText("");
      setLogsOffset(0);
      await loadLogs();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "שגיאה בניקוי לוגים";
      showToast(msg, "error");
    } finally {
      setCleanupLoading(false);
    }
  }, [
    cleanupConfirmText,
    cleanupBeforeDate,
    cleanupOlderThanDays,
    loadLogs,
    showToast,
  ]);

  return (
    <div className="space-y-3">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-bold">Level</label>
              <select
                value={logsLevel}
                onChange={(e) => {
                  setLogsLevel(e.target.value as any);
                  setLogsOffset(0);
                }}
                className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
              >
                <option value="">All</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-bold">Action</label>
              <select
                value={logsAction}
                onChange={(e) => {
                  setLogsAction(e.target.value);
                  setLogsOffset(0);
                }}
                className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm min-w-40"
              >
                <option value="">All</option>
                {logsActionOptions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-bold">User</label>
              <select
                value={logsUserId === "" ? "" : String(logsUserId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setLogsUserId(v ? Number(v) : "");
                  setLogsOffset(0);
                }}
                className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm min-w-56"
              >
                <option value="">All</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {(u.full_name || "User").trim()} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-bold">From</label>
              <input
                type="datetime-local"
                value={logsFromDate}
                onChange={(e) => {
                  setLogsFromDate(e.target.value);
                  setLogsOffset(0);
                }}
                className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-bold">To</label>
              <input
                type="datetime-local"
                value={logsToDate}
                onChange={(e) => {
                  setLogsToDate(e.target.value);
                  setLogsOffset(0);
                }}
                className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-300 font-bold">Page Size</label>
              <select
                value={String(logsLimit)}
                onChange={(e) => {
                  setLogsLimit(Number(e.target.value));
                  setLogsOffset(0);
                }}
                className="bg-neutral-950 border border-neutral-800 p-2 rounded-2xl text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="flex-1" />

            <DesignActionButton type="button" onClick={() => setCleanupOpen(true)}>
              ניקוי לוגים
            </DesignActionButton>
          </div>

          <div className="text-xs text-neutral-400">
            {logsTotal > 0 ? (
              <span>
                מציג {Math.min(logsOffset + 1, logsTotal)}-
                {Math.min(logsOffset + logsLimit, logsTotal)} מתוך {logsTotal}
              </span>
            ) : (
              <span>אין תוצאות</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-sm disabled:opacity-50"
              disabled={logsOffset <= 0}
              onClick={() => setLogsOffset((v) => Math.max(0, v - logsLimit))}
            >
              הקודם
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-sm disabled:opacity-50"
              disabled={logsOffset + logsLimit >= logsTotal}
              onClick={() => setLogsOffset((v) => v + logsLimit)}
            >
              הבא
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-2xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-sm"
              onClick={() => {
                setLogsLevel("");
                setLogsAction("");
                setLogsUserId("");
                setLogsFromDate("");
                setLogsToDate("");
                setSearchValue("");
                setLogsOffset(0);
              }}
            >
              נקה פילטרים
            </button>
          </div>
        </div>
      </div>

      {logsLoading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען לוגים...
        </div>
      ) : logsUnsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <ClipboardList size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">Endpoint לא זמין</p>
          <p className="text-neutral-500 text-xs mt-1">GET /api/logs</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <ClipboardList size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">אין לוגים להצגה</p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="grid grid-cols-1">
            <div className="hidden md:grid md:grid-cols-5 gap-2 px-4 py-2 text-xs text-neutral-400 bg-neutral-950 border-b border-neutral-800">
              <div>Time</div>
              <div>Level</div>
              <div>Action</div>
              <div className="md:col-span-2">Explanation</div>
            </div>

            {logs.map((l) => {
              const ts = l.createdAt || l.created_at || "";
              const tsLabel = formatLogTimestamp(ts);
              const level = (l.level as any) || "info";
              const actor =
                l.actorLabel || l.user || (l.userId ? `User ${l.userId}` : "System");
              const explanation = l.explanation || l.entity || l.message || "";

              const levelVariant: SmallBadgeVariant =
                level === "error" ? "danger" : level === "warn" ? "brand" : "success";

              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLog(l)}
                  className="w-full text-right px-4 py-3 border-b border-neutral-800 hover:bg-neutral-800/50 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                    <div
                      className="text-xs text-neutral-400 tabular-nums"
                      dir="ltr"
                    >
                      {tsLabel}
                    </div>
                    <div>
                      <SmallBadge variant={levelVariant}>{level}</SmallBadge>
                    </div>
                    <div className="text-sm font-bold text-white break-all">
                      {l.action || "LOG"}
                    </div>
                    <div className="md:col-span-2 text-sm text-neutral-200">
                      <div className="truncate md:whitespace-normal">{explanation}</div>
                      <div className="text-xs text-neutral-500 mt-1">{actor}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div className="text-white font-bold">Log Details</div>
              <button
                type="button"
                className="text-neutral-300 hover:text-white"
                onClick={() => setSelectedLog(null)}
              >
                סגור
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                  <div className="text-xs text-neutral-400">Timestamp</div>
                  <div className="text-white tabular-nums" dir="ltr">
                    {formatLogTimestamp(
                      selectedLog.createdAt || selectedLog.created_at || ""
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1 break-all" dir="ltr">
                    {selectedLog.createdAt || selectedLog.created_at || ""}
                  </div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                  <div className="text-xs text-neutral-400">UserId</div>
                  <div className="text-white">{selectedLog.userId ?? "—"}</div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                  <div className="text-xs text-neutral-400">Action</div>
                  <div className="text-white break-all">{selectedLog.action || ""}</div>
                </div>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                  <div className="text-xs text-neutral-400">Level</div>
                  <div className="text-white">{selectedLog.level || "info"}</div>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                <div className="text-xs text-neutral-400 mb-2">Context</div>
                <pre className="text-xs text-neutral-200 whitespace-pre-wrap break-words max-h-[40vh] overflow-auto">
                  {JSON.stringify(selectedLog.context ?? null, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {cleanupOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div className="text-white font-bold">ניקוי לוגים</div>
              <button
                type="button"
                className="text-neutral-300 hover:text-white"
                onClick={() => {
                  setCleanupOpen(false);
                  setCleanupConfirmText("");
                }}
              >
                סגור
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-sm text-neutral-300">
                פעולה זו מוחקת לוגים מהמערכת. כדי לאשר, הקלד{" "}
                <span className="font-bold text-white">DELETE LOGS</span>.
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                  <div className="text-xs text-neutral-400">olderThanDays</div>
                  <input
                    type="number"
                    min={1}
                    value={cleanupOlderThanDays}
                    onChange={(e) => setCleanupOlderThanDays(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm mt-2"
                  />
                  <div className="text-[11px] text-neutral-500 mt-1">
                    אם beforeDate ריק, יימחקו לוגים ישנים מ-X ימים.
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                  <div className="text-xs text-neutral-400">beforeDate</div>
                  <input
                    type="datetime-local"
                    value={cleanupBeforeDate}
                    onChange={(e) => setCleanupBeforeDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm mt-2"
                    dir="ltr"
                  />
                  {cleanupBeforeDate.trim() ? (
                    <div className="text-[11px] text-neutral-400 mt-2 tabular-nums" dir="ltr">
                      {formatLogTimestamp(cleanupBeforeDate.trim())}
                    </div>
                  ) : null}
                  <div className="text-[11px] text-neutral-500 mt-1">
                    אם ממולא — מתעלם מ-olderThanDays.
                  </div>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
                  <div className="text-xs text-neutral-400">Confirmation</div>
                  <input
                    type="text"
                    value={cleanupConfirmText}
                    onChange={(e) => setCleanupConfirmText(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 p-2 rounded-2xl text-sm mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-sm"
                  onClick={() => {
                    setCleanupOpen(false);
                    setCleanupConfirmText("");
                  }}
                >
                  ביטול
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-2xl bg-red-600 hover:bg-red-500 text-sm disabled:opacity-50"
                  disabled={cleanupLoading}
                  onClick={runLogsCleanup}
                >
                  {cleanupLoading ? "מנקה..." : "מחק לוגים"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
