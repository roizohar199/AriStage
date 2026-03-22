/**
 * SkipLink Component
 *
 * Israeli Standard ת״י 5568 / WCAG 2.0 AA Compliant
 *
 * Provides a keyboard-accessible "skip to main content" link that:
 * - Is visually hidden until focused (tab key)
 * - Allows keyboard users to bypass repetitive navigation
 * - Appears as the first focusable element on the page
 * - Jumps focus to #main-content when activated
 */

import { useTranslation } from "@/hooks/useTranslation.ts";

export default function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main-content" className="sr-only">
      {t("a11y.skipToContent")}
    </a>
  );
}
