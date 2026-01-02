import React, { useEffect, useRef, useState } from "react";
import Footer from "@/modules/shared/components/Footer.tsx";
import Header from "@/modules/shared/components/Header.tsx";
import BottomNav from "@/modules/shared/components/BottomNav.tsx";
import UpgradeModal from "@/modules/shared/components/UpgradeModal.tsx";
import { useCurrentUser } from "@/modules/shared/hooks/useCurrentUser.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";

declare global {
  interface Window {
    openUpgradeModal?: () => void;
  }
}

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
  hideNav: boolean;
  children: React.ReactNode;
}

export default function AppLayout({
  isImpersonating,
  currentUser,
  onExitImpersonation,
  hideNav,
  children,
}: AppLayoutProps) {
  const scrollAreaRef = useRef<HTMLElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useCurrentUser();
  const { subscriptionBlocked } = useAuth();
  const isAuthenticated = !!user?.id;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasShownUpgradeModalOnLoad, setHasShownUpgradeModalOnLoad] =
    useState(false);

  useEffect(() => {
    window.openUpgradeModal = () => setIsUpgradeModalOpen(true);
    return () => {
      delete window.openUpgradeModal;
    };
  }, []);

  // Open modal when subscription is blocked
  useEffect(() => {
    if (window.location.pathname === "/settings") return;
    if (subscriptionBlocked && isAuthenticated && !hasShownUpgradeModalOnLoad) {
      setIsUpgradeModalOpen(true);
      setHasShownUpgradeModalOnLoad(true);
    }
  }, [subscriptionBlocked, isAuthenticated, hasShownUpgradeModalOnLoad]);

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
    <div className="h-screen bg-neutral-950 text-white flex flex-col">
      {/* 🟧 Impersonation banner */}
      {isImpersonating && (
        <div
          className="w-full bg-brand-orange text-black py-2 px-4 text-center font-semibold 
          flex flex-col sm:flex-row items-center justify-center gap-3
          shadow-lg backdrop-blur-md sticky top-0 z-50 lg:order-1"
        >
          <span>
            אתה כרגע מייצג את:{" "}
            <strong>{currentUser.full_name || "משתמש לא מזוהה"}</strong>
          </span>

          <button
            onClick={onExitImpersonation}
            className="bg-neutral-800/50 transition px-3 py-1 rounded-2xl
            text-white font-bold text-sm 0 shadow-sm"
          >
            חזרה לחשבון המקורי
          </button>
        </div>
      )}

      {/* Sidebar removed per request */}

      {/* Header - Fixed top */}
      {isAuthenticated && <Header />}

      {/* Main content - Blur applied only when modal is open */}
      <main
        ref={scrollAreaRef}
        dir="ltr"
        className={`flex-1 overflow-y-auto relative app-scroll bg-neutral-900 pt-16 pb-20 md:pb-0 transition-all duration-300 ${
          isUpgradeModalOpen ? "blur-sm" : ""
        }`}
      >
        <div
          dir="rtl"
          onClickCapture={(e) => {
            if (window.location.pathname === "/settings") return;
            if (!subscriptionBlocked) return;

            e.preventDefault();
            e.stopPropagation();

            window.openUpgradeModal?.();
          }}
          className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          {children}
        </div>

        {/* Footer - Fixed bottom */}
        <Footer />
      </main>
      {/* Bottom nav for mobile */}
      {!hideNav && <BottomNav />}

      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        open={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
