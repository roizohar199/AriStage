import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { AppError } from "../../core/errors";
import { signToken } from "./token.service";
import {
  createUser,
  findUserByEmail,
  findUserByResetToken,
  saveResetToken,
  updatePassword,
} from "./auth.repository";

import { transporter } from "../../integrations/mail/transporter";
import { env } from "../../config/env";
import { logger } from "../../core/logger";
import { resolveSubscriptionStatus } from "../subscriptions/resolveSubscriptionStatus";
import { touchUserLastSeen } from "../users/users.repository";
import { activateTrialForUser } from "../../services/subscriptionService";
import {
  recordFailedAttempt,
  isAccountLocked,
  clearFailedAttempts,
} from "../security/accountLockout.service";
import { validatePassword } from "../security/passwordPolicy";
import { generateRefreshToken } from "./refreshToken.service";
import { is2FAEnabled } from "./twoFactor.service";
import {
  logAuthEvent,
  logSecurityIncident,
} from "../security/auditLogger.service";

export const resetSafeResponse = {
  message: "אם המייל קיים — נשלח אליו קישור לאיפוס",
};

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function addDaysMysqlDateTime(days: number): string {
  const ms = Date.now() + days * 24 * 60 * 60 * 1000;
  return toMysqlDateTime(new Date(ms));
}

//
// ======================= LOGIN =======================
//
export async function loginUser(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
) {
  if (!email || !password) {
    throw new AppError(400, "נא להזין אימייל וסיסמה");
  }

  // Check if account is locked due to too many failed attempts
  const lockStatus = isAccountLocked(email);
  if (lockStatus.locked) {
    const minutes = Math.ceil(lockStatus.remainingTime! / 60);
    throw new AppError(
      429,
      `חשבון זה נעול זמנית בשל ניסיונות התחברות רבים. נסה שוב בעוד ${minutes} דקות.`,
    );
  }

  const user = await findUserByEmail(email);
  if (!user) {
    // Record failed attempt even if user doesn't exist (prevent enumeration)
    recordFailedAttempt(email);
    // Log failed login attempt
    await logAuthEvent("FAILED_LOGIN", undefined, ipAddress, userAgent, {
      email,
    });
    throw new AppError(401, "אימייל או סיסמה שגויים");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    // Record failed attempt
    const shouldLock = recordFailedAttempt(email);
    // Log failed login
    await logAuthEvent("FAILED_LOGIN", user.id, ipAddress, userAgent, {
      email,
    });

    if (shouldLock) {
      // Log account lock
      await logAuthEvent("ACCOUNT_LOCKED", user.id, ipAddress, userAgent, {
        email,
        reason: "too_many_failed_attempts",
      });
      await logSecurityIncident(
        "BRUTE_FORCE_DETECTED",
        user.id,
        ipAddress,
        userAgent,
        { email },
      );
      throw new AppError(
        429,
        "יותר מדי ניסיונות התחברות כושלים. חשבון זה ננעל זמנית למשך 15 דקות.",
      );
    }

    // Show remaining attempts
    const updatedStatus = isAccountLocked(email);
    const attemptsLeft = updatedStatus.attemptsRemaining || 0;
    throw new AppError(
      401,
      attemptsLeft > 0
        ? `סיסמה שגויה. נותרו ${attemptsLeft} ניסיונות.`
        : "סיסמה שגויה",
    );
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(email);

  // Best-effort activity stamp (do not block login on DB issues).
  void touchUserLastSeen(user.id).catch(() => undefined);

  // Check if 2FA is enabled
  const requires2FA = await is2FAEnabled(user.id);

  // If 2FA is enabled, return special response instead of tokens
  if (requires2FA) {
    logger.info("2FA required for login", { userId: user.id, email });
    // Log that 2FA is required (not yet completed)
    await logAuthEvent("LOGIN", user.id, ipAddress, userAgent, {
      email,
      requires2FA: true,
      step: "awaiting_2fa",
    });

    let subscription_status = user.subscription_status;
    if (user.role !== "admin") {
      subscription_status = resolveSubscriptionStatus(user);
    }

    return {
      requires2FA: true,
      userId: user.id,
      email: user.email,
      message: "2FA verification required",
    };
  }

  // Generate access token (short-lived)
  const token = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name || "",
    avatar: user.avatar || null,
    artist_role: user.artist_role || null,
  });

  // Generate refresh token (long-lived)
  const { token: refreshToken, expiresAt: refreshExpiresAt } =
    await generateRefreshToken(user.id, ipAddress, userAgent);

  let subscription_status = user.subscription_status;
  // Admin is authoritative — do not auto-resolve if set by admin
  if (user.role !== "admin") {
    subscription_status = resolveSubscriptionStatus(user);
  }

  // Log successful login
  await logAuthEvent("LOGIN", user.id, ipAddress, userAgent, {
    email,
    has2FA: false,
  });

  return {
    id: user.id,
    full_name: user.full_name || "",
    email: user.email,
    role: user.role,
    artist_role: user.artist_role || null,
    avatar: user.avatar || null,
    preferred_locale: user.preferred_locale || "he-IL",
    subscription_type: user.subscription_type ?? null,
    subscription_status,
    subscription_expires_at: user.subscription_expires_at ?? null,
    token,
    refreshToken,
    refreshExpiresAt,
  };
}

//
// =============== COMPLETE 2FA LOGIN ==================
//
export async function complete2FALogin(
  userId: number,
  token: string,
  ipAddress?: string,
  userAgent?: string,
) {
  // Verify 2FA token (throws if invalid)
  const { verify2FA } = await import("./twoFactor.service");
  await verify2FA(userId, token);

  // Get user data
  const user = await findUserByEmail(
    (await import("../users/users.repository"))
      .findUserById(userId)
      .then((u) => u?.email || ""),
  );

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Generate tokens
  const accessToken = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name || "",
    avatar: user.avatar || null,
    artist_role: user.artist_role || null,
  });

  const { token: refreshToken, expiresAt: refreshExpiresAt } =
    await generateRefreshToken(user.id, ipAddress, userAgent);

  let subscription_status = user.subscription_status;
  if (user.role !== "admin") {
    subscription_status = resolveSubscriptionStatus(user);
  }

  logger.info("2FA login completed", { userId, email: user.email });

  // Log successful 2FA login
  await logAuthEvent("LOGIN", user.id, ipAddress, userAgent, {
    email: user.email,
    has2FA: true,
    step: "completed",
  });

  return {
    id: user.id,
    full_name: user.full_name || "",
    email: user.email,
    role: user.role,
    artist_role: user.artist_role || null,
    avatar: user.avatar || null,
    preferred_locale: user.preferred_locale || "he-IL",
    subscription_type: user.subscription_type ?? null,
    subscription_status,
    subscription_expires_at: user.subscription_expires_at ?? null,
    token: accessToken,
    refreshToken,
    refreshExpiresAt,
  };
}

//
// ======================= REGISTER =======================
//
export async function registerUser(payload) {
  const { full_name, email, password, artist_role, tempAvatar } = payload;

  const preferred_locale_raw = payload?.preferred_locale;
  let preferred_locale = preferred_locale_raw
    ? String(preferred_locale_raw).trim().replace(/_/g, "-")
    : "he-IL";
  if (!preferred_locale || preferred_locale.length > 16) {
    preferred_locale = "he-IL";
  }
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(preferred_locale)) {
    preferred_locale = "he-IL";
  }

  logger.info("🟡 [REGISTER] registerUser התחיל", {
    full_name,
    email,
    hasPassword: !!password,
    artist_role,
    hasTempAvatar: !!tempAvatar,
  });

  if (!full_name || !email || !password) {
    logger.error("❌ [REGISTER] שדות חסרים", {
      full_name,
      email,
      hasPassword: !!password,
    });
    throw new AppError(400, "נא למלא את כל השדות");
  }

  logger.info("🟡 [REGISTER] בודק אם האימייל קיים...");
  const existing = await findUserByEmail(email);
  if (existing) {
    logger.error("❌ [REGISTER] האימייל כבר קיים", { email });
    throw new AppError(409, "האימייל כבר קיים במערכת");
  }

  // Validate password against policy
  logger.info("🟡 [REGISTER] בודק מדיניות סיסמה...");
  const passwordValidation = validatePassword(password, {
    email,
    fullName: full_name,
  });
  if (!passwordValidation.valid) {
    throw new AppError(400, passwordValidation.errors.join(". "));
  }

  logger.info("🟡 [REGISTER] יוצר hash לסיסמה...");
  const password_hash = await bcrypt.hash(password, 10);

  logger.info("🟡 [REGISTER] יוצר משתמש חדש במסד הנתונים...");
  // 1️⃣ צור משתמש חדש ללא תמונה בשלב זה
  const userId = await createUser({
    full_name,
    email,
    password_hash,
    role: "user",
    subscription_type: "trial",
    subscription_status: "trial",
    // Will be set according to dynamic trial_days
    subscription_expires_at: null,
    preferred_locale,
    artist_role: artist_role || null,
    avatar: null,
  });

  // Ensure trial uses dynamic trial_days and records subscription_started_at
  await activateTrialForUser(userId);

  logger.info("✅ [REGISTER] משתמש נוצר", { userId });

  let finalAvatarPath: string | null = null;

  // 2️⃣ אם המשתמש העלה תמונה → העבר אותה לתיקיית המשתמש
  if (tempAvatar) {
    logger.info("🟡 [REGISTER] מעלה תמונה...", { tempAvatar });
    const ext = path.extname(tempAvatar);
    const userDir = path.join("uploads", "users", String(userId));

    // צור תיקייה אישית
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const finalPath = path.join(userDir, "avatar" + ext);

    // העברת הקובץ
    fs.renameSync(tempAvatar, finalPath);

    // נתיב שיישמר ב־DB
    finalAvatarPath = `/uploads/users/${userId}/avatar${ext}`;

    // עדכון DB
    await updateAvatarColumn(userId, finalAvatarPath);
    logger.info("✅ [REGISTER] תמונה הועלתה", { finalAvatarPath });
  }

  logger.info("✅ [REGISTER] registerUser הושלם בהצלחה", { userId, email });

  // Log successful registration
  await logAuthEvent("REGISTER", userId, undefined, undefined, {
    email,
    full_name,
  });

  return {
    id: userId,
    full_name,
    email,
    artist_role: artist_role || null,
    avatar: finalAvatarPath,
  };
}

//
// עזר קטן: עדכון שדה avatar בטבלה
//
async function updateAvatarColumn(id, avatarPath) {
  await import("../../database/pool").then(({ pool }) =>
    pool.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, id]),
  );
}

//
// ================= PASSWORD RESET REQUEST =================
//
export async function requestPasswordReset(email) {
  if (!email) return resetSafeResponse;

  const user = await findUserByEmail(email);
  if (!user) return resetSafeResponse;

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 15 * 60 * 1000;

  await saveResetToken(user.id, token, expires);

  const link = `${env.clientUrl}/reset/${token}`;

  // Log password reset request
  await logAuthEvent(
    "PASSWORD_RESET_REQUESTED",
    user.id,
    undefined,
    undefined,
    { email },
  );

  //
  // ⭐ עיצוב המייל שלך נשאר 1:1 כמו המקור
  //
  await transporter.sendMail({
    from: env.mail.user,
    to: email,
    subject: "איפוס סיסמה - Ari Stage",
    html: `
<div style="width:100%; background:#0d0d0d; padding:40px 0; font-family:Arial, sans-serif; direction:rtl; text-align:right;">

  <div style="max-width:480px; margin:auto; background:#141414; padding:30px; border-radius:16px; border:1px solid #2a2a2a; direction:rtl; text-align:right;">

    <h2 style="
      text-align:center;
      color:#ff8800;
      font-size:26px;
      margin-bottom:10px;
      font-weight:bold;
      direction:rtl;
    ">
      Ari Stage
    </h2>

    <p style="
      text-align:center;
      color:#cccccc;
      font-size:14px;
      margin-bottom:25px;
      direction:rtl;
    ">
      בקשה לאיפוס סיסמה
    </p>

    <p style="color:#e5e5e5; font-size:15px; line-height:1.8; direction:rtl;">
      שלום 👋<br>
      התקבלה בקשה לאיפוס הסיסמה שלך.
      <br>
      לחץ על הכפתור למטה כדי להגדיר סיסמה חדשה:
    </p>

    <div style="text-align:center; margin:30px 0; direction:rtl;">
      <a href="${link}"
        style="
          background:#ff8800;
          color:#000;
          padding:14px 26px;
          font-size:16px;
          font-weight:bold;
          text-decoration:none;
          border-radius:10px;
          display:inline-block;
          box-shadow:0 0 12px rgba(255,136,0,0.4);
        ">
        איפוס סיסמה
      </a>
    </div>

    <p style="color:#bbbbbb; font-size:13px; direction:rtl;">
      אם הכפתור לא עובד, אפשר להעתיק את הקישור הבא:
    </p>

    <p style="
      color:#ffbb66;
      font-size:13px;
      word-break:break-all;
      background:#1f1f1f;
      padding:10px;
      border-radius:8px;
      margin-top:8px;
      direction:ltr;
      text-align:left;
    ">
      ${link}
    </p>

    <hr style="border:none; border-top:1px solid #333; margin:30px 0;">

    <p style="color:#666; font-size:12px; text-align:center; direction:rtl;">
      הקישור תקף ל־15 דקות בלבד.
      <br><br>
      Ari Stage © 2025
    </p>

  </div>
</div>`,
  });

  return resetSafeResponse;
}

//
// ============= RESET PASSWORD CONFIRMATION =============
//
export async function resetPasswordWithToken(token, password) {
  if (!token || !password) {
    throw new AppError(400, "חסרים נתונים לאיפוס הסיסמה");
  }

  const user = await findUserByResetToken(token);
  if (!user) {
    throw new AppError(400, "הקישור לא תקף או שפג תוקפו");
  }

  // Validate new password against policy
  const passwordValidation = validatePassword(password, {
    email: user.email,
    fullName: user.full_name,
  });
  if (!passwordValidation.valid) {
    throw new AppError(400, passwordValidation.errors.join(". "));
  }

  const hashed = await bcrypt.hash(password, 10);
  await updatePassword(user.id, hashed);

  // Clear any failed login attempts after successful password reset
  clearFailedAttempts(user.email);

  // Log successful password reset
  await logAuthEvent("PASSWORD_RESET", user.id, undefined, undefined, {
    email: user.email,
  });
}
