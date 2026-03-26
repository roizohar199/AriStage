import React, { useEffect, useRef } from "react";
import Footer from "@/modules/shared/components/Footer.tsx";
import Header from "@/modules/shared/components/Header.tsx";
import SubscriptionBanner from "@/modules/shared/components/SubscriptionBanner.tsx";
import { useCurrentUser } from "@/modules/shared/hooks/useCurrentUser.ts";
import {
  resolveDirFromLocale,
  resolveEffectiveLocaleFromUser,
  resolveScrollbarContainerDirFromLocale,
} from "@/modules/shared/lib/locale";
import SkipLink from "@/modules/shared/components/a11y/SkipLink";
import RouteAnnouncer from "@/modules/shared/components/a11y/RouteAnnouncer";
import { useTranslation } from "@/hooks/useTranslation.ts";

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  subscription_type?: string;
}

interface AppLayoutProps {
  isImpersonating: boolean;
  currentUser: User;
  onExitImpersonation: () => void;
  children: React.ReactNode;
}

export default function AppLayout({
  isImpersonating,
  currentUser,
  onExitImpersonation,
  children,
}: AppLayoutProps) {
  const { t } = useTranslation();
  const scrollAreaRef = useRef<HTMLElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useCurrentUser();
  const isAuthenticated = !!user?.id;
  const effectiveLocale = resolveEffectiveLocaleFromUser(user);

  useEffect(() => {
    const mainEl = scrollAreaRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      mainEl.classList.add("scrolling");
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        mainEl.classList.remove("scrolling");
      }, 1500);
    };

    mainEl.addEventListener("scroll", handleScroll);

    return () => {
      mainEl.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      mainEl.classList.remove("scrolling");
    };
  }, []);

  return (
    <div className="h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Accessibility: Skip to main content link (first focusable element) */}
      <SkipLink />

      {/* Accessibility: Route announcer for screen readers */}
      <RouteAnnouncer />

      {/* 🟧 Impersonation banner */}
      {isImpersonating && (
        <div
          className="w-full bg-brand-primary text-neutral-100 py-2 px-4 text-center font-semibold 
          flex flex-col sm:flex-row items-center justify-center gap-3
          shadow-lg sticky top-0 z-50 lg:order-1"
        >
          <span>
            {t("appLayout.impersonation.bannerPrefix")}{" "}
            <strong>
              {currentUser.full_name ||
                t("appLayout.impersonation.unknownUser")}
            </strong>
          </span>

          <button
            onClick={onExitImpersonation}
            className="bg-neutral-800/50 transition px-3 py-1 rounded-2xl
            text-neutral-100 font-bold text-sm 0 shadow-sm"
          >
            {t("appLayout.impersonation.backToOriginalButton")}
          </button>
        </div>
      )}

      {/* Sidebar removed per request */}

      {/* Header - Fixed top */}
      {isAuthenticated && (
        <header role="banner">
          <Header />
        </header>
      )}

      {/* Main content */}
      <main
        id="main-content"
        ref={scrollAreaRef}
        role="main"
        aria-label={t("appLayout.mainContentAriaLabel")}
        dir={resolveScrollbarContainerDirFromLocale(effectiveLocale)}
        className={`flex-1 overflow-y-auto overflow-x-hidden relative app-scroll bg-neutral-950 ${window.innerWidth >= 768 ? "pt-16 pb-0" : "pt-0 pb-20"}`}
      >
        <div dir={resolveDirFromLocale(effectiveLocale)} className="w-full">
          <SubscriptionBanner />
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>

          {/* Footer - Fixed bottom */}
          <Footer />
        </div>
      </main>
    </div>
  );
}
