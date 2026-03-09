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
import { Textarea } from "./FormControls";
import { useTranslation } from "@/hooks/useTranslation.ts";

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
  const { t } = useTranslation();
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
      showToast(t("lyrics.lyricsUpdated"), "success");
      setOpen(false);
      await onChanged();
    } catch (err: any) {
      showToast(err?.response?.data?.message || t("lyrics.saveError"), "error");
    } finally {
      setSaving(false);
    }
  }, [canEdit, draft, onChanged, showToast, songId, t]);

  const handleDelete = useCallback(async () => {
    if (!canEdit) return;

    const ok = await onConfirm({
      title: t("lyrics.deleteLyrics"),
      message: t("lyrics.confirmDeleteMessage"),
    });
    if (!ok) return;

    try {
      setSaving(true);
      await api.delete(`/songs/${songId}/lyrics`);
      showToast(t("lyrics.lyricsDeleted"), "success");
      setOpen(false);
      await onChanged();
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || t("lyrics.deleteError"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }, [canEdit, onChanged, onConfirm, showToast, songId, t]);

  if (!lyricsEnabled) {
    return (
      <div className="bg-neutral-900 grid place-items-center mt-3 p-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-400">
            {t("lyrics.moduleDisabled")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-neutral-950 grid place-items-center mt-3 p-3 rounded-2xl shadow-surface">
        <div className="flex items-center gap-2 mb-2">
          <PenLineIcon size={16} className="text-brand-primary" />
          <span className="text-xs font-semibold text-neutral-100">
            {t("lyrics.title")}{" "}
            {hasLyrics ? t("lyrics.statusHas") : t("lyrics.statusNone")}
          </span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1.5">
          <button
            onClick={openModal}
            className="w-full bg-neutral-800 p-2 rounded-2xl flex flex-row-reverse items-center justify-center gap-2 text-neutral-100 hover:bg-neutral-750 shadow-surface transition"
            title={t("lyrics.viewLyrics")}
          >
            <Eye size={16} />
            <span className="flex-1 text-xs text-neutral-100 font-bold ">
              {t("lyrics.viewLyrics")}
            </span>
          </button>
        </div>
      </div>

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title={t("lyrics.modalTitle", {
          songTitle: songTitle || t("common.song"),
        })}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-3 p-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            readOnly={!canEdit}
            placeholder={
              canEdit ? t("lyrics.placeholderEdit") : t("lyrics.noLyrics")
            }
            className="min-h-[320px] mb-0"
          />

          {canEdit && (
            <div className="flex items-center gap-2 justify-end">
              <DesignActionButton
                onClick={handleDelete}
                disabled={saving}
                variant="danger"
              >
                <Trash2 size={16} />
                {t("common.delete")}
              </DesignActionButton>
              <DesignActionButton onClick={handleSave} disabled={saving}>
                <Save size={16} />
                {t("common.save")}
              </DesignActionButton>
            </div>
          )}

          {!canEdit && (
            <div className="text-xs text-neutral-400">
              {t("lyrics.readOnlyHint")}
            </div>
          )}
        </div>
      </BaseModal>
    </>
  );
}
