import { useMemo, useState } from "react";

// Pure presentational footer: small, non-intrusive, dark-theme friendly.
export default function Footer() {
  const [openSection, setOpenSection] = useState<
    "about" | "support" | "terms" | "privacy" | null
  >(null);

  const sections = useMemo(
    () =>
      [
        {
          key: "about" as const,
          title: "אודות",
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              <p>
                Ari Stage היא פלטפורמה לניהול ותיאום תהליכים סביב הופעות, אמנים,
                שיתופים וקבצים—במקום אחד, בצורה פשוטה וברורה.
              </p>
              <p>
                המטרה שלנו היא לחסוך זמן בהתנהלות היומיומית: להוציא פחות הודעות,
                לאתר קבצים מהר, ולעבוד מסודר עם צוותים ואנשים שונים.
              </p>
              <p className="text-neutral-400">
                יש לך רעיון לשיפור? נשמח לשמוע בתפריט “תמיכה”.
              </p>
            </div>
          ),
        },
        {
          key: "support" as const,
          title: "תמיכה",
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              <p>צריכים עזרה? הנה כמה צעדים מהירים לפני שפונים:</p>
              <ul className="list-disc ps-5 space-y-1 text-neutral-300">
                <li>נסו לרענן את הדף (Ctrl+R).</li>
                <li>
                  אם מדובר בבעיה בטעינת נתונים, בדקו חיבור אינטרנט והתחברות
                  מחדש.
                </li>
                <li>
                  אם העלאת קובץ נכשלה, נסו שם קובץ באנגלית/מספרים וגודל קטן
                  יותר.
                </li>
              </ul>
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
                <p className="text-neutral-200 font-medium">
                  כדי שנוכל לעזור מהר:
                </p>
                <ul className="mt-2 list-disc ps-5 space-y-1 text-neutral-300">
                  <li>מה ניסית לעשות בדיוק?</li>
                  <li>מה הופיע על המסך (שגיאה/התנהגות)?</li>
                  <li>באיזה מכשיר/דפדפן?</li>
                </ul>
              </div>
              <p className="text-neutral-400">
                אם יש לכם ערוץ פנימי (וואטסאפ/מייל צוותי) – שלחו שם צילום מסך
                ותיאור קצר.
              </p>
            </div>
          ),
        },
        {
          key: "terms" as const,
          title: "תנאים",
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              <p className="text-neutral-200 font-medium">תנאי שימוש (תמצית)</p>
              <p>
                השימוש במערכת הוא “כמות שהוא” ונועד לסייע בניהול מידע, קבצים
                ותהליכים. אנחנו עושים מאמץ לשמור על זמינות ותקינות, אבל ייתכנו
                תקלות זמניות.
              </p>
              <ul className="list-disc ps-5 space-y-1">
                <li>
                  המשתמש אחראי על התכנים שהוא מעלה/משתף ועל הרשאות השיתוף.
                </li>
                <li>אין להעלות תוכן לא חוקי, פוגעני, או מפר זכויות יוצרים.</li>
                <li>ניתן לשנות, לעדכן או להסיר תכונות ושירותים מעת לעת.</li>
              </ul>
              <p className="text-neutral-400">
                רוצים שננסח תנאים משפטיים מלאים? מומלץ להתאים זאת לעו״ד בהתאם
                לשימוש העסקי שלכם.
              </p>
            </div>
          ),
        },
        {
          key: "privacy" as const,
          title: "פרטיות",
          content: (
            <div className="space-y-3 text-sm leading-6 text-neutral-300">
              <p className="text-neutral-200 font-medium">
                מדיניות פרטיות (תמצית)
              </p>
              <p>
                אנחנו שומרים מידע שנדרש להפעלת השירות: פרטי משתמש, הגדרות,
                ונתונים שאתם יוצרים במערכת (כמו קבצים/תוכן). אנו משתמשים במידע
                כדי לספק את השירות, לשפר אותו ולשמור על אבטחה.
              </p>
              <ul className="list-disc ps-5 space-y-1">
                <li>
                  שיתוף מידע מתבצע בהתאם להרשאות שהוגדרו (משתמשים/צוותים).
                </li>
                <li>
                  ייתכן שימוש ביומני מערכת לצורכי אבטחה, ניטור ותחקור תקלות.
                </li>
                <li>
                  ניתן לבקש מחיקה/ייצוא של מידע בהתאם למדיניות הארגון והחוק החל.
                </li>
              </ul>
              <p className="text-neutral-400">
                אם אתם צריכים ניסוח רשמי מלא (כולל עוגיות/מעקב), כדאי להוסיף
                סעיפים בהתאם לכלים שבהם אתם משתמשים בפועל.
              </p>
            </div>
          ),
        },
      ] as const,
    [],
  );

  return (
    <footer className="w-full bg-neutral-900 px-4 sm:px-6 lg:px-8">
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
                    סגור
                  </button>
                </div>
                <div className="mt-3">{section.content}</div>
              </div>
            );
          })}

          <span className="text-neutral-500 text-sm text-center">
            © {new Date().getFullYear()} Ari Stage. כל הזכויות שמורות.
          </span>
        </div>
      </div>
    </footer>
  );
}
