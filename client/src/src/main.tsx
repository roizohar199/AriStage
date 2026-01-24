import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/modules/shared/contexts/AuthContext.tsx";
import App from "./App.tsx";
import "./styles/index.css";
import { registerSW } from "virtual:pwa-register";
import { emitToast } from "@/modules/shared/lib/toastBus";
import { applyLocaleFromUser } from "@/modules/shared/lib/locale";

// ✅ מוסיף את future flags כדי להעלים את האזהרות של React Router
const container = document.getElementById("root")!;
const root = createRoot(container);

// Apply initial locale before React renders (so layout is consistent on first paint)
try {
  const stored = JSON.parse(localStorage.getItem("ari_user") || "{}") as any;
  applyLocaleFromUser(stored);
} catch {
  applyLocaleFromUser(null);
}

registerSW({
  immediate: true,
  onOfflineReady() {
    emitToast("✅ האפליקציה מוכנה לשימוש Offline", "success");
  },
});

root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
