/**
 * Accessibility Statement Page
 *
 * Israeli Standard ת״י 5568 / WCAG 2.0 AA Compliant
 *
 * Public page documenting the site's accessibility features and compliance
 */

import { useDocumentTitle } from "@/modules/shared/hooks/useDocumentTitle";
import { useTranslation } from "@/hooks/useTranslation.ts";

export default function AccessibilityStatement() {
  const { t, translations } = useTranslation();
  const accessibility = translations.accessibility;

  useDocumentTitle(t("accessibility.title"));

  return (
    <article className="min-h-screen text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-4 border-b border-neutral-800 pb-6">
          <h1 className="text-4xl font-bold text-neutral-100">
            {accessibility.title}
          </h1>
          <p className="text-neutral-300 text-lg">{accessibility.intro}</p>
        </header>

        {/* Compliance Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            {accessibility.compliance.title}
          </h2>
          <div className="bg-neutral-850 rounded-2xl p-6 space-y-3">
            <p className="text-neutral-200">
              {accessibility.compliance.description}
            </p>
            <p className="text-neutral-300 text-sm">
              {accessibility.compliance.lastUpdatedLabel}{" "}
              <time dateTime={accessibility.compliance.lastUpdatedDateTime}>
                {accessibility.compliance.lastUpdatedText}
              </time>
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            {accessibility.features.title}
          </h2>
          <ul className="space-y-3" role="list">
            {accessibility.features.items.map((item) => (
              <li key={item.title} className="bg-neutral-850 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-100 mb-2">
                  {item.icon} {item.title}
                </h3>
                <p className="text-neutral-300 text-sm">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Technology Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            {accessibility.technologies.title}
          </h2>
          <div className="bg-neutral-850 rounded-2xl p-6">
            <p className="text-neutral-300 leading-relaxed">
              {accessibility.technologies.intro}
            </p>
            <ul className="mt-4 space-y-2 text-neutral-300 list-disc list-inside">
              {accessibility.technologies.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Known Issues Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            {accessibility.knownIssues.title}
          </h2>
          <div className="bg-neutral-850 rounded-2xl p-6">
            <p className="text-neutral-300 leading-relaxed">
              {accessibility.knownIssues.description}
            </p>
          </div>
        </section>

        {/* Testing Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            {accessibility.testing.title}
          </h2>
          <div className="bg-neutral-850 rounded-2xl p-6">
            <p className="text-neutral-300 leading-relaxed mb-4">
              {accessibility.testing.intro}
            </p>
            <ul className="space-y-2 text-neutral-300 list-disc list-inside">
              {accessibility.testing.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            {accessibility.contact.title}
          </h2>
          <div className="bg-neutral-850 rounded-2xl p-6 space-y-4">
            <p className="text-neutral-300 leading-relaxed">
              {accessibility.contact.intro}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 min-w-[80px]">
                  {accessibility.contact.emailLabel}
                </span>
                <a
                  href="mailto:accessibility@aristage.com"
                  className="text-brand-primary hover:underline focus:underline"
                >
                  accessibility@aristage.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 min-w-[80px]">
                  {accessibility.contact.phoneLabel}
                </span>
                <a
                  href="tel:+972-50-000-0000"
                  className="text-brand-primary hover:underline focus:underline"
                  dir="ltr"
                >
                  050-000-0000
                </a>
              </div>
            </div>
            <p className="text-neutral-400 text-sm pt-4 border-t border-neutral-800">
              {accessibility.contact.responseCommitment}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-800 pt-6">
          <p className="text-neutral-400 text-sm text-center">
            {accessibility.footer.lastUpdatedPrefix}
            <time
              dateTime={accessibility.footer.lastUpdatedDateTime}
              className="font-semibold"
            >
              {accessibility.footer.lastUpdatedText}
            </time>
          </p>
        </footer>
      </div>
    </article>
  );
}
