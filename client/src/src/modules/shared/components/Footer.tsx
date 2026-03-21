import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation.ts";

// Pure presentational footer: small, non-intrusive, dark-theme friendly.
// Enhanced with accessibility links and cookie settings
export default function Footer() {
  const { t, translations } = useTranslation();
  const [openSection, setOpenSection] = useState<
    "about" | "support" | "terms" | "privacy" | null
  >(null);
  const footerTranslations = translations.footer;

  const sections = useMemo(
    () =>
      [
        {
          key: "about" as const,
          title: footerTranslations.about.title,
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              {footerTranslations.about.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p className="text-neutral-400">
                {footerTranslations.about.highlight}
              </p>
            </div>
          ),
        },
        {
          key: "support" as const,
          title: footerTranslations.support.title,
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              <p>{footerTranslations.support.intro}</p>
              <ul className="list-disc ps-5 space-y-1 text-neutral-300">
                {footerTranslations.support.quickSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
                <p className="text-neutral-200 font-medium">
                  {footerTranslations.support.fastHelpTitle}
                </p>
                <ul className="mt-2 list-disc ps-5 space-y-1 text-neutral-300">
                  {footerTranslations.support.fastHelpItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <p className="text-neutral-400">
                {footerTranslations.support.outro}
              </p>
            </div>
          ),
        },
        {
          key: "terms" as const,
          title: footerTranslations.terms.title,
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              <p className="text-neutral-200 font-medium">
                {footerTranslations.terms.summaryTitle}
              </p>
              <p>{footerTranslations.terms.intro}</p>
              <ul className="list-disc ps-5 space-y-1">
                {footerTranslations.terms.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="text-neutral-400">
                {footerTranslations.terms.outro}
              </p>
            </div>
          ),
        },
        {
          key: "privacy" as const,
          title: footerTranslations.privacy.title,
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              <p className="text-neutral-200 font-medium">
                {footerTranslations.privacy.summaryTitle}
              </p>
              <p>{footerTranslations.privacy.intro}</p>
              <ul className="list-disc ps-5 space-y-1">
                {footerTranslations.privacy.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="text-neutral-400">
                {footerTranslations.privacy.outro}
              </p>
            </div>
          ),
        },
      ] as const,
    [footerTranslations],
  );

  return (
    <footer
      className="w-full bg-neutral-900 px-4 sm:px-6 lg:px-8"
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl py-4">
        <div className="flex flex-col items-center justify-center gap-3">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            {sections.map((section) => {
              const isOpen = openSection === section.key;

              return (
                <button
                  key={section.key}
                  type="button"
                  className="text-neutral-300 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded"
                  aria-expanded={isOpen}
                  aria-controls={`footer-section-${section.key}`}
                  onClick={() =>
                    setOpenSection((prev) =>
                      prev === section.key ? null : section.key,
                    )
                  }
                >
                  {section.title}
                </button>
              );
            })}
          </nav>

          {/* Accessibility and Cookie links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
            aria-label={t("footer.navAriaLabel")}
          >
            <Link
              to="/accessibility"
              className="text-neutral-400 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded px-2 py-1"
            >
              {t("footer.accessibilityLink")}
            </Link>
            <button
              type="button"
              onClick={() => {
                // Trigger cookie settings modal via custom event
                window.dispatchEvent(new CustomEvent("open-cookie-settings"));
              }}
              className="text-neutral-400 hover:text-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded px-2 py-1"
            >
              {t("footer.cookieSettingsLink")}
            </button>
          </nav>

          {sections.map((section) => {
            const isOpen = openSection === section.key;
            if (!isOpen) return null;

            return (
              <div
                key={section.key}
                id={`footer-section-${section.key}`}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 text-start"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-neutral-100">
                    {section.title}
                  </h3>
                  <button
                    type="button"
                    className="text-neutral-400 hover:text-neutral-100 text-sm"
                    onClick={() => setOpenSection(null)}
                  >
                    {t("footer.closeSection")}
                  </button>
                </div>
                <div className="mt-3">{section.content}</div>
              </div>
            );
          })}

          <span className="text-neutral-500 text-sm text-center">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </span>
        </div>
      </div>
    </footer>
  );
}
