/**
 * Accessibility Statement Page
 *
 * Israeli Standard ת״י 5568 / WCAG 2.0 AA Compliant
 *
 * Public page documenting the site's accessibility features and compliance
 */

import { useDocumentTitle } from "@/modules/shared/hooks/useDocumentTitle";

export default function AccessibilityStatement() {
  useDocumentTitle("הצהרת נגישות");

  return (
    <article className="min-h-screen text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <header className="space-y-4 border-b border-neutral-800 pb-6">
          <h1 className="text-4xl font-bold text-neutral-100">הצהרת נגישות</h1>
          <p className="text-neutral-300 text-lg">
            Ari Stage מחויבת להנגשת השירותים הדיגיטליים שלה לכלל האוכלוסייה,
            כולל אנשים עם מוגבלויות.
          </p>
        </header>

        {/* Compliance Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">רמת תאימות</h2>
          <div className="bg-neutral-850 rounded-2xl p-6 space-y-3">
            <p className="text-neutral-200">
              אתר זה עומד בדרישות התקן הישראלי{" "}
              <strong className="text-brand-primary">ת״י 5568</strong> (התאמה
              לנגישות תכנים באינטרנט ברמה AA) ותואם את הנחיות ה-
              <strong className="text-brand-primary">WCAG 2.0</strong> ברמה AA.
            </p>
            <p className="text-neutral-300 text-sm">
              עדכון אחרון: <time dateTime="2026-02">פברואר 2026</time>
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            תכונות נגישות באתר
          </h2>
          <ul className="space-y-3" role="list">
            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                🎹 ניווט מקלדת מלא
              </h3>
              <p className="text-neutral-300 text-sm">
                כל הפונקציות באתר נגישות באמצעות מקלדת בלבד. השתמש במקש Tab
                לניווט בין אלמנטים, Enter או רווח להפעלה, ו-Esc לסגירת חלונות.
              </p>
            </li>

            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                👁️ סמני מיקוד ברורים
              </h3>
              <p className="text-neutral-300 text-sm">
                כל האלמנטים האינטראקטיביים מסומנים בבירור כאשר הם במיקוד, כך
                שמשתמשי מקלדת יכולים לדעת איפה הם נמצאים.
              </p>
            </li>

            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                🔊 תמיכה בקוראי מסך
              </h3>
              <p className="text-neutral-300 text-sm">
                האתר תומך בקוראי מסך מובילים כמו NVDA, JAWS, ו-VoiceOver. כל
                התכנים, הפעולות וההודעות מוכרזות כראוי.
              </p>
            </li>

            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                📝 תוויות וטפסים נגישים
              </h3>
              <p className="text-neutral-300 text-sm">
                כל שדות הטופס מתוייגים בצורה ברורה, הודעות שגיאה מוכרזות מיידית,
                והוראות למילוי מסופקות לפני כל שדה.
              </p>
            </li>

            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                ↔️ תמיכה בRTL ו-LTR
              </h3>
              <p className="text-neutral-300 text-sm">
                האתר תומך בעברית (RTL) ובאנגלית (LTR) עם התאמה אוטומטית של
                כיווניות התצוגה והמבנה.
              </p>
            </li>

            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                ⏩ דילוג לתוכן
              </h3>
              <p className="text-neutral-300 text-sm">
                קישור "דלג לתוכן הראשי" מופיע בתחילת כל עמוד, מאפשר למשתמשי
                מקלדת לדלג ישירות לתוכן העיקרי ללא צורך לעבור את התפריט.
              </p>
            </li>

            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                🎨 ניגודיות צבעים
              </h3>
              <p className="text-neutral-300 text-sm">
                כל הצבעים באתר עומדים בדרישות הניגודיות של WCAG 2.0 ברמה AA,
                ומבטיחים קריאות מירבית.
              </p>
            </li>

            <li className="bg-neutral-850 rounded-xl p-4">
              <h3 className="font-semibold text-neutral-100 mb-2">
                🍪 בקרת עוגיות
              </h3>
              <p className="text-neutral-300 text-sm">
                המשתמשים יכולים לבחור האם לאשר או לדחות שימוש בעוגיות, ולשנות את
                ההעדפה בכל עת דרך הגדרות העוגיות בתחתית העמוד.
              </p>
            </li>
          </ul>
        </section>

        {/* Technology Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            טכנולוגיות נגישות
          </h2>
          <div className="bg-neutral-850 rounded-2xl p-6">
            <p className="text-neutral-300 leading-relaxed">
              האתר בנוי עם טכנולוגיות מודרניות התומכות בנגישות:
            </p>
            <ul className="mt-4 space-y-2 text-neutral-300 list-disc list-inside">
              <li>HTML5 סמנטי עם landmarks מוגדרים</li>
              <li>ARIA attributes לשיפור חוויית קוראי מסך</li>
              <li>Focus management לחלונות וטפסים</li>
              <li>Live regions להודעות דינמיות</li>
              <li>Keyboard traps במודלים</li>
            </ul>
          </div>
        </section>

        {/* Known Issues Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">
            בעיות ידועות ושיפורים עתידיים
          </h2>
          <div className="bg-neutral-850 rounded-2xl p-6">
            <p className="text-neutral-300 leading-relaxed">
              אנו עובדים באופן מתמיד על שיפור הנגישות של האתר. כרגע אין בעיות
              נגישות ידועות המונעות שימוש באתר. אם נתקלת בבעיה, נשמח לשמוע ממך.
            </p>
          </div>
        </section>

        {/* Testing Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">בדיקות נגישות</h2>
          <div className="bg-neutral-850 rounded-2xl p-6">
            <p className="text-neutral-300 leading-relaxed mb-4">
              האתר נבדק עם:
            </p>
            <ul className="space-y-2 text-neutral-300 list-disc list-inside">
              <li>קוראי מסך: NVDA, JAWS, VoiceOver</li>
              <li>כלי בדיקה אוטומטיים: axe DevTools, WAVE</li>
              <li>בדיקות מקלדת מלאה</li>
              <li>בדיקות ניגודיות צבעים</li>
              <li>בדיקות עם משתמשים עם מוגבלויות</li>
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-100">צור קשר</h2>
          <div className="bg-neutral-850 rounded-2xl p-6 space-y-4">
            <p className="text-neutral-300 leading-relaxed">
              אם נתקלת בבעיית נגישות באתר, או אם יש לך הצעות לשיפור, נשמח לשמוע
              ממך:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 min-w-[80px]">אימייל:</span>
                <a
                  href="mailto:accessibility@aristage.com"
                  className="text-brand-primary hover:underline focus:underline"
                >
                  accessibility@aristage.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 min-w-[80px]">טלפון:</span>
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
              אנו מתחייבים להשיב לכל פנייה תוך 5 ימי עסקים ולטפל בבעיות נגישות
              בהקדם האפשרי.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-800 pt-6">
          <p className="text-neutral-400 text-sm text-center">
            הצהרת נגישות זו עודכנה לאחרונה ב-
            <time dateTime="2026-02" className="font-semibold">
              {" "}
              פברואר 2026
            </time>
          </p>
        </footer>
      </div>
    </article>
  );
}
