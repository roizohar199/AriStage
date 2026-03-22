import type { Request } from "express";

export type ServerLocale = "he-IL" | "en-US";

type TranslationParams = Record<string, string | number>;

const DEFAULT_LOCALE: ServerLocale = "he-IL";

const MESSAGES = {
  "errors.internal": {
    "he-IL": "אירעה שגיאת שרת",
    "en-US": "Internal server error",
  },
  "errors.validationFailed": {
    "he-IL": "הוולידציה נכשלה",
    "en-US": "Validation failed",
  },
  "errors.invalidQueryParameters": {
    "he-IL": "פרמטרי השאילתה אינם תקינים",
    "en-US": "Invalid query parameters",
  },
  "errors.invalidUrlParameters": {
    "he-IL": "פרמטרי ה־URL אינם תקינים",
    "en-US": "Invalid URL parameters",
  },
  "errors.fileRequired": {
    "he-IL": "חובה לצרף קובץ",
    "en-US": "File is required",
  },
  "errors.fileTooLarge": {
    "he-IL": "גודל הקובץ לא יכול לעלות על {sizeMb}MB",
    "en-US": "File size must not exceed {sizeMb}MB",
  },
  "errors.invalidFileType": {
    "he-IL": "סוג קובץ לא תקין. הסוגים המותרים: {types}",
    "en-US": "Invalid file type. Allowed types: {types}",
  },
  "errors.notFound": {
    "he-IL": "נתיב ה־API לא נמצא",
    "en-US": "API route not found",
  },
  "validation.emailRequired": {
    "he-IL": "נא להזין כתובת אימייל",
    "en-US": "Email is required",
  },
  "validation.invalidEmailFormat": {
    "he-IL": "פורמט האימייל אינו תקין",
    "en-US": "Invalid email format",
  },
  "validation.emailTooLong": {
    "he-IL": "כתובת האימייל ארוכה מדי",
    "en-US": "Email is too long",
  },
  "validation.passwordMinLength": {
    "he-IL": "הסיסמה חייבת להכיל לפחות 8 תווים",
    "en-US": "Password must be at least 8 characters",
  },
  "validation.passwordMaxLength": {
    "he-IL": "הסיסמה לא יכולה לעלות על 128 תווים",
    "en-US": "Password must not exceed 128 characters",
  },
  "validation.invalidLocaleFormat": {
    "he-IL": "פורמט השפה אינו תקין",
    "en-US": "Invalid locale format",
  },
  "validation.fullNameMinLength": {
    "he-IL": "השם המלא חייב להכיל לפחות 2 תווים",
    "en-US": "Full name must be at least 2 characters",
  },
  "validation.fullNameTooLong": {
    "he-IL": "השם המלא ארוך מדי",
    "en-US": "Full name is too long",
  },
  "validation.passwordRequired": {
    "he-IL": "נא להזין סיסמה",
    "en-US": "Password is required",
  },
  "validation.resetTokenRequired": {
    "he-IL": "נדרש טוקן לאיפוס סיסמה",
    "en-US": "Reset token is required",
  },
  "validation.currentPasswordRequired": {
    "he-IL": "נא להזין את הסיסמה הנוכחית",
    "en-US": "Current password is required",
  },
  "validation.passwordConfirmationRequired": {
    "he-IL": "נא לאשר את הסיסמה",
    "en-US": "Password confirmation is required",
  },
  "validation.passwordsDoNotMatch": {
    "he-IL": "הסיסמאות אינן תואמות",
    "en-US": "Passwords do not match",
  },
  "validation.newPasswordMustDiffer": {
    "he-IL": "הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית",
    "en-US": "New password must be different from current password",
  },
  "validation.twoFactorCodeLength": {
    "he-IL": "קוד האימות הדו־שלבי חייב להכיל 6 ספרות",
    "en-US": "2FA code must be 6 digits",
  },
  "validation.twoFactorCodeDigits": {
    "he-IL": "קוד האימות הדו־שלבי חייב להכיל ספרות בלבד",
    "en-US": "2FA code must contain only digits",
  },
  "validation.passwordRequiredForVerification": {
    "he-IL": "נדרשת סיסמה לצורך אימות",
    "en-US": "Password is required for verification",
  },
  "validation.userIdPositive": {
    "he-IL": "מזהה המשתמש חייב להיות מספר שלם חיובי",
    "en-US": "User ID must be a positive integer",
  },
  "validation.invalidPhoneFormat": {
    "he-IL": "פורמט מספר הטלפון אינו תקין",
    "en-US": "Invalid phone number format",
  },
  "validation.avatarImageOnly": {
    "he-IL": "האוואטר חייב להיות תמונה מסוג JPEG, PNG, GIF או WebP",
    "en-US": "Avatar must be an image (JPEG, PNG, GIF, or WebP)",
  },
  "validation.avatarFileTooLarge": {
    "he-IL": "גודל קובץ האוואטר לא יכול לעלות על 5MB",
    "en-US": "Avatar file size must not exceed 5MB",
  },
  "validation.atLeastOneUserId": {
    "he-IL": "יש לבחור לפחות משתמש אחד",
    "en-US": "At least one user ID is required",
  },
  "validation.tooManyUsersSelected": {
    "he-IL": "נבחרו יותר מדי משתמשים",
    "en-US": "Too many users selected",
  },
  "auth.missingAuthorizationHeader": {
    "he-IL": "חסר או לא תקין Authorization header",
    "en-US": "Unauthorized - Missing or invalid Authorization header",
  },
  "auth.missingToken": {
    "he-IL": "חסר טוקן גישה",
    "en-US": "Unauthorized - Missing token",
  },
  "auth.tokenExpired": {
    "he-IL": "פג תוקף הטוקן",
    "en-US": "Token expired",
  },
  "auth.invalidToken": {
    "he-IL": "טוקן לא תקין",
    "en-US": "Invalid token",
  },
  "auth.forbiddenRole": {
    "he-IL": "אין לך הרשאה לפעולה הזו",
    "en-US": "Forbidden - Role not allowed",
  },
  "auth.emailAndPasswordRequired": {
    "he-IL": "נא להזין אימייל וסיסמה",
    "en-US": "Please enter email and password",
  },
  "auth.accountLockedMinutes": {
    "he-IL":
      "חשבון זה נעול זמנית בשל ניסיונות התחברות רבים. נסה שוב בעוד {minutes} דקות.",
    "en-US":
      "This account is temporarily locked due to too many login attempts. Try again in {minutes} minutes.",
  },
  "auth.invalidCredentials": {
    "he-IL": "אימייל או סיסמה שגויים",
    "en-US": "Invalid email or password",
  },
  "auth.accountLockedFifteenMinutes": {
    "he-IL": "יותר מדי ניסיונות התחברות כושלים. החשבון ננעל זמנית ל־15 דקות.",
    "en-US":
      "Too many failed login attempts. This account has been temporarily locked for 15 minutes.",
  },
  "auth.invalidPasswordAttemptsLeft": {
    "he-IL": "סיסמה שגויה. נותרו {attemptsLeft} ניסיונות.",
    "en-US": "Incorrect password. {attemptsLeft} attempts remaining.",
  },
  "auth.invalidPassword": {
    "he-IL": "סיסמה שגויה",
    "en-US": "Incorrect password",
  },
  "auth.twoFactorRequired": {
    "he-IL": "נדרש אימות דו־שלבי",
    "en-US": "2FA verification required",
  },
  "auth.userNotFound": {
    "he-IL": "המשתמש לא נמצא",
    "en-US": "User not found",
  },
  "auth.registrationMissingFields": {
    "he-IL": "נא למלא את כל השדות",
    "en-US": "Please fill in all required fields",
  },
  "auth.emailAlreadyExists": {
    "he-IL": "האימייל כבר קיים במערכת",
    "en-US": "This email already exists in the system",
  },
  "auth.resetSafeResponse": {
    "he-IL": "אם המייל קיים, נשלח אליו קישור לאיפוס",
    "en-US": "If the email exists, a reset link has been sent",
  },
  "auth.resetMissingData": {
    "he-IL": "חסרים נתונים לאיפוס הסיסמה",
    "en-US": "Missing data for password reset",
  },
  "auth.resetInvalidOrExpired": {
    "he-IL": "הקישור לא תקף או שפג תוקפו",
    "en-US": "The reset link is invalid or has expired",
  },
  "auth.registered": {
    "he-IL": "נוצר בהצלחה",
    "en-US": "Created successfully",
  },
  "auth.passwordUpdatedLogin": {
    "he-IL": "הסיסמה עודכנה בהצלחה! אפשר להתחבר.",
    "en-US": "Password updated successfully. You can sign in now.",
  },
  "auth.refreshTokenRequired": {
    "he-IL": "נדרש refresh token",
    "en-US": "Refresh token is required",
  },
  "auth.notAuthenticated": {
    "he-IL": "המשתמש אינו מחובר",
    "en-US": "Not authenticated",
  },
  "auth.loggedOut": {
    "he-IL": "התנתקת בהצלחה",
    "en-US": "Logged out successfully",
  },
  "auth.loggedOutAll": {
    "he-IL": "התנתקת מכל המכשירים בהצלחה",
    "en-US": "Logged out from all devices successfully",
  },
  "twoFactor.userAndCodeRequired": {
    "he-IL": "נדרש מזהה משתמש וקוד אימות דו־שלבי",
    "en-US": "User ID and 2FA code are required",
  },
  "twoFactor.setupInitiated": {
    "he-IL":
      "הפעלת האימות הדו־שלבי החלה. סרוק את קוד ה־QR באפליקציית המאמת שלך.",
    "en-US":
      "2FA setup initiated. Scan the QR code with your authenticator app.",
  },
  "twoFactor.instructions.install": {
    "he-IL": "1. התקן אפליקציית מאמת (Google Authenticator, Authy וכו')",
    "en-US":
      "1. Install an authenticator app (Google Authenticator, Authy, etc.)",
  },
  "twoFactor.instructions.scan": {
    "he-IL": "2. סרוק את קוד ה־QR עם האפליקציה",
    "en-US": "2. Scan the QR code with the app",
  },
  "twoFactor.instructions.verify": {
    "he-IL": "3. הזן את הקוד בן 6 הספרות מהאפליקציה כדי לאמת",
    "en-US": "3. Enter the 6-digit code from the app to verify",
  },
  "twoFactor.instructions.saveBackupCodes": {
    "he-IL": "4. שמור את קודי הגיבוי במקום בטוח",
    "en-US": "4. Save your backup codes in a secure place",
  },
  "twoFactor.invalidCodeFormat": {
    "he-IL": "פורמט קוד האימות הדו־שלבי אינו תקין",
    "en-US": "Invalid 2FA code format",
  },
  "twoFactor.enabled": {
    "he-IL": "האימות הדו־שלבי הופעל בהצלחה בחשבון שלך",
    "en-US": "2FA has been successfully enabled for your account",
  },
  "twoFactor.userAndTokenRequired": {
    "he-IL": "נדרש מזהה משתמש וקוד אימות",
    "en-US": "User ID and token are required",
  },
  "twoFactor.invalidCode": {
    "he-IL": "קוד האימות הדו־שלבי שגוי",
    "en-US": "Invalid 2FA code",
  },
  "twoFactor.verified": {
    "he-IL": "אימות דו־שלבי הושלם בהצלחה",
    "en-US": "2FA verification successful",
  },
  "twoFactor.passwordRequiredToDisable": {
    "he-IL": "נדרשת סיסמה כדי לכבות אימות דו־שלבי",
    "en-US": "Password is required to disable 2FA",
  },
  "twoFactor.disabled": {
    "he-IL": "האימות הדו־שלבי כובה בחשבון שלך",
    "en-US": "2FA has been disabled for your account",
  },
  "users.noUpdateData": {
    "he-IL": "לא נשלחו נתונים לעדכון",
    "en-US": "No data was sent for update",
  },
  "users.preferredLocaleNull": {
    "he-IL": "preferred_locale לא יכול להיות null",
    "en-US": "preferred_locale cannot be null",
  },
  "users.preferredLocaleEmpty": {
    "he-IL": "preferred_locale לא יכול להיות ריק",
    "en-US": "preferred_locale cannot be empty",
  },
  "users.preferredLocaleTooLong": {
    "he-IL": "preferred_locale ארוך מדי",
    "en-US": "preferred_locale is too long",
  },
  "users.preferredLocaleInvalid": {
    "he-IL": "פורמט preferred_locale אינו תקין",
    "en-US": "preferred_locale format is invalid",
  },
  "users.updateFailed": {
    "he-IL": "העדכון נכשל",
    "en-US": "Update failed",
  },
  "users.newPasswordRequired": {
    "he-IL": "לא הוזנה סיסמה חדשה",
    "en-US": "A new password is required",
  },
  "users.createMissingFields": {
    "he-IL": "חובה להזין שם מלא, אימייל וסיסמה",
    "en-US": "Full name, email, and password are required",
  },
  "users.invalidSubscriptionType": {
    "he-IL": "סוג המנוי אינו תקין: {value}",
    "en-US": "Invalid subscription type: {value}",
  },
  "users.updateForbidden": {
    "he-IL": "אין לך הרשאה לעדכן משתמש זה",
    "en-US": "You are not allowed to update this user",
  },
  "users.cannotInviteSelf": {
    "he-IL": "לא ניתן להזמין את עצמך",
    "en-US": "You cannot invite yourself",
  },
  "users.artistNotFound": {
    "he-IL": "האמן לא נמצא",
    "en-US": "Artist not found",
  },
  "users.artistAlreadyInvited": {
    "he-IL": "האמן כבר מוזמן על ידי המארח הזה",
    "en-US": "The artist is already invited by this host",
  },
  "users.invitationFailed": {
    "he-IL": "ההזמנה נכשלה",
    "en-US": "Invitation failed",
  },
  "users.artistInvited": {
    "he-IL": "האמן הוזמן בהצלחה למאגר שלך",
    "en-US": "The artist was invited to your pool successfully",
  },
  "users.cannotUninviteSelf": {
    "he-IL": "לא ניתן לבטל הזמנה של עצמך",
    "en-US": "You cannot cancel an invitation to yourself",
  },
  "users.uninviteFailed": {
    "he-IL": "ביטול ההזמנה נכשל. האמן לא הוזמן על ידך",
    "en-US":
      "Failed to cancel the invitation. The artist was not invited by you",
  },
  "users.shareCancelled": {
    "he-IL": "השיתוף בוטל בהצלחה",
    "en-US": "Sharing was cancelled successfully",
  },
  "users.notGuestAnyPool": {
    "he-IL": "אינך אורח במאגר, ולכן אין השתתפות לבטל",
    "en-US": "You are not a guest in any pool, so there is nothing to cancel",
  },
  "users.notGuestThisPool": {
    "he-IL": "אינך אורח במאגר הזה",
    "en-US": "You are not a guest in this pool",
  },
  "users.leaveCollectionFailed": {
    "he-IL": "ביטול ההשתתפות נכשל",
    "en-US": "Failed to cancel participation",
  },
  "users.leftCollection": {
    "he-IL": "השתתפותך במאגר בוטלה בהצלחה",
    "en-US": "Your participation in the pool was cancelled successfully",
  },
  "users.leftAllCollections": {
    "he-IL": "כל ההשתתפויות שלך במאגרים בוטלו בהצלחה",
    "en-US": "All of your pool participations were cancelled successfully",
  },
  "users.pendingInvitationNotFound": {
    "he-IL": "לא נמצאה הזמנה ממתינה לאישור",
    "en-US": "No pending invitation was found",
  },
  "users.invitationAccepted": {
    "he-IL": "ההזמנה אושרה בהצלחה",
    "en-US": "Invitation accepted successfully",
  },
  "users.invitationRejected": {
    "he-IL": "ההזמנה נדחתה",
    "en-US": "Invitation rejected",
  },
  "users.invalidEmail": {
    "he-IL": "נא להזין כתובת אימייל תקינה",
    "en-US": "Please enter a valid email address",
  },
  "users.invitationSentEmail": {
    "he-IL": "ההזמנה נשלחה בהצלחה למייל",
    "en-US": "Invitation email sent successfully",
  },
  "users.invitationInvalidOrExpired": {
    "he-IL": "ההזמנה לא תקינה או שפג תוקפה",
    "en-US": "The invitation is invalid or has expired",
  },
  "users.invitationSentAwaitingApproval": {
    "he-IL": "ההזמנה נשלחה. נא לאשר אותה",
    "en-US": "Invitation sent. Please approve it",
  },
  "users.joinPool": {
    "he-IL": "הצטרף למאגר",
    "en-US": "Join the pool",
  },
  "users.passwordUpdated": {
    "he-IL": "הסיסמה עודכנה בהצלחה",
    "en-US": "Password updated successfully",
  },
  "users.userCreated": {
    "he-IL": "המשתמש נוצר בהצלחה",
    "en-US": "User created successfully",
  },
  "users.userUpdated": {
    "he-IL": "המשתמש עודכן בהצלחה",
    "en-US": "User updated successfully",
  },
  "users.userDeleted": {
    "he-IL": "המשתמש נמחק בהצלחה",
    "en-US": "User deleted successfully",
  },
  "users.impersonationSuccess": {
    "he-IL": "התחזות בוצעה בהצלחה",
    "en-US": "Impersonation success",
  },
  "users.artistIdRequired": {
    "he-IL": "נא להזין מזהה אמן",
    "en-US": "Artist ID is required",
  },
  "users.validHostIdRequired": {
    "he-IL": "נא לספק hostId תקין",
    "en-US": "A valid hostId is required",
  },
  "users.emailRequired": {
    "he-IL": "נא להזין כתובת אימייל",
    "en-US": "Email is required",
  },
  "security.accountUnlocked": {
    "he-IL": "החשבון שוחרר בהצלחה",
    "en-US": "Account unlocked successfully",
  },
  "security.invalidSessionId": {
    "he-IL": "מזהה הסשן אינו תקין",
    "en-US": "Invalid session ID",
  },
  "security.sessionRevoked": {
    "he-IL": "הסשן בוטל בהצלחה",
    "en-US": "Session revoked successfully",
  },
  "security.invalidUserId": {
    "he-IL": "מזהה המשתמש אינו תקין",
    "en-US": "Invalid user ID",
  },
  "security.sessionsRevoked": {
    "he-IL": "{count} סשנים בוטלו בהצלחה",
    "en-US": "{count} session(s) revoked successfully",
  },
  "security.getOverviewFailed": {
    "he-IL": "לא ניתן לטעון את תמונת המצב האבטחתית",
    "en-US": "Failed to get security overview",
  },
  "security.getLockedAccountsFailed": {
    "he-IL": "לא ניתן לטעון חשבונות נעולים",
    "en-US": "Failed to get locked accounts",
  },
  "security.getActiveSessionsFailed": {
    "he-IL": "לא ניתן לטעון סשנים פעילים",
    "en-US": "Failed to get active sessions",
  },
  "security.sessionNotFoundOrRevoked": {
    "he-IL": "הסשן לא נמצא או שכבר בוטל",
    "en-US": "Session not found or already revoked",
  },
  "security.revokeSessionFailed": {
    "he-IL": "ביטול הסשן נכשל",
    "en-US": "Failed to revoke session",
  },
  "security.revokeUserSessionsFailed": {
    "he-IL": "ביטול הסשנים של המשתמש נכשל",
    "en-US": "Failed to revoke user sessions",
  },
  "security.unlockAccountFailed": {
    "he-IL": "שחרור החשבון נכשל",
    "en-US": "Failed to unlock account",
  },
  "security.healthScoreFailed": {
    "he-IL": "חישוב ציון בריאות האבטחה נכשל",
    "en-US": "Failed to calculate security health score",
  },
  "songs.privateChartDeleted": {
    "he-IL": "הצ'ארט נמחק בהצלחה",
    "en-US": "Chart deleted successfully",
  },
  "songs.privateChartNotFoundOrForbidden": {
    "he-IL": "הצ'ארט לא נמצא או שאין הרשאה למחוק אותו",
    "en-US": "Chart not found or you do not have permission to delete it",
  },
  "songs.fileNotSelected": {
    "he-IL": "לא נבחר קובץ",
    "en-US": "No file selected",
  },
  "songs.privateChartUploaded": {
    "he-IL": "הצ'ארט הועלה בהצלחה",
    "en-US": "Chart uploaded successfully",
  },
  "songs.created": {
    "he-IL": "השיר נוסף בהצלחה",
    "en-US": "Song created successfully",
  },
  "songs.updated": {
    "he-IL": "השיר עודכן בהצלחה",
    "en-US": "Song updated successfully",
  },
  "songs.deleted": {
    "he-IL": "השיר נמחק בהצלחה",
    "en-US": "Song deleted successfully",
  },
  "songs.fileNotUploaded": {
    "he-IL": "לא הועלה קובץ",
    "en-US": "No file was uploaded",
  },
  "songs.invalidSongId": {
    "he-IL": "מזהה השיר אינו תקין",
    "en-US": "Invalid song ID",
  },
  "songs.chartUploaded": {
    "he-IL": "קובץ ה־PDF הועלה בהצלחה",
    "en-US": "PDF uploaded successfully",
  },
  "songs.chartPdfMigrationMissing": {
    "he-IL": "השדה chart_pdf לא קיים בטבלה. יש להריץ את מיגרציית ה־SQL.",
    "en-US":
      "The chart_pdf column does not exist in the table. Please run the SQL migration.",
  },
  "songs.chartDeleted": {
    "he-IL": "קובץ ה־PDF נמחק בהצלחה",
    "en-US": "PDF deleted successfully",
  },
  "songs.lyricsSaved": {
    "he-IL": "המילים נשמרו בהצלחה",
    "en-US": "Lyrics saved successfully",
  },
  "songs.lyricsDeleted": {
    "he-IL": "המילים נמחקו בהצלחה",
    "en-US": "Lyrics deleted successfully",
  },
  "songs.titleRequired": {
    "he-IL": "שם השיר הוא שדה חובה",
    "en-US": "Song title is required",
  },
  "songs.updateForbidden": {
    "he-IL": "אין לך הרשאה לעדכן את השיר הזה",
    "en-US": "You do not have permission to update this song",
  },
  "songs.deleteForbidden": {
    "he-IL": "אין לך הרשאה למחוק את השיר הזה",
    "en-US": "You do not have permission to delete this song",
  },
  "songs.notFound": {
    "he-IL": "השיר לא נמצא",
    "en-US": "Song not found",
  },
  "songs.fileDeleteForbidden": {
    "he-IL": "אין לך הרשאה למחוק את הקובץ הזה",
    "en-US": "You do not have permission to delete this file",
  },
  "songs.chartPdfNotFound": {
    "he-IL": "קובץ ה־PDF לא נמצא",
    "en-US": "PDF file not found",
  },
  "songs.lyricsOwnerOnly": {
    "he-IL": "רק בעל המאגר יכול להוסיף, לערוך או למחוק מילים",
    "en-US": "Only the pool owner can add, edit, or delete lyrics",
  },
  "songs.lyricsSaveFailed": {
    "he-IL": "שמירת המילים נכשלה",
    "en-US": "Failed to save lyrics",
  },
  "songs.lyricsDeleteFailed": {
    "he-IL": "מחיקת המילים נכשלה",
    "en-US": "Failed to delete lyrics",
  },
  "lineups.invalidUserId": {
    "he-IL": "מזהה המשתמש אינו תקין",
    "en-US": "Invalid user ID",
  },
  "lineups.userLineupsForbidden": {
    "he-IL": "אין לך גישה לליינאפים של המשתמש הזה",
    "en-US": "You do not have access to this user's lineups",
  },
  "lineups.invalidLineupId": {
    "he-IL": "מזהה הליינאפ אינו תקין",
    "en-US": "Invalid lineup ID",
  },
  "lineups.deleted": {
    "he-IL": "הליינאפ נמחק בהצלחה",
    "en-US": "Lineup deleted successfully",
  },
  "lineups.shareDisabled": {
    "he-IL": "קישור השיתוף בוטל",
    "en-US": "Share link disabled",
  },
  "lineups.noChartsToDownload": {
    "he-IL": "לא נמצאו צ'ארטים להורדה",
    "en-US": "No charts found for download",
  },
  "lineups.pdfGenerationFailed": {
    "he-IL": "יצירת קובץ ה־PDF נכשלה",
    "en-US": "Failed to generate PDF",
  },
  "lineups.lyricsLoadFailed": {
    "he-IL": "טעינת המילים נכשלה",
    "en-US": "Failed to load lyrics",
  },
  "lineups.noSongsFound": {
    "he-IL": "לא נמצאו שירים בליינאפ",
    "en-US": "No songs were found in the lineup",
  },
  "lineups.notFound": {
    "he-IL": "הליינאפ לא נמצא",
    "en-US": "Lineup not found",
  },
  "lineups.accessForbidden": {
    "he-IL": "אין לך גישה לליינאפ הזה",
    "en-US": "You do not have access to this lineup",
  },
  "lineups.titleRequired": {
    "he-IL": "חובה להזין שם לליינאפ",
    "en-US": "Lineup title is required",
  },
  "lineups.updateForbidden": {
    "he-IL": "אין לך הרשאה לערוך את הליינאפ הזה",
    "en-US": "You do not have permission to edit this lineup",
  },
  "lineups.deleteForbidden": {
    "he-IL": "אין לך הרשאה למחוק את הליינאפ הזה",
    "en-US": "You do not have permission to delete this lineup",
  },
  "lineups.export.songNumber": {
    "he-IL": "מספר",
    "en-US": "Number",
  },
  "lineups.export.artist": {
    "he-IL": "אמן",
    "en-US": "Artist",
  },
  "lineups.export.key": {
    "he-IL": "מפתח",
    "en-US": "Key",
  },
  "lineups.export.duration": {
    "he-IL": "משך",
    "en-US": "Duration",
  },
  "lineups.export.chartUnavailable": {
    "he-IL": "לא ניתן להוריד את הצ'ארט",
    "en-US": "Unable to download the chart",
  },
  "lineups.export.noChartForSong": {
    "he-IL": "אין צ'ארט לשיר זה",
    "en-US": "No chart available for this song",
  },
  "lineups.export.chartAlt": {
    "he-IL": "צ'ארט",
    "en-US": "Chart",
  },
  "lineups.export.lyricsSuffix": {
    "he-IL": "מילים",
    "en-US": "Lyrics",
  },
  "lineups.export.noLyrics": {
    "he-IL": "אין מילים לשיר זה",
    "en-US": "No lyrics available for this song",
  },
  "share.invalidOrInactive": {
    "he-IL": "קישור השיתוף לא פעיל או לא קיים",
    "en-US": "The share link is inactive or does not exist",
  },
  "files.nameAndUrlRequired": {
    "he-IL": "חובה להזין שם וקישור לקובץ",
    "en-US": "File name and file URL are required",
  },
  "files.nameRequired": {
    "he-IL": "חובה להזין שם קובץ",
    "en-US": "File name is required",
  },
  "files.updateForbidden": {
    "he-IL": "אין לך הרשאה לעדכן את הקובץ הזה",
    "en-US": "You do not have permission to update this file",
  },
  "files.notFound": {
    "he-IL": "הקובץ לא נמצא",
    "en-US": "File not found",
  },
  "files.deleteForbidden": {
    "he-IL": "אין לך הרשאה למחוק את הקובץ הזה",
    "en-US": "You do not have permission to delete this file",
  },
  "files.deleted": {
    "he-IL": "הקובץ נמחק בהצלחה",
    "en-US": "File deleted successfully",
  },
  "admin.invalidPlanId": {
    "he-IL": "מזהה המסלול אינו תקין",
    "en-US": "Invalid plan ID",
  },
  "admin.fieldRequired": {
    "he-IL": "השדה {field} הוא שדה חובה",
    "en-US": "{field} is required",
  },
  "admin.fieldMustBeNumber": {
    "he-IL": "השדה {field} חייב להיות מספר",
    "en-US": "{field} must be a number",
  },
  "admin.enabledMustBeBoolean": {
    "he-IL": "השדה enabled חייב להיות בוליאני",
    "en-US": "enabled must be boolean",
  },
  "admin.planNotFound": {
    "he-IL": "המסלול לא נמצא",
    "en-US": "Plan not found",
  },
  "admin.limitPositive": {
    "he-IL": "limit חייב להיות מספר חיובי",
    "en-US": "limit must be a positive number",
  },
  "admin.offsetNonNegative": {
    "he-IL": "offset חייב להיות מספר לא שלילי",
    "en-US": "offset must be a non-negative number",
  },
  "admin.subscriptionDateValid": {
    "he-IL": "subscription_expires_at חייב להיות תאריך תקין",
    "en-US": "subscription_expires_at must be a valid date",
  },
  "admin.invalidUserId": {
    "he-IL": "מזהה המשתמש אינו תקין",
    "en-US": "Invalid user ID",
  },
  "admin.unauthorized": {
    "he-IL": "אין הרשאה לביצוע הפעולה",
    "en-US": "Unauthorized",
  },
  "admin.noSubscriptionFields": {
    "he-IL": "לא נשלחו שדות מנוי לעדכון",
    "en-US": "No subscription fields provided",
  },
  "admin.subscriptionExpiresRequired": {
    "he-IL":
      "חובה לספק subscription_expires_at כאשר subscription_status הוא active או trial",
    "en-US":
      "subscription_expires_at is required when subscription_status is active or trial",
  },
  "admin.subscriptionExpiresFuture": {
    "he-IL":
      "subscription_expires_at חייב להיות תאריך עתידי כאשר subscription_status הוא active או trial",
    "en-US":
      "subscription_expires_at must be a future date when subscription_status is active or trial",
  },
  "admin.subscriptionStatusInvalid": {
    "he-IL": "subscription_status חייב להיות אחד מהערכים: {values}",
    "en-US": "subscription_status must be one of: {values}",
  },
  "errors.recordNotFound": {
    "he-IL": "הרשומה לא נמצאה",
    "en-US": "Record not found",
  },
  "dashboard.userNotIdentified": {
    "he-IL": "המשתמש לא מזוהה",
    "en-US": "User is not authenticated",
  },
  "refresh.failedGenerate": {
    "he-IL": "יצירת refresh token נכשלה",
    "en-US": "Failed to generate refresh token",
  },
  "refresh.invalidOrExpired": {
    "he-IL": "ה־refresh token אינו תקין או שפג תוקפו",
    "en-US": "Invalid or expired refresh token",
  },
  "refresh.failedVerify": {
    "he-IL": "אימות ה־refresh token נכשל",
    "en-US": "Failed to verify refresh token",
  },
  "refresh.failedRevokeTokens": {
    "he-IL": "ביטול הטוקנים נכשל",
    "en-US": "Failed to revoke tokens",
  },
  "refresh.failedRetrieveSessions": {
    "he-IL": "טעינת הסשנים נכשלה",
    "en-US": "Failed to retrieve sessions",
  },
  "refresh.failedRevokeSession": {
    "he-IL": "ביטול הסשן נכשל",
    "en-US": "Failed to revoke session",
  },
  "plans.keyRequired": {
    "he-IL": "חובה לספק מפתח מסלול",
    "en-US": "Plan key is required",
  },
  "featureFlags.keyRequired": {
    "he-IL": "חובה לספק מפתח דגל פיצ'ר",
    "en-US": "Missing feature flag key",
  },
  "lineupSongs.accessForbidden": {
    "he-IL": "אין לך הרשאה לבצע פעולה בליינאפ הזה",
    "en-US": "You do not have permission to perform this action on this lineup",
  },
  "lineupSongs.songRequired": {
    "he-IL": "חובה לבחור שיר להוספה",
    "en-US": "A song must be selected",
  },
  "lineupSongs.invalidSongsArray": {
    "he-IL": "פורמט לא תקין. יש לשלוח מערך של שירים",
    "en-US": "Invalid format. A songs array is required",
  },
  "lineupSongs.reorderOwnerOnly": {
    "he-IL": "רק בעל הליינאפ יכול לשנות את סדר השירים",
    "en-US": "Only the lineup owner can reorder songs",
  },
  "lineupSongs.songNotFound": {
    "he-IL": "השיר לא נמצא בליינאפ",
    "en-US": "Song not found in lineup",
  },
  "lineupSongs.created": {
    "he-IL": "השיר נוסף לליינאפ בהצלחה",
    "en-US": "Song added to lineup successfully",
  },
  "lineupSongs.reordered": {
    "he-IL": "סדר השירים עודכן בהצלחה",
    "en-US": "Song order updated successfully",
  },
  "lineupSongs.invalidIds": {
    "he-IL": "המזהים שסופקו אינם תקינים",
    "en-US": "Invalid ID supplied",
  },
  "lineupSongs.removed": {
    "he-IL": "השיר הוסר מהליינאפ",
    "en-US": "Song removed from lineup",
  },
  "lineupSongs.fileNotUploaded": {
    "he-IL": "לא הועלה קובץ",
    "en-US": "No file was uploaded",
  },
  "lineupSongs.invalidSongId": {
    "he-IL": "מזהה השיר אינו תקין",
    "en-US": "Invalid song ID",
  },
  "lineupSongs.chartUploaded": {
    "he-IL": "קובץ ה־PDF הועלה בהצלחה",
    "en-US": "PDF uploaded successfully",
  },
  "lineupSongs.chartDeleted": {
    "he-IL": "קובץ ה־PDF נמחק בהצלחה",
    "en-US": "PDF deleted successfully",
  },
  "users.defaultHostName": {
    "he-IL": "אמן",
    "en-US": "Artist",
  },
  "payments.planRequired": {
    "he-IL": "נדרש לבחור מסלול",
    "en-US": "Plan is required",
  },
  "payments.invalidBillingPeriod": {
    "he-IL": "תקופת החיוב אינה תקינה",
    "en-US": "Invalid billing period",
  },
  "payments.invalidPlan": {
    "he-IL": "המסלול שנבחר אינו תקין",
    "en-US": "Invalid plan",
  },
  "payments.planUnavailable": {
    "he-IL": "המסלול הזה אינו זמין כרגע",
    "en-US": "Plan is not available",
  },
  "payments.paymentIdRequired": {
    "he-IL": "נדרש paymentId תקין",
    "en-US": "paymentId is required",
  },
  "payments.paymentNotFound": {
    "he-IL": "התשלום לא נמצא",
    "en-US": "Payment not found",
  },
  "payments.otherUserForbidden": {
    "he-IL": "לא ניתן לאשר תשלום של משתמש אחר",
    "en-US": "Cannot confirm payment for another user",
  },
  "rateLimit.global": {
    "he-IL": "בוצעו יותר מדי בקשות מכתובת ה־IP הזו. נסה שוב מאוחר יותר.",
    "en-US": "Too many requests from this IP. Please try again later.",
  },
  "rateLimit.auth": {
    "he-IL": "יותר מדי ניסיונות אימות. החשבון ננעל זמנית להגנה.",
    "en-US":
      "Too many authentication attempts. Your account has been temporarily locked for security.",
  },
  "rateLimit.passwordReset": {
    "he-IL": "בוצעו יותר מדי ניסיונות איפוס סיסמה. נסה שוב בעוד שעה.",
    "en-US": "Too many password reset attempts. Please try again after 1 hour.",
  },
  "rateLimit.upload": {
    "he-IL": "חרגת ממכסת העלאות הקבצים. נסה שוב מאוחר יותר.",
    "en-US": "Upload limit exceeded. Please try again later.",
  },
  "rateLimit.sensitiveOperation": {
    "he-IL": "חרגת ממכסת הבקשות לפעולה הזו. נסה שוב מאוחר יותר.",
    "en-US": "Rate limit exceeded for this operation.",
  },
  "subscriptions.noFieldsToUpdate": {
    "he-IL": "לא נשלחו שדות לעדכון",
    "en-US": "No fields to update",
  },
  "subscriptions.settingsRowMissing": {
    "he-IL": "חסרה רשומת הגדרות המנוי הראשית",
    "en-US": "Missing subscriptions settings row",
  },
  "subscriptions.invalidUserIdForExpiry": {
    "he-IL": "מזהה המשתמש לעדכון פקיעת מנוי אינו תקין",
    "en-US": "Invalid userId for subscription expiry update",
  },
  "websocket.authenticationRequired": {
    "he-IL": "נדרש אימות להתחברות ל־WebSocket",
    "en-US": "Authentication required for WebSocket connection",
  },
  "websocket.invalidToken": {
    "he-IL": "טוקן ה־WebSocket אינו תקין",
    "en-US": "Invalid WebSocket token",
  },
  "websocket.rateLimitExceeded": {
    "he-IL": "חרגת ממכסת החיבורים ל־WebSocket",
    "en-US": "WebSocket rate limit exceeded",
  },
  "websocket.authenticationFailed": {
    "he-IL": "אימות ה־WebSocket נכשל",
    "en-US": "WebSocket authentication failed",
  },
  "websocket.unauthorized": {
    "he-IL": "אין הרשאה לביצוע הפעולה",
    "en-US": "Unauthorized",
  },
  "adminPayments.loadFailed": {
    "he-IL": "טעינת התשלומים נכשלה",
    "en-US": "Failed to load payments",
  },
  "systemSettings.fetchFailed": {
    "he-IL": "טעינת הגדרות המערכת נכשלה",
    "en-US": "Failed to fetch system settings",
  },
  "systemSettings.fetchI18nFailed": {
    "he-IL": "טעינת הגדרות השפה נכשלה",
    "en-US": "Failed to fetch i18n settings",
  },
  "systemSettings.updateI18nFailed": {
    "he-IL": "עדכון הגדרות השפה נכשל",
    "en-US": "Failed to update i18n settings",
  },
  "email.reset.subject": {
    "he-IL": "איפוס סיסמה - Ari Stage",
    "en-US": "Password Reset - Ari Stage",
  },
  "email.invitation.subject": {
    "he-IL": "הזמנה למאגר Ari Stage",
    "en-US": "Invitation to Ari Stage",
  },
} as const;

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
}

function parseAcceptLanguage(
  headerValue?: string | string[],
): ServerLocale | null {
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!raw) return null;

  const first = raw
    .split(",")
    .map((part) => part.trim().split(";")[0])
    .find(Boolean);

  return normalizeLocale(first, null);
}

export function normalizeLocale(
  rawLocale?: string | null,
  fallback: ServerLocale | null = DEFAULT_LOCALE,
): ServerLocale | null {
  if (!rawLocale) return fallback;

  const normalized = String(rawLocale).trim().replace(/_/g, "-").toLowerCase();

  if (!normalized) return fallback;
  if (normalized === "auto") return fallback;
  if (normalized.startsWith("he")) return "he-IL";
  if (normalized.startsWith("en")) return "en-US";

  return fallback;
}

export function resolveRequestLocale(req: Request): ServerLocale {
  const acceptLanguageLocale = parseAcceptLanguage(
    req.headers["accept-language"],
  );
  const preferred = req.user?.preferred_locale;

  if (preferred && preferred !== "auto") {
    return normalizeLocale(preferred, DEFAULT_LOCALE) ?? DEFAULT_LOCALE;
  }

  const bodyLocale =
    req.body && typeof req.body === "object"
      ? normalizeLocale(
          (req.body as Record<string, unknown>).preferred_locale as string,
          null,
        )
      : null;

  return bodyLocale ?? acceptLanguageLocale ?? DEFAULT_LOCALE;
}

export function tServer(
  locale: ServerLocale,
  key: keyof typeof MESSAGES,
  params?: TranslationParams,
): string {
  const entry = MESSAGES[key];
  return interpolate(entry[locale] ?? entry[DEFAULT_LOCALE], params);
}

export function tRequest(
  req: Request,
  key: keyof typeof MESSAGES,
  params?: TranslationParams,
): string {
  return tServer(resolveRequestLocale(req), key, params);
}

export function hasServerTranslationKey(
  value: string,
): value is keyof typeof MESSAGES {
  return Object.prototype.hasOwnProperty.call(MESSAGES, value);
}

export function translateServerMessage(
  locale: ServerLocale,
  message: string,
  params?: TranslationParams,
): string {
  if (!message) return message;

  return hasServerTranslationKey(message)
    ? tServer(locale, message, params)
    : message;
}

export function translatePasswordPolicyErrors(
  locale: ServerLocale,
  errors: string[],
): string[] {
  return errors.map((error) => {
    const minLengthMatch = error.match(
      /^Password must be at least (\d+) characters long$/,
    );
    if (minLengthMatch) {
      return locale === "he-IL"
        ? `הסיסמה חייבת להכיל לפחות ${minLengthMatch[1]} תווים`
        : error;
    }

    const maxLengthMatch = error.match(
      /^Password must not exceed (\d+) characters$/,
    );
    if (maxLengthMatch) {
      return locale === "he-IL"
        ? `הסיסמה לא יכולה לעלות על ${maxLengthMatch[1]} תווים`
        : error;
    }

    const exactMap: Record<string, { "he-IL": string; "en-US": string }> = {
      "Password must contain at least one uppercase letter": {
        "he-IL": "הסיסמה חייבת להכיל לפחות אות גדולה אחת",
        "en-US": "Password must contain at least one uppercase letter",
      },
      "Password must contain at least one lowercase letter": {
        "he-IL": "הסיסמה חייבת להכיל לפחות אות קטנה אחת",
        "en-US": "Password must contain at least one lowercase letter",
      },
      "Password must contain at least one number": {
        "he-IL": "הסיסמה חייבת להכיל לפחות ספרה אחת",
        "en-US": "Password must contain at least one number",
      },
      "Password must contain at least one special character (!@#$%^&* etc.)": {
        "he-IL": "הסיסמה חייבת להכיל לפחות תו מיוחד אחד (!@#$%^&* וכו')",
        "en-US":
          "Password must contain at least one special character (!@#$%^&* etc.)",
      },
      "This password is too common. Please choose a more unique password": {
        "he-IL": "הסיסמה הזו נפוצה מדי. בחר סיסמה ייחודית יותר",
        "en-US":
          "This password is too common. Please choose a more unique password",
      },
      'Password should not contain repeated characters (e.g., "aaa", "111")': {
        "he-IL": 'הסיסמה לא יכולה להכיל תווים חוזרים (למשל "aaa" או "111")',
        "en-US":
          'Password should not contain repeated characters (e.g., "aaa", "111")',
      },
      'Password should not contain sequential characters (e.g., "abc", "123")':
        {
          "he-IL": 'הסיסמה לא יכולה להכיל רצפים כמו "abc" או "123"',
          "en-US":
            'Password should not contain sequential characters (e.g., "abc", "123")',
        },
    };

    return exactMap[error]?.[locale] ?? error;
  });
}

function isRtl(locale: ServerLocale): boolean {
  return locale === "he-IL";
}

export function buildResetPasswordEmail(
  locale: ServerLocale,
  link: string,
): {
  subject: string;
  html: string;
} {
  const rtl = isRtl(locale);
  const direction = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";

  const copy =
    locale === "he-IL"
      ? {
          subtitle: "בקשה לאיפוס סיסמה",
          intro:
            "שלום 👋<br>התקבלה בקשה לאיפוס הסיסמה שלך.<br>לחץ על הכפתור למטה כדי להגדיר סיסמה חדשה:",
          button: "איפוס סיסמה",
          fallback: "אם הכפתור לא עובד, אפשר להעתיק את הקישור הבא:",
          expiry: "הקישור תקף ל־15 דקות בלבד.",
        }
      : {
          subtitle: "Password reset request",
          intro:
            "Hello 👋<br>We received a request to reset your password.<br>Click the button below to set a new password:",
          button: "Reset password",
          fallback: "If the button does not work, copy this link:",
          expiry: "This link is valid for 15 minutes only.",
        };

  return {
    subject: tServer(locale, "email.reset.subject"),
    html: `
<div style="width:100%; background:#0d0d0d; padding:40px 0; font-family:Arial, sans-serif; direction:${direction}; text-align:${align};">
  <div style="max-width:480px; margin:auto; background:#141414; padding:30px; border-radius:16px; border:1px solid #2a2a2a; direction:${direction}; text-align:${align};">
    <h2 style="text-align:center; color:#ff8800; font-size:26px; margin-bottom:10px; font-weight:bold; direction:${direction};">
      Ari Stage
    </h2>
    <p style="text-align:center; color:#cccccc; font-size:14px; margin-bottom:25px; direction:${direction};">
      ${copy.subtitle}
    </p>
    <p style="color:#e5e5e5; font-size:15px; line-height:1.8; direction:${direction}; text-align:${align};">
      ${copy.intro}
    </p>
    <div style="text-align:center; margin:30px 0; direction:${direction};">
      <a href="${link}" style="background:#ff8800; color:#000; padding:14px 26px; font-size:16px; font-weight:bold; text-decoration:none; border-radius:10px; display:inline-block; box-shadow:0 0 12px rgba(255,136,0,0.4);">
        ${copy.button}
      </a>
    </div>
    <p style="color:#bbbbbb; font-size:13px; direction:${direction}; text-align:${align};">
      ${copy.fallback}
    </p>
    <p style="color:#ffbb66; font-size:13px; word-break:break-all; background:#1f1f1f; padding:10px; border-radius:8px; margin-top:8px; direction:ltr; text-align:left;">
      ${link}
    </p>
    <hr style="border:none; border-top:1px solid #333; margin:30px 0;">
    <p style="color:#666; font-size:12px; text-align:center; direction:${direction};">
      ${copy.expiry}
      <br><br>
      Ari Stage © 2026
    </p>
  </div>
</div>`,
  };
}

export function buildArtistInvitationEmail(
  locale: ServerLocale,
  inviteLink: string,
  hostName: string,
): { subject: string; html: string } {
  const rtl = isRtl(locale);
  const direction = rtl ? "rtl" : "ltr";
  const align = rtl ? "right" : "left";

  const copy =
    locale === "he-IL"
      ? {
          subtitle: "הזמנה למאגר אמנים",
          intro: `שלום 👋<br><strong>${hostName}</strong> מזמין אותך להצטרף למאגר שלו ב־Ari Stage.<br>לאחר ההצטרפות תוכל לצפות בליינאפים ובשירים שלו (קריאה בלבד).`,
          button: "הצטרף למאגר",
          fallback: "אם הכפתור לא עובד, אפשר להעתיק את הקישור הבא:",
          expiry: "הקישור תקף ל־7 ימים.",
        }
      : {
          subtitle: "Artist pool invitation",
          intro: `Hello 👋<br><strong>${hostName}</strong> invited you to join their Ari Stage pool.<br>After joining, you will be able to view their lineups and songs in read-only mode.`,
          button: "Join the pool",
          fallback: "If the button does not work, copy this link:",
          expiry: "This link is valid for 7 days.",
        };

  return {
    subject: tServer(locale, "email.invitation.subject"),
    html: `
<div style="width:100%; background:#0d0d0d; padding:40px 0; font-family:Arial, sans-serif; direction:${direction}; text-align:${align};">
  <div style="max-width:480px; margin:auto; background:#141414; padding:30px; border-radius:16px; border:1px solid #2a2a2a; direction:${direction}; text-align:${align};">
    <h2 style="text-align:center; color:#ff8800; font-size:26px; margin-bottom:10px; font-weight:bold; direction:${direction};">
      Ari Stage
    </h2>
    <p style="text-align:center; color:#cccccc; font-size:14px; margin-bottom:25px; direction:${direction};">
      ${copy.subtitle}
    </p>
    <p style="color:#e5e5e5; font-size:15px; line-height:1.8; direction:${direction}; text-align:${align};">
      ${copy.intro}
    </p>
    <div style="text-align:center; margin:30px 0; direction:${direction};">
      <a href="${inviteLink}" style="background:#ff8800; color:#000; padding:14px 26px; font-size:16px; font-weight:bold; text-decoration:none; border-radius:10px; display:inline-block; box-shadow:0 0 12px rgba(255,136,0,0.4);">
        ${copy.button}
      </a>
    </div>
    <p style="color:#bbbbbb; font-size:13px; direction:${direction}; text-align:${align};">
      ${copy.fallback}
    </p>
    <p style="color:#ffbb66; font-size:13px; word-break:break-all; background:#1f1f1f; padding:10px; border-radius:8px; margin-top:8px; direction:ltr; text-align:left;">
      ${inviteLink}
    </p>
    <p style="color:#999; font-size:12px; margin-top:20px; direction:${direction}; text-align:${align};">
      ${copy.expiry}
    </p>
  </div>
</div>`,
  };
}
