import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

export default function Toast({
  message,
  type = "success",
  duration = 2300,
}: ToastProps): JSX.Element {
  const [visible, setVisible] = useState<boolean>(false);
  const isError = type === "error";

  useEffect(() => {
    // כניסה למטה
    setTimeout(() => setVisible(true), 10);

    // יציאה למעלה
    const hideTimeout = setTimeout(() => setVisible(false), duration - 220);

    return () => clearTimeout(hideTimeout);
  }, [duration]);

  return (
    <div className="fixed left-1/2 top-6 -translate-x-1/2 z-[9999]">
      <div
        // Semantic animation: toast uses enter/exit tokens (transform+opacity only)
        className={`
          px-4 py-2
          rounded-2xl
          backdrop-blur-xl shadow-lg
          flex items-center gap-2
          text-xs font-medium

          ${visible ? "animation-enter" : "animation-exit"}

          ${isError ? "text-red-600" : "text-brand-primary"}
        `}
      >
        {isError ? (
          <AlertTriangle size={16} className="text-red-600" />
        ) : (
          <CheckCircle size={16} className="text-brand-primary" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
