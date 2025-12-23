import React from "react";
import ToastProvider from "@/modules/shared/components/ToastProvider.tsx";
import AppBootstrap from "./app/AppBootstrap.tsx";

export default function App(): JSX.Element {
  return (
    <ToastProvider>
      <AppBootstrap />
    </ToastProvider>
  );
}
