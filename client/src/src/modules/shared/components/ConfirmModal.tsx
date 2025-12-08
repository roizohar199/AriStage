import React from "react";

export default function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="glass w-[90%] max-w-sm p-6 rounded-2xl border border-white/10 text-center">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <p className="text-sm mb-6">{message}</p>

        <div className="flex gap-4 justify-center">
          <button
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition"
            onClick={onCancel}
          >
            ביטול
          </button>

          <button
            className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeLight text-black font-bold transition"
            onClick={onConfirm}
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
