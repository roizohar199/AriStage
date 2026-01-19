import React from "react";
import ToastProvider from "@/modules/shared/components/ToastProvider.tsx";
import { ConfirmProvider } from "@/modules/shared/confirm/ConfirmProvider.tsx";
import { FeatureFlagsProvider } from "@/modules/shared/contexts/FeatureFlagsContext.tsx";
import AppBootstrap from "./app/AppBootstrap.tsx";

export default function App(): JSX.Element {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <FeatureFlagsProvider>
          <AppBootstrap />
        </FeatureFlagsProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
