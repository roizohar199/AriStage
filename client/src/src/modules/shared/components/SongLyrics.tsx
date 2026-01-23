import React, { useCallback, useMemo, useState } from "react";
import {
  Eye,
  Save,
  Trash2,
  FileText,
  PenIcon,
  PenLineIcon,
} from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import BaseModal from "./BaseModal.tsx";
import { useToast } from "./ToastProvider";
import { useFeatureFlags } from "@/modules/shared/contexts/FeatureFlagsContext.tsx";
import { ConfirmOptions } from "../confirm/types";
import DesignActionButton from "./DesignActionButton";

type SongLyricsProps = {
  songId: number;
  songTitle: string;
  lyricsText?: string | null;
  canEdit: boolean;
  onConfirm: (options: ConfirmOptions) => Promise<boolean>;
  onChanged: () => Promise<void> | void;
};

export default function SongLyrics({
  songId,
  songTitle,
  lyricsText,
  canEdit,
  onConfirm,
  onChanged,
}: SongLyricsProps): JSX.Element {
  const { showToast } = useToast();
  const { isEnabled } = useFeatureFlags();
  const lyricsEnabled = isEnabled("module.lyrics", true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(lyricsText || "");

  const hasLyrics = useMemo(
    () => Boolean((lyricsText || "").trim()),
    [lyricsText],
  );

  const openModal = useCallback(() => {
    setDraft(lyricsText || "");
    setOpen(true);
  }, [lyricsText]);

  const handleSave = useCallback(async () => {
    if (!canEdit) return;

    try {
      setSaving(true);
      await api.put(`/songs/${songId}/lyrics`, { lyrics_text: draft });
      showToast("המילים נשמרו", "success");
      setOpen(false);
      await onChanged();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "שגיאה בשמירת מילים", "error");
    } finally {
      setSaving(false);
    }
  }, [canEdit, draft, onChanged, showToast, songId]);

  const handleDelete = useCallback(async () => {
    if (!canEdit) return;

    const ok = await onConfirm({
      title: "מחיקת מילים",
      message: "בטוח שאתה רוצה למחוק את המילים לשיר הזה?",
    });
    if (!ok) return;

    try {
      setSaving(true);
      await api.delete(`/songs/${songId}/lyrics`);
      showToast("המילים נמחקו", "success");
      setOpen(false);
      await onChanged();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "שגיאה במחיקת מילים", "error");
    } finally {
      setSaving(false);
    }
  }, [canEdit, onChanged, onConfirm, showToast, songId]);

  if (!lyricsEnabled) {
    return (
      <div className="bg-neutral-900 grid place-items-center mt-3 p-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-400">
            מודול מילים כבוי
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-neutral-900 grid place-items-center mt-3 p-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <PenLineIcon size={16} className="text-brand-orange" />
          <span className="text-xs font-semibold text-neutral-300">
            מילים {hasLyrics ? "(קיים)" : "(אין)"}
          </span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1.5">
          <button
            onClick={openModal}
            className="w-full bg-neutral-700/50 p-2 rounded-2xl flex flex-row-reverse items-center justify-center gap-2 text-brand-orange hover:bg-neutral-700 "
            title="צפייה במילים"
          >
            <Eye size={16} />
            <span className="flex-1 text-xs text-white font-bold ">
              צפייה במילים
            </span>
          </button>
        </div>
      </div>

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title={`מילים - ${songTitle || "שיר"}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-3 p-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={!canEdit}
            placeholder={canEdit ? "הדבק/כתוב כאן את המילים..." : "אין מילים"}
            className="w-full min-h-[320px] bg-neutral-800 text-white rounded-2xl p-3 focus:outline-none hover:bg-neutral-700/50 focus:bg-neutral-700"
          />

          {canEdit && (
            <div className="flex items-center gap-2 justify-end">
              <DesignActionButton
                onClick={handleDelete}
                disabled={saving}
                variant="danger"
              >
                <Trash2 size={16} />
                מחיקה
              </DesignActionButton>
              <DesignActionButton onClick={handleSave} disabled={saving}>
                <Save size={16} />
                שמירה
              </DesignActionButton>
            </div>
          )}

          {!canEdit && (
            <div className="text-xs text-neutral-400">
              למוזמנים יש הרשאת צפייה בלבד.
            </div>
          )}
        </div>
      </BaseModal>
    </>
  );
}
