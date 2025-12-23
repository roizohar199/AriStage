import React from "react";

export default function ConfirmModal({
  show,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-6 relative shadow-2xl text-center">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <p className="text-sm mb-6">{message}</p>

        <div className="flex gap-4 justify-center">
          <button
            className="px-5 py-2 rounded-2xl bg-neutral-700"
            onClick={onCancel}
          >
            ביטול
          </button>

          <button
            className="px-5 py-2 text-black rounded-2xl bg-brand-orange font-bold"
            onClick={onConfirm}
          >
            אישור
          </button>
        </div>
      </div>
    </div>
  );
}
