import React, { useEffect, useCallback, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
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
  lockScroll = false,
  backdropClassName = "bg-black/70",
  padding = "p-6",
  showCloseButton = true,
  containerClassName = "",
  backdropContainerClassName = "",
}: BaseModalProps) {
  // ✅ Hooks תמיד למעלה, בלי תנאים

  const scrollTimeoutRef = useRef<number | null>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose],
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

  useEffect(() => {
    if (!open || !lockScroll) return;
    if (typeof document === "undefined") return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, lockScroll]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.classList.add("scrolling");
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      el.classList.remove("scrolling");
    }, 800);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // ❗ רק כאן עושים תנאי
  if (!open) return null;

  if (typeof document === "undefined") return null;

  const modal = (
    <div
      className={`fixed inset-0 ${backdropClassName} flex justify-center items-center z-[1000] p-4 ${backdropContainerClassName}`}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        // Semantic animation: modals use `animation-overlay`
        className={`bg-neutral-850 rounded-2xl w-full ${maxWidth} relative shadow-xl ${padding} max-h-[calc(100dvh-2rem)] overflow-y-auto app-scroll animation-overlay ${containerClassName}`}
        onClick={(e) => e.stopPropagation()}
        onScroll={handleScroll}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            // Semantic animation: buttons use `animation-press`
            className="absolute top-3 left-3 text-neutral-100 hover:text-neutral-300 transition-colors p-1 hover:bg-neutral-800 rounded-md z-10 transition"
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

  return createPortal(modal, document.body);
}
