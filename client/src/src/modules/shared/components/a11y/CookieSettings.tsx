/**
 * CookieSettings Component
 *
 * Israeli Standard ת״י 5568 / WCAG 2.0 AA Compliant
 *
 * Allows users to view and change their cookie consent preferences
 * Can be triggered from footer link
 */

import { useEffect, useState } from "react";
import BaseModal from "@/modules/shared/components/BaseModal";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";

const STORAGE_KEY = "cookieConsent";

interface CookieSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookieSettings({
  isOpen,
  onClose,
}: CookieSettingsProps) {
  const [currentConsent, setCurrentConsent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const consent = localStorage.getItem(STORAGE_KEY);
      setCurrentConsent(consent);
    }
  }, [isOpen]);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setCurrentConsent("accepted");

    // Announce change
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = "העדפות עוגיות עודכנו - שימוש בעוגיות מאושר";
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
      onClose();
    }, 1000);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setCurrentConsent("declined");

    // Announce change
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = "העדפות עוגיות עודכנו - שימוש בעוגיות נדחה";
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
      onClose();
    }, 1000);
  };

  return (
    <BaseModal open={isOpen} onClose={onClose} title="הגדרות עוגיות">
      <div className="space-y-6 p-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-100">
            העדפות נוכחיות
          </h3>
          <div className="bg-neutral-900 rounded-lg p-4">
            <p className="text-neutral-300">
              {currentConsent === "accepted" && "✓ שימוש בעוגיות מאושר"}
              {currentConsent === "declined" && "✗ שימוש בעוגיות נדחה"}
              {!currentConsent && "לא נקבעה העדפה"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-neutral-100">
            מה זה אומר?
          </h3>
          <p className="text-neutral-300 text-sm leading-relaxed">
            עוגיות הן קבצים קטנים שנשמרים במחשב שלך ומאפשרים לאתר לזכור את
            ההעדפות שלך, לנתח את השימוש באתר ולשפר את חוויית המשתמש. אתה יכול
            לבחור לאשר או לדחות את השימוש בעוגיות.
          </p>
        </div>

        <div className="flex gap-3 flex-row-reverse pt-4 border-t border-neutral-800">
          <DesignActionButton
            onClick={handleAccept}
            variant="primary"
            type="button"
          >
            אישור שימוש בעוגיות
          </DesignActionButton>
          <DesignActionButton
            onClick={handleDecline}
            variant="cancel"
            type="button"
          >
            דחיית שימוש בעוגיות
          </DesignActionButton>
        </div>
      </div>
    </BaseModal>
  );
}
