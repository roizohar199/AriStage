import React, { useCallback, useEffect, useRef, useState } from "react";
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
  setViewingChart: React.Dispatch<React.SetStateAction<string | null>>;
  onConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

export default function Charts({
  song,
  privateCharts,
  setPrivateCharts,
  fileInputRefs,
  setViewingChart,
  onConfirm,
}: ChartsProps) {
  const { showToast } = useToast();
  const { isEnabled } = useFeatureFlags();
  const chartsEnabled = isEnabled("module.charts", true);

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
          [song.id]: (prev[song.id] || []).filter((c) => c.id !== chartId),
        }));
      } catch (err) {
        console.error("❌ delete chart error:", err);
        showToast("שגיאה במחיקת הצ'ארט", "error");
      }
    },
    [onConfirm, setPrivateCharts, showToast, song.id],
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
        console.error("❌ upload chart error:", err);
        showToast("שגיאה בהעלאת הקובץ", "error");
      }
    },
    [setPrivateCharts, showToast, song.id],
  );

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

  return (
    <div className="bg-neutral-950 grid place-items-center mt-3 p-3 rounded-2xl shadow-surface">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} className="text-brand-primary" />
        <span className="text-xs font-semibold text-neutral-100">
          הצ'ארטים שלי ({privateCharts.length})
        </span>
      </div>

      {/* 1) רשימה */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        {privateCharts?.length > 0 &&
          privateCharts.map((chart, idx) => (
            <div
              key={chart.id}
              className="border-b-2 border-neutral-800 overflow-hidden flex items-center gap-4 px-2 py-1.5"
            >
              <span className="text-xs text-neutral-300 rounded-2xl">
                #{idx + 1}
              </span>

              <button
                onClick={() => setViewingChart(chart.file_path)}
                className="text-neutral-100 hover:text-brand-primary outline-none hover:bg-neutral-900 rounded-full p-1 transition"
                title="צפייה"
              >
                <Eye size={16} />
              </button>

              <button
                onClick={() => handleDownloadChart(chart)}
                className="text-neutral-100 hover:text-brand-primary outline-none hover:bg-neutral-900 rounded-full p-1 transition"
                title="הורדה"
              >
                <FileDown size={16} />
              </button>

              <button
                onClick={() => handleDeleteChart(chart.id)}
                className="text-red-600 hover:text-red-500 outline-none hover:bg-neutral-900 rounded-full p-1 transition"
                title="מחיקה"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </div>

      {/* 2) העלאה — תמיד מתחת */}
      <div className="w-fit mt-3">
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/gif,image/jpg"
          ref={(el) => {
            if (el) fileInputRefs.current[song.id] = el;
          }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadChart(file);
            e.target.value = "";
          }}
          className="hidden"
        />

        <button
          onClick={() => fileInputRefs.current[song.id]?.click()}
          className="w-full bg-neutral-800 p-2 rounded-2xl flex flex-row-reverse items-center justify-center gap-2 text-neutral-100 hover:bg-neutral-750 shadow-surface transition"
          title="העלה קובץ"
        >
          <Upload size={16} />
          <span className="flex-1 text-xs text-neutral-100 font-bold">
            העלה קובץ
          </span>
        </button>
      </div>
    </div>
  );
}

export interface ChartViewerModalProps {
  viewingChart: string | null;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
}

export function ChartViewerModal({
  viewingChart,
  onClose,
  title = "צפייה בצ'ארט",
  maxWidth = "max-w-5xl",
}: ChartViewerModalProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, []);

  const handleViewerScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false);
      scrollTimerRef.current = null;
    }, 700);
  }, []);

  return (
    <BaseModal
      open={!!viewingChart}
      onClose={onClose}
      title={title}
      maxWidth={maxWidth}
      containerClassName="max-h-[90vh] flex flex-col overflow-hidden"
      padding="p-0"
      lockScroll
    >
      <div className="flex justify-between items-center p-4 border-b border-neutral-700 bg-neutral-850">
        <h3 className="h-page">{title}</h3>
      </div>
      <div
        className={`flex-1 overflow-auto p-4 app-scroll ${
          isScrolling ? "scrolling" : ""
        }`}
        onScroll={handleViewerScroll}
      >
        {viewingChart && viewingChart.toLowerCase().endsWith(".pdf") ? (
          <iframe
            src={viewingChart}
            className="w-full h-[80vh]"
            style={{ border: "none" }}
            title="Chart Viewer"
          />
        ) : (
          <img
            src={viewingChart || ""}
            alt="צ'ארט"
            className="block w-full h-auto"
            style={{ maxHeight: "none" }}
          />
        )}
      </div>
    </BaseModal>
  );
}
