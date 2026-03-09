import React, { useEffect, useState } from "react";
import ToastProvider from "@/modules/shared/components/ToastProvider.tsx";
import { ConfirmProvider } from "@/modules/shared/confirm/ConfirmProvider.tsx";
import { FeatureFlagsProvider } from "@/modules/shared/contexts/FeatureFlagsContext.tsx";
import { SystemSettingsProvider } from "@/modules/shared/contexts/SystemSettingsContext.tsx";
import AppBootstrap from "./app/AppBootstrap.tsx";
import CookieConsent from "@/modules/shared/components/a11y/CookieConsent";
import CookieSettings from "@/modules/shared/components/a11y/CookieSettings";

export default function App(): JSX.Element {
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  useEffect(() => {
    // Listen for cookie settings open event from footer
    const handleOpenCookieSettings = () => {
      setShowCookieSettings(true);
    };

    window.addEventListener("open-cookie-settings", handleOpenCookieSettings);
    return () => {
      window.removeEventListener(
        "open-cookie-settings",
        handleOpenCookieSettings,
      );
    };
  }, []);

  return (
    <ToastProvider>
      <FeatureFlagsProvider>
        <SystemSettingsProvider>
          <ConfirmProvider>
            <AppBootstrap />

            {/* Accessibility: Cookie consent and settings */}
            <CookieConsent />
            <CookieSettings
              isOpen={showCookieSettings}
              onClose={() => setShowCookieSettings(false)}
            />
          </ConfirmProvider>
        </SystemSettingsProvider>
      </FeatureFlagsProvider>
    </ToastProvider>
  );
}
