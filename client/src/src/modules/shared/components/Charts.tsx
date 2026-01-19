import React, { useState, useCallback } from "react";
import { Trash2, Upload, FileDown, Eye, FileText } from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useFeatureFlags } from "@/modules/shared/contexts/FeatureFlagsContext.tsx";
import { useToast } from "./ToastProvider";
import { ConfirmOptions } from "../confirm/types";
import BaseModal from "./BaseModal.tsx";

interface Chart {
  id: number;
  file_path: string;
}

interface Song {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key_sig: string;
  duration_sec: number;
  notes?: string;
  is_owner?: boolean;
  owner_id?: number;
  owner_name?: string;
  chart_pdf_url?: string | null;
  owner_avatar?: string;
  owner_role?: string;
  owner_email?: string;
}

interface ChartsProps {
  song: Song;
  privateCharts: Chart[];
  setPrivateCharts: React.Dispatch<
    React.SetStateAction<Record<number, Chart[]>>
  >;
  fileInputRefs: React.MutableRefObject<
    Record<number, HTMLInputElement | null>
  >;
  viewingChart: string | null;
  setViewingChart: React.Dispatch<React.SetStateAction<string | null>>;
  onConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

export default function Charts({
  song,
  privateCharts,
  setPrivateCharts,
  fileInputRefs,
  viewingChart,
  setViewingChart,
  onConfirm,
}: ChartsProps): JSX.Element {
  const { showToast } = useToast();
  const { isEnabled } = useFeatureFlags();
  const chartsEnabled = isEnabled("module.charts", true);

  if (!chartsEnabled) {
    return (
      <div className="bg-neutral-900 grid place-items-center mt-3 p-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-400">
            מודול צ&apos;ארטים כבוי
          </span>
        </div>
      </div>
    );
  }

  const handleDeleteChart = useCallback(
    async (chartId: number) => {
      const ok = await onConfirm({
        title: "מחיקת צ'ארט",
        message: "בטוח שאתה רוצה למחוק את הצ'ארט?",
      });
      if (!ok) return;
      try {
        await api.delete(`/songs/${song.id}/private-charts/${chartId}`);
        showToast("הצ'ארט נמחק בהצלחה", "success");
        setPrivateCharts((prev) => ({
          ...prev,
          [song.id]: prev[song.id].filter((c) => c.id !== chartId),
        }));
      } catch (err) {
        console.error("❌ delete chart error:", err);
        showToast("שגיאה במחיקת הצ'ארט", "error");
      }
    },
    [song.id, onConfirm, showToast, setPrivateCharts],
  );

  const handleDownloadChart = useCallback(
    (chart: Chart) => {
      const link = document.createElement("a");
      link.href = chart.file_path;
      link.download = `${song.title || "chart"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [song.title],
  );

  const handleUploadChart = useCallback(
    async (file: File) => {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        showToast("רק קבצי PDF או תמונה (JPG, PNG, GIF) מותרים", "error");
        return;
      }
      try {
        const formData = new FormData();
        formData.append("pdf", file);
        await api.post(`/songs/${song.id}/private-charts`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("הקובץ הועלה בהצלחה", "success");
        try {
          const { data: chartsData } = await api.get(
            `/songs/${song.id}/private-charts`,
          );
          setPrivateCharts((prev) => ({
            ...prev,
            [song.id]: chartsData.charts || [],
          }));
        } catch (err) {
          console.error("שגיאה בטעינת צ'ארטים:", err);
        }
        window.dispatchEvent(
          new CustomEvent("data-refresh", {
            detail: { type: "song", action: "chart-uploaded" },
          }),
        );
      } catch (err) {
        showToast("שגיאה בהעלאת הקובץ", "error");
      }
    },
    [song.id, showToast, setPrivateCharts],
  );

  return (
    <>
      {/* בלוק אייקונים אחד - גם אם אין צ'ארטים */}
      <div className="bg-neutral-900 grid place-items-center mt-3 p-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-brand-orange" />
          <span className="text-xs font-semibold text-neutral-300">
            הצ'ארטים שלי ({privateCharts.length})
          </span>
        </div>
        <div className="flex flex-wrap grid gap-2">
          {/* הצ'ארטים */}
          {privateCharts &&
            privateCharts.length > 0 &&
            privateCharts.map((chart, idx) => (
              <div
                key={chart.id}
                className="border-b-2 border-neutral-800 overflow-hidden flex items-center gap-4 px-2 py-1.5"
              >
                <span className="text-xs text-white/50 font-bold rounded-2xl">
                  #{idx + 1}
                </span>
                {/* צפייה תמיד מותרת */}
                <button
                  onClick={() => setViewingChart(chart.file_path)}
                  className="w-6 h-6 text-white hover:text-brand-orange"
                  title="צפייה"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleDownloadChart(chart)}
                  className="w-6 h-6 text-white hover:text-brand-orange"
                  title="הורדה"
                >
                  <FileDown size={16} />
                </button>
                <button
                  onClick={() => handleDeleteChart(chart.id)}
                  className="w-6 h-6 text-red-500 hover:text-red-400"
                  title="מחיקה"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          {/* כפתור העלאה תמיד גלוי */}
          <div className="flex items-center gap-1 px-2 py-1.5">
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/gif,image/jpg"
              ref={(el) => {
                if (el) fileInputRefs.current[song.id] = el;
              }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadChart(file);
                }
                e.target.value = "";
              }}
              className="hidden"
            />

            <button
              onClick={() => fileInputRefs.current[song.id]?.click()}
              className="w-full bg-neutral-700/50 p-2 rounded-2xl flex flex-row-reverse items-center justify-center gap-2 text-brand-orange"
              title="העלה קובץ"
            >
              <Upload size={16} />
              <span className="flex-1 text-xs text-white font-bold">
                העלה קובץ
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* מודאל צפייה בצ'ארט */}
      <BaseModal
        open={!!viewingChart}
        onClose={() => setViewingChart(null)}
        title="צפייה בצ'ארט"
        maxWidth="max-w-4xl"
        containerClassName="max-h-[90vh] flex flex-col overflow-hidden"
        padding="p-0"
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-700 bg-neutral-950">
          <h3 className="text-white">צפייה בצ'ארט</h3>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {viewingChart && viewingChart.toLowerCase().endsWith(".pdf") ? (
            <iframe
              src={viewingChart}
              className="w-full h-full min-h-96"
              style={{ border: "none" }}
            />
          ) : (
            <img
              src={viewingChart || ""}
              alt="צ'ארט"
              className="max-w-full max-h-full"
            />
          )}
        </div>
      </BaseModal>
    </>
  );
}
