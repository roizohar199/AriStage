import React, { useEffect, useCallback, ReactNode } from "react";
import { X } from "lucide-react";

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: string;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  lockScroll?: boolean;
  backdropClassName?: string;
  padding?: string;
  showCloseButton?: boolean;
  containerClassName?: string;
  backdropContainerClassName?: string;
}

export default function BaseModal({
  open,
  onClose,
  children,
  title,
  maxWidth = "max-w-md",
  closeOnBackdropClick = true,
  closeOnEsc = true,
  backdropClassName = "bg-black/70",
  padding = "p-6",
  showCloseButton = true,
  containerClassName = "",
  backdropContainerClassName = "",
}: BaseModalProps) {
  // ✅ Hooks תמיד למעלה, בלי תנאים

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose]
  );

  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, closeOnEsc, onClose]);

  // ❗ רק כאן עושים תנאי
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 sm:top-16 ${backdropClassName} backdrop-blur-sm flex justify-center items-start sm:items-center z-50 p-4 transition-all duration-200 ${backdropContainerClassName}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={`bg-neutral-900 rounded-2xl w-full ${maxWidth} relative shadow-xl ${padding} max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-6rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 ${containerClassName}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-3 left-3 text-neutral-400 hover:text-white transition-colors p-1 hover:bg-neutral-800 rounded-md z-10"
            aria-label="Close modal"
            type="button"
          >
            <X size={20} />
          </button>
        )}

        {title && (
          <h2 id="modal-title" className="sr-only">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
