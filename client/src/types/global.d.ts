/**
 * TypeScript Global Type Definitions
 *
 * Defines global window interfaces used across the client app.
 */

interface Window {
  /**
   * Global function to open upgrade modal (existing)
   */
  openUpgradeModal?: (billingPeriod?: "monthly" | "yearly") => void;
}

// Extend global scope
declare global {
  interface Window {
    openUpgradeModal?: Window["openUpgradeModal"];
  }
}

declare module "axios" {
  export interface AxiosRequestConfig<D = any> {
    skipErrorToast?: boolean;
  }
}

export {};
