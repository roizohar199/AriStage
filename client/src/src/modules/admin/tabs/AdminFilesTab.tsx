import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Files, Trash2, Users } from "lucide-react";

import api from "@/modules/shared/lib/api.ts";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useToast } from "@/modules/shared/components/ToastProvider";

type SmallBadgeVariant = "neutral" | "brand" | "success" | "danger";

type FileRow = {
  id: number;
  name?: string;
  file_name?: string;
  type?: string;
  mime_type?: string;
  owner_name?: string;
  owner_email?: string;
  size?: number;
  size_bytes?: number;
  created_at?: string;
};

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

export default function AdminFilesTab({
  searchValue,
  setSearchValue,
  CardContainer,
  SmallBadge,
}: Props) {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [files, setFiles] = useState<FileRow[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesUnsupported, setFilesUnsupported] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      setFilesUnsupported(false);
      const { data } = await api.get("/files", { skipErrorToast: true } as any);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 404) setFilesUnsupported(true);
      console.error("Admin loadFiles failed", err);
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => {
      const name = f.name || f.file_name || "";
      const type = f.type || f.mime_type || "";
      const owner = `${f.owner_name || ""} ${f.owner_email || ""}`;
      return `${name} ${type} ${owner}`.toLowerCase().includes(q);
    });
  }, [files, searchValue]);

  const deleteFile = async (fileId: number) => {
    const ok = await confirm({
      title: "מחיקה",
      message: "בטוח למחוק קובץ זה?",
    });
    if (!ok) return;

    try {
      await api.delete(`/files/${fileId}`);
      await loadFiles();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        showToast("TODO: backend endpoint required: DELETE /files/:id", "info");
        return;
      }
      const msg = err?.response?.data?.message || "שגיאה במחיקת הקובץ";
      showToast(msg, "error");
    }
  };

  return (
    <div className="space-y-3">
      {filesLoading ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 text-center text-neutral-400">
          טוען קבצים...
        </div>
      ) : filesUnsupported ? (
        <div className="bg-neutral-800 rounded-2xl p-6 text-center">
          <Files size={32} className="mx-auto mb-3 text-neutral-600" />
          <p className="text-neutral-400 text-sm">TODO: backend endpoint required</p>
          <p className="text-neutral-500 text-xs mt-1">GET /files</p>
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
          <CardContainer key={f.id}>
            <div className="flex-1 min-w-0 text-right">
              <h3 className="text-lg font-bold text-white mb-1">
                {f.name || f.file_name || `file:${f.id}`}
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <SmallBadge icon={<Files size={14} />} variant="brand">
                  {f.type || f.mime_type || "file"}
                </SmallBadge>
                {(f.owner_name || f.owner_email) && (
                  <SmallBadge icon={<Users size={14} />}>
                    {f.owner_name || f.owner_email}
                  </SmallBadge>
                )}
                {(typeof f.size === "number" || typeof f.size_bytes === "number") && (
                  <SmallBadge>
                    {Math.round(((f.size_bytes ?? f.size) as number) / 1024)}KB
                  </SmallBadge>
                )}
              </div>
            </div>

            <div className="flex gap-6 flex-row-reverse items-center">
              <button
                onClick={() => deleteFile(f.id)}
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
