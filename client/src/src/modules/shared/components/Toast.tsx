import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

export default function Toast({ message, type = "success", duration = 2300 }: ToastProps): JSX.Element {
  const [visible, setVisible] = useState<boolean>(false);
  const isError = type === "error";

  useEffect(() => {
    // כניסה למטה
    setTimeout(() => setVisible(true), 10);

    // יציאה למעלה
    const hideTimeout = setTimeout(() => setVisible(false), duration - 300);

    return () => clearTimeout(hideTimeout);
  }, [duration]);

  return (
    <div
      className={`
        fixed left-1/2 -translate-x-1/2 z-50
        px-4 py-2
        rounded-xl
        backdrop-blur-xl border shadow-lg
        flex items-center gap-2
        text-xs font-medium
        transition-all duration-500 ease-out

        ${visible ? "top-6 opacity-100" : "top-[-60px] opacity-0"}

        ${
          isError
            ? "bg-red-500/25 border-red-400/40 text-red-300"
            : "bg-brand-orange/25 border-brand-orange/40 text-brand-orange"
        }
      `}
    >
      {isError ? (
        <AlertTriangle size={16} className="text-red-300" />
      ) : (
        <CheckCircle size={16} className="text-brand-orange" />
      )}
      <span>{message}</span>
    </div>
  );
}
