/**
 * TypeScript Global Type Definitions
 *
 * Defines global window interfaces for:
 * - Nagish.li accessibility toolbar
 * - Runtime configuration
 */

interface Window {
  /**
   * Nagish.li Configuration
   * @see https://nagish.li for documentation
   */
  NagishLiConfig?: {
    language?: "he" | "en" | "ar";
    position?: "br" | "bl" | "tr" | "tl"; // bottom-right, bottom-left, top-right, top-left
    statementLink?: string;
    [key: string]: any;
  };

  /**
   * Runtime configuration injected by Vite build process
   * Contains environment-specific settings
   */
  __RUNTIME__?: {
    NAGISHLI_ENABLED?: boolean;
    NAGISHLI_LANG?: "he" | "en" | "ar";
    NAGISHLI_POS?: "br" | "bl" | "tr" | "tl";
    [key: string]: any;
  };

  /**
   * Global function to open upgrade modal (existing)
   */
  openUpgradeModal?: (billingPeriod?: "monthly" | "yearly") => void;
}

// Extend global scope
declare global {
  interface Window {
    NagishLiConfig?: Window["NagishLiConfig"];
    __RUNTIME__?: Window["__RUNTIME__"];
    openUpgradeModal?: Window["openUpgradeModal"];
  }
}

export {};
