# Translation System Documentation

## קבצי תרגום (Translation Files)

המערכת תומכת כעת בתרגום מלא לעברית ואנגלית.

### מיקום הקבצים

- **עברית**: `client/src/src/locales/he.ts`
- **אנגלית**: `client/src/src/locales/en.ts`
- **Index**: `client/src/src/locales/index.ts`
- **Hook**: `client/src/src/hooks/useTranslation.ts`

### מבנה התרגומים

התרגומים מאורגנים לפי מודולים:

```typescript
{
  common: { save, cancel, delete, ... },
  nav: { home, songs, lineups, ... },
  auth: { login, register, ... },
  songs: { title, addSong, ... },
  lineups: { title, addLineup, ... },
  artists: { title, inviteArtist, ... },
  admin: { title, dashboard, ... },
  settings: { title, profile, ... },
  systemSettings: { i18n, defaultLocale, ... },
  charts: { title, uploadChart, ... },
  lyrics: { title, addLyrics, ... },
  files: { title, upload, ... },
  errors: { generic, networkError, ... },
  success: { saved, updated, ... },
  billing: { subscription, plan, ... },
  offline: { title, message, ... },
  time: { now, today, ... },
  a11y: { skipToContent, ... }
}
```

## שימוש בקומפוננטות (Component Usage)

### שיטה 1: שימוש ב-Hook

```tsx
import { useTranslation } from "@/hooks/useTranslation";

function MyComponent() {
  const { t, translations, locale, isRTL } = useTranslation();

  return (
    <div>
      <h1>{t("common.save")}</h1>
      <button>{translations.common.cancel}</button>
      <p>Current locale: {locale}</p>
      <p>Direction: {isRTL ? "RTL" : "LTR"}</p>
    </div>
  );
}
```

### שיטה 2: גישה ישירה לתרגומים

```tsx
import { he, en } from "@/locales";
import { getDocumentLocale } from "@/modules/shared/lib/locale";

function MyComponent() {
  const locale = getDocumentLocale();
  const t = locale === "en-US" ? en : he;

  return <button>{t.common.save}</button>;
}
```

### שיטה 3: פונקציית תרגום עם נתיב (Translation Path)

```tsx
import { useTranslation } from "@/hooks/useTranslation";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      {/* גישה עם נתיב מחרוזת */}
      <h1>{t("songs.title")}</h1>
      <button>{t("songs.addSong")}</button>
      <p>{t("songs.noSongs")}</p>

      {/* עם fallback */}
      <span>{t("some.missing.key", "Default Text")}</span>
    </div>
  );
}
```

## דוגמאות מעשיות

### דוגמה 1: טופס הוספת שיר

```tsx
import { useTranslation } from "@/hooks/useTranslation";

function AddSongForm() {
  const { t } = useTranslation();

  return (
    <form>
      <input placeholder={t("songs.songTitle")} />
      <input placeholder={t("songs.artist")} />
      <input placeholder={t("songs.bpm")} type="number" />
      <button type="submit">{t("common.save")}</button>
      <button type="button">{t("common.cancel")}</button>
    </form>
  );
}
```

### דוגמה 2: הודעות שגיאה והצלחה

```tsx
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/modules/shared/components/ToastProvider";

function MyComponent() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await api.post("/songs", data);
      showToast(t("songs.songAdded"), "success");
    } catch (error) {
      showToast(t("errors.saveFailed"), "error");
    }
  };

  return <button onClick={handleSave}>{t("common.save")}</button>;
}
```

### דוגמה 3: תפריט ניווט

```tsx
import { useTranslation } from "@/hooks/useTranslation";
import { NavLink } from "react-router-dom";
import { Home, Music, ListMusic, Users } from "lucide-react";

function Navigation() {
  const { t } = useTranslation();

  const navItems = [
    { to: "/home", label: t("nav.home"), icon: <Home /> },
    { to: "/my", label: t("nav.my"), icon: <Music /> },
    { to: "/lineups", label: t("nav.lineups"), icon: <ListMusic /> },
    { to: "/artists", label: t("nav.artists"), icon: <Users /> },
  ];

  return (
    <nav>
      {navItems.map((item) => (
        <NavLink key={item.to} to={item.to}>
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

### דוגמה 4: אישורים (Confirmations)

```tsx
import { useTranslation } from "@/hooks/useTranslation";
import { useConfirm } from "@/modules/shared/confirm/useConfirm";

function SongList({ songs, onDelete }) {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const handleDelete = async (song) => {
    const ok = await confirm({
      title: t("songs.deleteSong"),
      message: t("songs.confirmDelete"),
    });

    if (ok) {
      await onDelete(song.id);
    }
  };

  return (
    <div>
      {songs.map((song) => (
        <div key={song.id}>
          <span>{song.title}</span>
          <button onClick={() => handleDelete(song)}>
            {t("common.delete")}
          </button>
        </div>
      ))}
    </div>
  );
}
```

## הוספת תרגומים חדשים

### 1. עדכן את קבצי התרגום

**he.ts:**

```typescript
export const he = {
  // ...existing translations
  myNewModule: {
    title: "מודול חדש",
    action: "פעולה",
    description: "תיאור",
  },
};
```

**en.ts:**

```typescript
export const en = {
  // ...existing translations
  myNewModule: {
    title: "New Module",
    action: "Action",
    description: "Description",
  },
};
```

### 2. השתמש בתרגום החדש

```tsx
function MyNewComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("myNewModule.title")}</h1>
      <p>{t("myNewModule.description")}</p>
      <button>{t("myNewModule.action")}</button>
    </div>
  );
}
```

## שיפורים עתידיים

1. **טעינה דינמית** - lazy loading של קבצי תרגום
2. **תרגומים חסרים** - מערכת דיווח על מפתחות חסרים
3. **פלורליזציה** - תמיכה בצורות רבים (1 item, 2 items, etc.)
4. **אינטרפולציה** - משתנים בתרגומים (`Hello {{name}}`)
5. **תרגום תאריכים** - פורמט תאריכים לפי locale
6. **מספרים** - פורמט מספרים (1,000 vs 1.000)

## טיפים

1. **שמירה על עקביות** - השתמש באותן מילות מפתח על פני הקומפוננטות
2. **קבצים קטנים** - שקול פיצול לקבצים נוספים אם הם גדלים מדי
3. **Type Safety** - TypeScript מספק autocompletion לנתיבי תרגום
4. **Fallbacks** - תמיד ספק fallback למקרה שתרגום חסר
5. **תיעוד** - עדכן את המדריך הזה כשמוסיפים מודולים חדשים

## בעיות נפוצות

### בעיה: תרגום לא מופיע

**פתרון**: ודא ש-SystemSettingsProvider עטוף סביב הקומפוננטה

### בעיה: Locale לא מתעדכן

**פתרון**: ודא שקראת ל-`applyLocaleFromUser` או `applyDocumentLocale`

### בעיה: TypeScript מתלונן על נתיבים

**פתרון**: השתמש ב-`t("path.to.key", "fallback")` עם fallback
