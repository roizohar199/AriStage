import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { AppError } from "../../core/errors";
import { env } from "../../config/env";
import { logger } from "../../core/logger";
import { transporter } from "../../integrations/mail/transporter";
import {
  buildResetPasswordEmail,
  tServer,
  translatePasswordPolicyErrors,
  type ServerLocale,
} from "../../i18n/serverI18n";
import { activateTrialForUser } from "../../services/subscriptionService";
import {
  createUser,
  findUserByEmail,
  findUserByResetToken,
  saveResetToken,
  updatePassword,
} from "./auth.repository";
import { generateRefreshToken } from "./refreshToken.service";
import { is2FAEnabled } from "./twoFactor.service";
import { signToken } from "./token.service";
import {
  clearFailedAttempts,
  isAccountLocked,
  recordFailedAttempt,
} from "../security/accountLockout.service";
import {
  logAuthEvent,
  logSecurityIncident,
} from "../security/auditLogger.service";
import { validatePassword } from "../security/passwordPolicy";
import { resolveSubscriptionStatus } from "../subscriptions/resolveSubscriptionStatus";
import { touchUserLastSeen } from "../users/users.repository";

export function getResetSafeResponse(locale: ServerLocale) {
  return {
    message: tServer(locale, "auth.resetSafeResponse"),
  };
}

export async function loginUser(
  email: string,
  password: string,
  locale: ServerLocale,
  ipAddress?: string,
  userAgent?: string,
) {
  if (!email || !password) {
    throw new AppError(400, tServer(locale, "auth.emailAndPasswordRequired"));
  }

  const lockStatus = isAccountLocked(email);
  if (lockStatus.locked) {
    const minutes = Math.ceil((lockStatus.remainingTime ?? 0) / 60);
    throw new AppError(
      429,
      tServer(locale, "auth.accountLockedMinutes", { minutes }),
    );
  }

  const user = await findUserByEmail(email);
  if (!user) {
    recordFailedAttempt(email);
    await logAuthEvent("FAILED_LOGIN", undefined, ipAddress, userAgent, {
      email,
    });
    throw new AppError(401, tServer(locale, "auth.invalidCredentials"));
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const shouldLock = recordFailedAttempt(email);

    await logAuthEvent("FAILED_LOGIN", user.id, ipAddress, userAgent, {
      email,
    });

    if (shouldLock) {
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
        tServer(locale, "auth.accountLockedFifteenMinutes"),
      );
    }

    const updatedStatus = isAccountLocked(email);
    const attemptsLeft = updatedStatus.attemptsRemaining || 0;
    throw new AppError(
      401,
      attemptsLeft > 0
        ? tServer(locale, "auth.invalidPasswordAttemptsLeft", { attemptsLeft })
        : tServer(locale, "auth.invalidPassword"),
    );
  }

  clearFailedAttempts(email);
  void touchUserLastSeen(user.id).catch(() => undefined);

  const requires2FA = await is2FAEnabled(user.id);

  if (requires2FA) {
    logger.info("2FA required for login", { userId: user.id, email });
    await logAuthEvent("LOGIN", user.id, ipAddress, userAgent, {
      email,
      requires2FA: true,
      step: "awaiting_2fa",
    });

    return {
      requires2FA: true,
      userId: user.id,
      email: user.email,
      message: tServer(locale, "auth.twoFactorRequired"),
    };
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name || "",
    avatar: user.avatar || null,
    artist_role: user.artist_role || null,
    preferred_locale: user.preferred_locale || "he-IL",
  });

  const { token: refreshToken, expiresAt: refreshExpiresAt } =
    await generateRefreshToken(user.id, ipAddress, userAgent);

  let subscription_status = user.subscription_status;
  if (user.role !== "admin") {
    subscription_status = resolveSubscriptionStatus(user);
  }

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

export async function complete2FALogin(
  userId: number,
  token: string,
  locale: ServerLocale,
  ipAddress?: string,
  userAgent?: string,
) {
  const { verify2FA } = await import("./twoFactor.service");
  await verify2FA(userId, token, locale);

  const { findUserById } = await import("../users/users.repository");
  const loginUserRecord = await findUserById(userId);
  const user = loginUserRecord?.email
    ? await findUserByEmail(loginUserRecord.email)
    : null;

  if (!user) {
    throw new AppError(404, tServer(locale, "auth.userNotFound"));
  }

  const accessToken = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name || "",
    avatar: user.avatar || null,
    artist_role: user.artist_role || null,
    preferred_locale: user.preferred_locale || "he-IL",
  });

  const { token: refreshToken, expiresAt: refreshExpiresAt } =
    await generateRefreshToken(user.id, ipAddress, userAgent);

  let subscription_status = user.subscription_status;
  if (user.role !== "admin") {
    subscription_status = resolveSubscriptionStatus(user);
  }

  logger.info("2FA login completed", { userId, email: user.email });

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

export async function registerUser(payload: any, locale: ServerLocale) {
  const { full_name, email, password, artist_role, tempAvatar } = payload;

  const preferredLocaleRaw = payload?.preferred_locale;
  let preferred_locale = preferredLocaleRaw
    ? String(preferredLocaleRaw).trim().replace(/_/g, "-")
    : locale;

  if (!preferred_locale || preferred_locale.length > 16) {
    preferred_locale = locale;
  }
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(preferred_locale)) {
    preferred_locale = locale;
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
    throw new AppError(400, tServer(locale, "auth.registrationMissingFields"));
  }

  logger.info("🟡 [REGISTER] בודק אם האימייל קיים...");
  const existing = await findUserByEmail(email);
  if (existing) {
    logger.error("❌ [REGISTER] האימייל כבר קיים", { email });
    throw new AppError(409, tServer(locale, "auth.emailAlreadyExists"));
  }

  logger.info("🟡 [REGISTER] בודק מדיניות סיסמה...");
  const passwordValidation = validatePassword(password, {
    email,
    fullName: full_name,
  });
  if (!passwordValidation.valid) {
    throw new AppError(
      400,
      translatePasswordPolicyErrors(locale, passwordValidation.errors).join(
        ". ",
      ),
    );
  }

  logger.info("🟡 [REGISTER] יוצר hash לסיסמה...");
  const password_hash = await bcrypt.hash(password, 10);

  logger.info("🟡 [REGISTER] יוצר משתמש חדש במסד הנתונים...");
  const userId = await createUser({
    full_name,
    email,
    password_hash,
    role: "user",
    subscription_type: "trial",
    subscription_status: "trial",
    subscription_expires_at: null,
    preferred_locale,
    artist_role: artist_role || null,
    avatar: null,
  });

  await activateTrialForUser(userId);

  logger.info("✅ [REGISTER] משתמש נוצר", { userId });

  let finalAvatarPath: string | null = null;

  if (tempAvatar) {
    logger.info("🟡 [REGISTER] מעלה תמונה...", { tempAvatar });
    const ext = path.extname(tempAvatar);
    const userDir = path.join("uploads", "users", String(userId));

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const finalPath = path.join(userDir, `avatar${ext}`);
    fs.renameSync(tempAvatar, finalPath);

    finalAvatarPath = `/uploads/users/${userId}/avatar${ext}`;
    await updateAvatarColumn(userId, finalAvatarPath);
    logger.info("✅ [REGISTER] תמונה הועלתה", { finalAvatarPath });
  }

  logger.info("✅ [REGISTER] registerUser הושלם בהצלחה", { userId, email });

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

async function updateAvatarColumn(id: number, avatarPath: string) {
  await import("../../database/pool").then(({ pool }) =>
    pool.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, id]),
  );
}

export async function requestPasswordReset(
  email: string,
  locale: ServerLocale,
) {
  if (!email) return getResetSafeResponse(locale);

  const user = await findUserByEmail(email);
  if (!user) return getResetSafeResponse(locale);

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 15 * 60 * 1000;

  await saveResetToken(user.id, token, expires);

  const link = `${env.clientUrl}/reset/${token}`;

  await logAuthEvent(
    "PASSWORD_RESET_REQUESTED",
    user.id,
    undefined,
    undefined,
    {
      email,
    },
  );

  const mail = buildResetPasswordEmail(locale, link);

  await transporter.sendMail({
    from: env.mail.user,
    to: email,
    subject: mail.subject,
    html: mail.html,
  });

  return getResetSafeResponse(locale);
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
  locale: ServerLocale,
) {
  if (!token || !password) {
    throw new AppError(400, tServer(locale, "auth.resetMissingData"));
  }

  const user = await findUserByResetToken(token);
  if (!user) {
    throw new AppError(400, tServer(locale, "auth.resetInvalidOrExpired"));
  }

  const passwordValidation = validatePassword(password, {
    email: user.email,
    fullName: user.full_name,
  });
  if (!passwordValidation.valid) {
    throw new AppError(
      400,
      translatePasswordPolicyErrors(locale, passwordValidation.errors).join(
        ". ",
      ),
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  await updatePassword(user.id, hashed);

  clearFailedAttempts(user.email);

  await logAuthEvent("PASSWORD_RESET", user.id, undefined, undefined, {
    email: user.email,
  });
}
