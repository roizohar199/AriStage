import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Files, Trash2, Users } from "lucide-react";

import api from "@/modules/shared/lib/api.ts";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";
import Search from "@/modules/shared/components/Search";
import { Select } from "@/modules/shared/components/FormControls";
import type { AdminUser } from "../pages/Admin";
import { API_ORIGIN } from "@/config/apiConfig";
import type { DashboardCard } from "@/modules/admin/components/DashboardCards";

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

type FileRow = {
  id?: number;
  user_id?: number;
  name?: string;
  file_name?: string;
  type?: string;
  mime_type?: string;
  file_url?: string;
  file_type?: string;
  storage_path?: string;
  modified_at?: string;
  source?: string;
  owner_name?: string;
  owner_email?: string;
  size?: number;
  size_bytes?: number;
  created_at?: string;
};

type Props = {
  searchValue: string;
  setSearchValue: (value: string) => void;
  users?: AdminUser[];
  CardContainer: React.ComponentType<{ children: React.ReactNode }>;
  SmallBadge: React.ComponentType<{
    icon?: React.ReactNode;
    children: React.ReactNode;
    variant?: SmallBadgeVariant;
  }>;
  setDashboardCards?: (cards: DashboardCard[]) => void;
};

export default function AdminFilesTab({
  searchValue,
  setSearchValue,
  users,
  CardContainer,
  SmallBadge,
  setDashboardCards,
}: Props) {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [files, setFiles] = useState<FileRow[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesUnsupported, setFilesUnsupported] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>("");

  const formatBytes = useCallback((bytes?: number | null) => {
    if (typeof bytes !== "number" || !Number.isFinite(bytes)) return "—";
    if (bytes < 1024) return `${bytes}B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)}KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)}MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)}GB`;
  }, []);

  const formatDateTime = useCallback((raw?: string) => {
    if (!raw) return "—";
    try {
      const normalized = String(raw).trim().replace(" ", "T");
      const d = new Date(normalized);
      const ms = d.getTime();
      if (Number.isNaN(ms)) return "—";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return "—";
    }
  }, []);

  const resolveFileHref = useCallback((fileUrl?: string) => {
    if (!fileUrl) return null;
    const raw = String(fileUrl).trim();
    if (!raw) return null;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads/")) return `${API_ORIGIN}${raw}`;
    return raw;
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      setFilesUnsupported(false);
      const { data } = await api.get("/admin/files", {
        skipErrorToast: true,
        params: {
          ...(filterUserId ? { userId: filterUserId } : {}),
          // NOTE: do not send q to backend. Backend filtering is path-based only,
          // and would prevent searching by owner name/email.
          limit: 2000,
          offset: 0,
        },
      } as any);
      const items = Array.isArray(data?.items) ? data.items : [];
      setFiles(items);
    } catch (err: any) {
      if (err?.response?.status === 404) setFilesUnsupported(true);
      console.error("Admin loadFiles failed", err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, [filterUserId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => {
      const name = f.name || f.file_name || "";
      const pathKey = f.storage_path || "";
      const type = f.type || f.mime_type || f.file_type || "";
      const owner = `${f.owner_name || ""} ${f.owner_email || ""}`;
      return `${name} ${pathKey} ${type} ${owner}`.toLowerCase().includes(q);
    });
  }, [files, searchValue]);

  const storageSummary = useMemo(() => {
    const count = filteredFiles.length;
    let knownBytes = 0;
    let unknownCount = 0;

    for (const f of filteredFiles) {
      const raw = (f.size_bytes ?? f.size) as any;
      const bytes = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(bytes)) knownBytes += bytes;
      else unknownCount += 1;
    }

    return { count, knownBytes, unknownCount };
  }, [filteredFiles]);

  const dashboard = useMemo(() => {
    return {
      total: files.length,
      filtered: filteredFiles.length,
      knownBytes: storageSummary.knownBytes,
      unknownCount: storageSummary.unknownCount,
    };
  }, [
    files.length,
    filteredFiles.length,
    storageSummary.knownBytes,
    storageSummary.unknownCount,
  ]);

  useEffect(() => {
    setDashboardCards?.([
      {
        icon: <Files size={32} />,
        value: dashboard.total,
        label: 'סה"כ קבצים',
      },
      { icon: <Files size={32} />, value: dashboard.filtered, label: "מוצגים" },
      {
        icon: <Users size={32} />,
        value: formatBytes(dashboard.knownBytes),
        label: "נפח ידוע",
      },
      {
        icon: <Trash2 size={32} />,
        value: dashboard.unknownCount,
        label: "בלי גודל",
      },
    ]);
  }, [
    setDashboardCards,
    dashboard.filtered,
    dashboard.knownBytes,
    dashboard.total,
    dashboard.unknownCount,
    formatBytes,
  ]);

  const deleteStorageFile = async (storagePath: string) => {
    const ok = await confirm({
      title: "מחיקה",
      message: "בטוח למחוק קובץ זה מהשרת?",
    });
    if (!ok) return;

    try {
      await api.delete("/admin/files", {
        params: { path: storagePath },
      } as any);
      await loadFiles();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast(
          "TODO: backend endpoint required: DELETE /admin/files",
          "info",
        );
        return;
      }
      const msg = err?.response?.data?.message || "שגיאה במחיקת הקובץ";
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">קבצים בשרת (Uploads)</span>
        </div>

        <button
          type="button"
          className="text-xs text-neutral-400 hover:text-neutral-200"
          onClick={loadFiles}
        >
          רענן
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex items-center gap-2">
          <div className="min-w-[240px]">
            <Select
              label="סינון לפי משתמש"
              value={filterUserId}
              onChange={(next) => setFilterUserId(next)}
              options={[
                { value: "", label: "כל המשתמשים" },
                ...(users || []).map((u) => ({
                  value: String(u.id),
                  label: u.full_name ? `${u.full_name} (${u.email})` : u.email,
                })),
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center sm:mr-auto">
          <SmallBadge variant="neutral">
            {`קבצים: ${storageSummary.count}`}
          </SmallBadge>
          <SmallBadge variant="neutral">
            {`סה\"כ: ${formatBytes(storageSummary.knownBytes)}`}
          </SmallBadge>
          {storageSummary.unknownCount ? (
            <SmallBadge variant="neutral">
              {`לא ידוע: ${storageSummary.unknownCount}`}
            </SmallBadge>
          ) : null}
        </div>

        {filterUserId ? (
          <button
            type="button"
            className="text-xs text-neutral-400 hover:text-neutral-200 sm:mr-auto"
            onClick={() => setFilterUserId("")}
          >
            נקה סינון
          </button>
        ) : null}
      </div>

      {filesLoading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען קבצים...
        </div>
      ) : filesUnsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <Files size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">
            TODO: backend endpoint required
          </p>
          <p className="text-neutral-500 text-xs mt-1">GET /admin/files</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <Files size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">אין קבצים להצגה</p>
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
        filteredFiles.map((f) => (
          <CardContainer key={f.storage_path || String(f.id)}>
            <div className="flex-1 min-w-0 text-start">
              <h3 className="text-lg font-bold text-neutral-100 mb-1">
                {f.name ||
                  f.file_name ||
                  f.storage_path ||
                  `file:${f.id ?? "?"}`}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <SmallBadge icon={<Files size={14} />} variant="brand">
                  {f.file_type || f.type || f.mime_type || "file"}
                </SmallBadge>
                {(f.owner_name || f.owner_email) && (
                  <SmallBadge icon={<Users size={14} />}>
                    {f.owner_name || f.owner_email}
                  </SmallBadge>
                )}
                <SmallBadge>
                  {formatBytes((f.size_bytes ?? f.size) as any)}
                </SmallBadge>
                <SmallBadge>
                  {formatDateTime(
                    (f.created_at || (f as any).modified_at) as any,
                  )}
                </SmallBadge>
              </div>
            </div>

            <div className="flex gap-6 flex-row-reverse items-center">
              {resolveFileHref(f.file_url) ? (
                <a
                  href={resolveFileHref(f.file_url) as string}
                  target="_blank"
                  rel="noreferrer"
                  className="w-6 h-6 text-neutral-300 hover:text-neutral-100"
                  title="פתח"
                >
                  <ExternalLink size={20} />
                </a>
              ) : null}
              <button
                onClick={() =>
                  f.storage_path
                    ? deleteStorageFile(String(f.storage_path))
                    : showToast("לא ניתן למחוק: חסר storage_path", "error")
                }
                className="w-6 h-6 text-red-500 hover:text-red-400"
                title="מחיקה"
                type="button"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </CardContainer>
        ))
      )}
    </div>
  );
}
