import React from "react";
import Footer from "@/modules/shared/components/Footer.tsx";
import Header from "@/modules/shared/components/Header.tsx";
import BottomNav from "@/modules/shared/components/BottomNav.tsx";

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
}: AppLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col lg:flex-row">
      {/* 🟧 Impersonation banner */}
      {isImpersonating && (
        <div
          className="w-full bg-gradient-to-r from-amber-400/80 via-orange-500/90 to-amber-400/80
          text-black py-2 px-4 text-center font-semibold 
          flex flex-col sm:flex-row items-center justify-center gap-3
          shadow-lg backdrop-blur-md sticky top-0 z-50 border-b border-orange-400/40 lg:order-1"
        >
          <span>
            🎭 אתה כרגע מייצג את:{" "}
            <strong>{currentUser.full_name || "משתמש לא מזוהה"}</strong>
          </span>

          <button
            onClick={onExitImpersonation}
            className="bg-black/30 hover:bg-black/40 transition px-3 py-1 rounded-lg
            text-white font-bold text-sm border border-black/20 shadow-sm"
          >
            חזרה לחשבון המקורי
          </button>
        </div>
      )}

      {/* Sidebar removed per request */}

      {/* MAIN LAYOUT - Flex column for header, content, footer */}
      <div className="flex-1 flex flex-col">
        {/* Header - Fixed top */}
        <Header />

        {/* Main content - Scrollable; offset for header/footer */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 pt-16 pb-20 md:pb-0">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>

        {/* Footer - Fixed bottom */}
        <Footer />
      </div>

      {/* Bottom nav for mobile */}
      {!hideNav && <BottomNav />}
    </div>
  );
}
