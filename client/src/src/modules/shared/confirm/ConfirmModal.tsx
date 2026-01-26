import React from "react";
import BaseModal from "../components/BaseModal.tsx";
import { ConfirmVariant } from "./types";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmButtonClassName =
    variant === "confirm"
      ? "bg-brand-primary text-neutral-100"
      : "bg-red-600 hover:bg-red-500 text-neutral-100";

  return (
    <BaseModal
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth="max-w-md"
      closeOnBackdropClick={true}
      closeOnEsc={true}
      lockScroll={false}
      showCloseButton={false}
      backdropClassName="bg-black/50"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <p className="text-sm mb-6 text-neutral-300">{message}</p>

        <div className="flex gap-4 justify-center">
          <button
            className="px-5 py-2 font-bold rounded-2xl bg-neutral-700/50 hover:bg-neutral-700"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>

          <button
            className={`px-5 py-2 font-bold rounded-2xl hover:bg-brand-primaryLight ${confirmButtonClassName}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
