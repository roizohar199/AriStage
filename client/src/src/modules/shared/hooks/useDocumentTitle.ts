/**
 * useDocumentTitle Hook
 *
 * Israeli Standard ת״י 5568 / WCAG 2.0 AA Compliant
 *
 * Updates document title for screen readers and browser tab
 * Helps users understand which page they're on
 */

import { useEffect } from "react";

export function useDocumentTitle(
  title: string,
  suffix: string = "Ari Stage",
): void {
  useEffect(() => {
    const previousTitle = document.title;

    if (title) {
      document.title = `${title} | ${suffix}`;
    } else {
      document.title = suffix;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
}
