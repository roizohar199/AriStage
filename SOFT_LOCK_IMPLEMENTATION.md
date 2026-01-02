# Soft-Lock Implementation Guide

## מטרה

מנגנון Soft-Lock שמאפשר למשתמשים עם מנוי פג לצפות במערכת אך חוסם פעולות כתיבה.

## מה השתנה

### 1. ProtectedRoute

- **הוסר:** redirect ל-`/billing` בגלל `subscriptionBlocked`
- **תוצאה:** משתמשים עם token תקף תמיד נכנסים למערכת

### 2. Login

- **שונה:** `navigate("/my")` → `navigate("/")`
- **תוצאה:** המערכת מחליטה לאן להפנות (GuestOnlyRoute → /my)

### 3. AppBootstrap

- **הוסר:** `isBlockedMode` routing שהגביל גישה לדפים
- **תוצאה:** כל הדפים זמינים תמיד, גם למשתמשים חסומים

### 4. SubscriptionBanner (חדש)

נוצר רכיב חדש ב-`SubscriptionBanner.tsx`:

- מוצג מתחת ל-Header כאשר `subscriptionBlocked === true`
- מציג הודעה: "תקופת הניסיון הסתיימה • מחיר: 29 ₪ לחודש"
- כפתור "שדרג עכשיו" (placeholder)
- לא מוצג ל-admins

### 5. useGuardAction Hook (חדש)

נוצר hook ב-`useGuardAction.ts` לחסימת פעולות:

- בודק `subscriptionBlocked` לפני ביצוע פעולה
- Admins תמיד עוברים
- מציג הודעת אזהרה במקרה של חסימה
- מוכן לשילוב עם מערכת Toast

## איך משתמשים ב-useGuardAction

### דוגמה 1: פעולה פשוטה

\`\`\`tsx
import { useGuardAction } from "@/modules/shared/hooks/useGuardAction";

function MyComponent() {
const guardAction = useGuardAction();

const handleAddSong = guardAction(() => {
// Add song logic
console.log("Adding song...");
});

return (
<button onClick={handleAddSong}>
Add Song
</button>
);
}
\`\`\`

### דוגמה 2: עם הודעה מותאמת

\`\`\`tsx
const handleDeleteLineup = guardAction(
(lineupId: number) => {
api.delete(\`/lineups/\${lineupId}\`);
},
{
message: "מחיקת ליינאפ זמינה רק עם מנוי פעיל",
onBlocked: () => {
// Optional: custom logic when blocked
console.log("User tried to delete but is blocked");
}
}
);
\`\`\`

### דוגמה 3: פעולה async

\`\`\`tsx
const handleUploadChart = guardAction(async (file: File) => {
const formData = new FormData();
formData.append("chart", file);
await api.post("/songs/upload-chart", formData);
});
\`\`\`

## מה עדיין צריך לעשות

### 1. שילוב Toast

כרגע ה-guard מדפיס console.warn. צריך לשלב עם מערכת Toast:
\`\`\`tsx
// In useGuardAction.ts
import { emitToast } from "@/modules/shared/lib/toastBus";

// Replace console.warn with:
emitToast(message, "warning");
\`\`\`

### 2. החלת Guard על כפתורים קיימים

יש להוסיף את ה-guard לכל הכפתורים שמבצעים פעולות כתיבה:

- Add Song
- Edit Song
- Delete Song
- Upload Chart
- Create Lineup
- Edit Lineup
- Delete Lineup
- Invite User
- וכו'

### 3. UI Indication (אופציונלי)

אפשר להוסיף אינדיקציה ויזואלית לכפתורים חסומים:
\`\`\`tsx
const { subscriptionBlocked, user } = useAuth();
const isBlocked = subscriptionBlocked && user?.role !== "admin";

<button
onClick={handleAddSong}
className={\`\${isBlocked ? "opacity-50 cursor-not-allowed" : ""}\`}

> Add Song {isBlocked && "🔒"}
> </button>
> \`\`\`

### 4. תהליך תשלום

צריך ליישם את הלוגיקה בכפתור "שדרג עכשיו" ב-SubscriptionBanner:

- ניווט לדף תשלום
- שילוב עם Payment Gateway
- עדכון מצב מנוי אחרי תשלום

## תזרים משתמש - Before vs After

### Before (לא עובד)

1. משתמש מתחבר
2. token + 402 → subscriptionBlocked = true
3. ProtectedRoute → redirect to /billing
4. נתקע על מסך Login (loop)

### After (עובד)

1. משתמש מתחבר
2. token + 402 → subscriptionBlocked = true
3. נכנס למערכת (/my)
4. רואה Banner למעלה
5. רואה את כל הנתונים (Songs, Lineups)
6. כפתורי פעולה חסומים (ידנית עם useGuardAction)
7. יכול לשדרג או לצפות בלבד

## אימות המימוש

✅ משתמש עם token תמיד נכנס
✅ אין redirect ל-/billing או /login בגלל מנוי
✅ Header ו-Navigation תמיד פעילים
✅ נתונים נטענים כרגיל (אין חסימת fetch)
✅ Banner מוצג רק למשתמשים חסומים
✅ Admin לעולם לא חסום
✅ יש hook מוכן לחסימת פעולות

## קבצים ששונו

- \`ProtectedRoute.tsx\` - הסרת redirect logic
- \`Login.tsx\` - שינוי navigate destination
- \`AppBootstrap.tsx\` - הסרת blocked mode routing
- \`AppLayout.tsx\` - הוספת SubscriptionBanner

## קבצים חדשים

- \`SubscriptionBanner.tsx\` - Banner component
- \`useGuardAction.ts\` - Action guard hook
