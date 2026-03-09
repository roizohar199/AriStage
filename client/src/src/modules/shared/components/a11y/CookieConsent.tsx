/**
 * CookieConsent Component
 *
 * Israeli Standard ת״י 5568 / WCAG 2.0 AA Compliant
 * Israeli Privacy Law Compliant
 *
 * Features:
 * - Appears automatically on first visit
 * - role="dialog" and aria-modal for screen readers
 * - Keyboard accessible (ESC to decline)
 * - Stores user choice in localStorage
 * - RTL-aware positioning
 */

import { useEffect, useState } from "react";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";

const STORAGE_KEY = "cookieConsent";

export function isAnalyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const consent = localStorage.getItem(STORAGE_KEY);
  return consent === "accepted";
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      // Show consent dialog after a brief delay
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Handle ESC key to decline
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDecline();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isVisible]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setIsVisible(false);

    // Announce to screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = "העדפות עוגיות נשמרו";
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setIsVisible(false);

    // Announce to screen readers
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = "העדפות עוגיות נשמרו";
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-999/50 backdrop-blur-sm z-[9998]"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-neutral-850 border-t border-neutral-700 shadow-overlay"
      >
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <div className="space-y-2">
            <h2
              id="cookie-consent-title"
              className="text-xl font-bold text-neutral-100"
            >
              שימוש בעוגיות
            </h2>
            <p
              id="cookie-consent-description"
              className="text-neutral-300 leading-relaxed"
            >
              אתר זה משתמש בעוגיות כדי לשפר את חוויית המשתמש, לנתח תנועה באתר
              ולספק תכנים מותאמים אישית. על ידי לחיצה על "אישור" אתה מסכים
              לשימוש בעוגיות. ניתן לשנות את ההעדפות בכל עת דרך קישור "הגדרות
              עוגיות" בתחתית העמוד.
            </p>
          </div>

          <div className="flex gap-3 flex-row-reverse">
            <DesignActionButton
              onClick={handleAccept}
              variant="primary"
              type="button"
            >
              אישור
            </DesignActionButton>
            <DesignActionButton
              onClick={handleDecline}
              variant="cancel"
              type="button"
            >
              ביטול
            </DesignActionButton>
          </div>
        </div>

        {/* Live region for announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </div>
    </>
  );
}
