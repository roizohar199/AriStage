import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Toast from "./Toast.tsx";
import { onToast } from "@/modules/shared/lib/toastBus.js";

interface ToastData {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastContextType {
  showToast: (message: string, type?: ToastData["type"]) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const [toast, setToast] = useState<ToastData | null>(null);

  function showToast(message: string, type: ToastData["type"] = "success"): void {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  // מאזין ל-toastBus
  useEffect(() => {
    onToast((msg: string, type: ToastData["type"]) => showToast(msg, type));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </ToastContext.Provider>
  );
}
