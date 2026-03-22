import bcrypt from "bcryptjs";
import { AppError } from "../../core/errors";
import { signToken } from "../auth/token.service";
import fs from "fs";
import path from "path";
import { joinUploadsPath } from "../../utils/uploadsRoot";

import {
  findMyCollection,
  findConnectedToMe,
  inviteArtist as inviteArtistRepo,
  uninviteArtist as uninviteArtistRepo,
  leaveCollection as leaveCollectionRepo,
  isGuest,
  saveInvitation,
  findInvitationByToken,
  markInvitationAsUsed,
  acceptInvitationStatus as acceptInvitationStatusRepo,
  rejectInvitationStatus as rejectInvitationStatusRepo,
} from "./users.repository";
import {
  deleteUserById,
  findUserByEmail,
  findUserById,
  getCurrentUser,
  insertUser,
  listUsers,
  updatePassword,
  updateSettings,
  updateUserRecord,
} from "./users.repository";
import crypto from "crypto";
import { transporter } from "../../integrations/mail/transporter";
import { env } from "../../config/env";
import { getPlanByKey } from "../plans/plans.repository";
import { getTrialDays } from "../../services/trialUtils";
import {
  buildArtistInvitationEmail,
  tServer,
  type ServerLocale,
} from "../../i18n/serverI18n";

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function addDaysMysqlDateTime(days: number): string {
  const ms = Date.now() + days * 24 * 60 * 60 * 1000;
  return toMysqlDateTime(new Date(ms));
}

export function getProfile(userId) {
  return getCurrentUser(userId);
}

// ⭐ מי הזמין אותי (מאגר אמנים)
export function getMyCollection(userId) {
  return findMyCollection(userId);
}

// ⭐ מי אני הזמנתי (מחוברים אליי)
export function getMyConnections(userId) {
  return findConnectedToMe(userId);
}

export async function updateProfile(
  userId,
  payload,
  locale: ServerLocale = "he-IL",
) {
  // ⭐ יש עדכון רק אם אחד מהשדות לא undefined
  const hasUpdates =
    payload.full_name !== undefined ||
    payload.email !== undefined ||
    payload.theme !== undefined ||
    payload.preferred_locale !== undefined ||
    payload.artist_role !== undefined ||
    payload.avatar !== undefined; // כאן avatar מגיע כמחרוזת מה-controller

  if (!hasUpdates) {
    throw new AppError(400, tServer(locale, "users.noUpdateData"));
  }

  let preferredLocale: string | undefined;
  if (payload.preferred_locale !== undefined) {
    if (payload.preferred_locale === null) {
      throw new AppError(400, tServer(locale, "users.preferredLocaleNull"));
    }
    const raw = String(payload.preferred_locale).trim();
    if (!raw) {
      throw new AppError(400, tServer(locale, "users.preferredLocaleEmpty"));
    }
    if (raw.length > 16) {
      throw new AppError(400, tServer(locale, "users.preferredLocaleTooLong"));
    }
    if (raw.toLowerCase() === "auto") {
      preferredLocale = "auto";
    } else {
      // Lightweight validation for BCP-47-ish tags (e.g. he, he-IL, en-US)
      if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(raw)) {
        throw new AppError(
          400,
          tServer(locale, "users.preferredLocaleInvalid"),
        );
      }
      preferredLocale = raw;
    }
  }

  const affected = await updateSettings(userId, {
    full_name: payload.full_name ?? undefined,
    email: payload.email ?? undefined,
    theme: payload.theme ?? undefined,
    preferred_locale: preferredLocale ?? undefined,
    artist_role: payload.artist_role ?? undefined,
    // allow explicit null to clear avatar
    avatar: payload.avatar === undefined ? undefined : payload.avatar,
  });

  if (!affected) {
    throw new AppError(400, tServer(locale, "users.updateFailed"));
  }

  return getCurrentUser(userId);
}

function avatarToAbsolutePath(avatar: any): string | null {
  if (!avatar || typeof avatar !== "string") return null;

  // support either a stored relative path (/uploads/...) or a full URL
  let pathname = avatar;
  try {
    if (/^https?:\/\//i.test(avatar)) {
      pathname = new URL(avatar).pathname;
    }
  } catch {
    // ignore parse errors and fall back to raw string
  }

  const clean = String(pathname).replace(/^\/?uploads\//, "");
  if (!clean || clean === pathname) {
    // if it didn't look like an uploads path, don't delete anything
    return null;
  }

  const normalized = clean.split("/").filter(Boolean);
  return joinUploadsPath(...normalized);
}

export async function deleteAvatar(userId, locale: ServerLocale = "he-IL") {
  const user = await getCurrentUser(userId);
  if (!user) {
    throw new AppError(404, tServer(locale, "auth.userNotFound"));
  }

  const currentAvatar = user.avatar;
  const absolutePath = avatarToAbsolutePath(currentAvatar);

  const updatedUser = await updateProfile(userId, { avatar: null }, locale);

  if (absolutePath) {
    try {
      await fs.promises.unlink(absolutePath);
    } catch {
      // best-effort: ignore missing file / permission issues
    }

    // also try removing the user upload dir if it became empty
    try {
      const dir = path.dirname(absolutePath);
      const entries = await fs.promises.readdir(dir);
      if (entries.length === 0) {
        await fs.promises.rmdir(dir);
      }
    } catch {
      // ignore
    }
  }

  return updatedUser;
}

export async function changePassword(
  userId,
  newPassword,
  locale: ServerLocale = "he-IL",
) {
  if (!newPassword?.trim()) {
    throw new AppError(400, tServer(locale, "users.newPasswordRequired"));
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await updatePassword(userId, hash);
}

export function getUsers(user) {
  return listUsers(user.role, user.id);
}

export async function createUserAccount(
  currentUser,
  payload,
  locale: ServerLocale = "he-IL",
) {
  if (!payload.email || !payload.password || !payload.full_name) {
    throw new AppError(400, tServer(locale, "users.createMissingFields"));
  }

  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new AppError(400, tServer(locale, "auth.emailAlreadyExists"));
  }

  const hash = await bcrypt.hash(payload.password, 10);

  const nextTypeRaw =
    payload.subscription_type !== undefined
      ? payload.subscription_type
      : "trial";
  let nextTypeLower = String(nextTypeRaw ?? "")
    .trim()
    .toLowerCase();
  if (!nextTypeLower) {
    nextTypeLower = "trial";
  }
  if (nextTypeLower !== "trial") {
    const plan = await getPlanByKey(nextTypeLower);
    if (!plan) {
      throw new AppError(
        400,
        tServer(locale, "users.invalidSubscriptionType", {
          value: nextTypeLower,
        }),
      );
    }
  }
  const subscription_status = nextTypeLower === "trial" ? "trial" : "active";
  const subscription_expires_at =
    nextTypeLower === "trial"
      ? addDaysMysqlDateTime(await getTrialDays())
      : addDaysMysqlDateTime(30);

  await insertUser({
    full_name: payload.full_name,
    email: payload.email,
    password_hash: hash,
    role: payload.role || "user",
    subscription_type: nextTypeLower ? nextTypeLower : "trial",
    subscription_status,
    subscription_expires_at,
    // לא צריך invited_by יותר - נשתמש בטבלת user_hosts
  });
}

export async function updateUserAccount(
  requestingUser,
  id,
  payload,
  locale: ServerLocale = "he-IL",
) {
  if (requestingUser.role !== "admin" && requestingUser.id !== Number(id)) {
    throw new AppError(403, tServer(locale, "users.updateForbidden"));
  }

  const isAdmin = requestingUser.role === "admin";

  const updates: any = {};

  if (payload.full_name !== undefined) {
    updates.full_name = payload.full_name;
  }

  // תפקיד ניתן לשינוי בעיקר דרך אדמין
  if (payload.role !== undefined && isAdmin) {
    updates.role = payload.role;
  }

  // ✅ טיפול במסלול (tier) – שומר על ההתנהגות הקודמת
  let nextTypeLower: string | undefined;
  if (payload.subscription_type !== undefined) {
    nextTypeLower = String(payload.subscription_type ?? "")
      .trim()
      .toLowerCase();

    if (!nextTypeLower) {
      throw new AppError(
        400,
        tServer(locale, "users.invalidSubscriptionType", { value: "" }),
      );
    }
    if (nextTypeLower !== "trial") {
      const plan = await getPlanByKey(nextTypeLower);
      if (!plan) {
        throw new AppError(
          400,
          tServer(locale, "users.invalidSubscriptionType", {
            value: nextTypeLower,
          }),
        );
      }
    }

    updates.subscription_type = nextTypeLower;
  }

  // Subscription updates are intentionally handled via AdminUsers API only.
  // Ignore any subscription_status/subscription_started_at/subscription_expires_at in this endpoint.

  await updateUserRecord(id, updates);
}

export function removeUserAccount(id) {
  return deleteUserById(id);
}

export async function impersonateUser(id, locale: ServerLocale = "he-IL") {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError(404, tServer(locale, "auth.userNotFound"));
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name,
    artist_role: user.artist_role || null,
    avatar: user.avatar || null,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      preferred_locale: user.preferred_locale,
      subscription_type: user.subscription_type,
      artist_role: user.artist_role,
      avatar: user.avatar,
    },
  };
}

// ⭐ הזמנת אמן למאגר שלי
export async function inviteArtistToMyCollection(
  hostId,
  artistId,
  locale: ServerLocale = "he-IL",
) {
  if (hostId === artistId) {
    throw new AppError(400, tServer(locale, "users.cannotInviteSelf"));
  }

  const artist = await findUserById(artistId);
  if (!artist) {
    throw new AppError(404, tServer(locale, "users.artistNotFound"));
  }

  // בדיקה אם האמן כבר מוזמן על ידי המארח הזה
  const { isGuest } = await import("./users.repository");
  const existingHosts = await isGuest(artistId);
  if (existingHosts.includes(hostId)) {
    throw new AppError(400, tServer(locale, "users.artistAlreadyInvited"));
  }

  const success = await inviteArtistRepo(artistId, hostId);
  if (!success) {
    throw new AppError(400, tServer(locale, "users.invitationFailed"));
  }

  return { message: tServer(locale, "users.artistInvited") };
}

// ⭐ ביטול הזמנת אמן מהמאגר שלי
export async function uninviteArtistFromMyCollection(
  hostId,
  artistId,
  locale: ServerLocale = "he-IL",
) {
  if (hostId === artistId) {
    throw new AppError(400, tServer(locale, "users.cannotUninviteSelf"));
  }

  const artist = await findUserById(artistId);
  if (!artist) {
    throw new AppError(404, tServer(locale, "users.artistNotFound"));
  }

  const success = await uninviteArtistRepo(artistId, hostId);
  if (!success) {
    throw new AppError(400, tServer(locale, "users.uninviteFailed"));
  }

  return { message: tServer(locale, "users.shareCancelled") };
}

// ⭐ אורח מבטל את השתתפותו במאגר (כל המארחים או מארח ספציפי)
export async function leaveMyCollection(
  artistId,
  hostId: number | null = null,
  locale: ServerLocale = "he-IL",
) {
  const { isGuest } = await import("./users.repository");
  const existingHosts = await isGuest(artistId);
  const existingHostsArray: number[] = Array.isArray(existingHosts)
    ? existingHosts
    : existingHosts
      ? [existingHosts]
      : [];

  if (existingHostsArray.length === 0) {
    throw new AppError(400, tServer(locale, "users.notGuestAnyPool"));
  }

  if (hostId && !existingHostsArray.includes(hostId)) {
    throw new AppError(400, tServer(locale, "users.notGuestThisPool"));
  }

  const success = await leaveCollectionRepo(artistId, hostId);
  if (!success) {
    throw new AppError(400, tServer(locale, "users.leaveCollectionFailed"));
  }

  return {
    message: hostId
      ? tServer(locale, "users.leftCollection")
      : tServer(locale, "users.leftAllCollections"),
  };
}

// ⭐ קבלת הזמנות ממתינות לאישור
export async function getPendingInvitations(userId) {
  const { findPendingInvitations } = await import("./users.repository");
  return await findPendingInvitations(userId);
}

// ⭐ אישור הזמנה
export async function acceptInvitationStatus(
  userId,
  hostId,
  locale: ServerLocale = "he-IL",
) {
  const success = await acceptInvitationStatusRepo(userId, hostId);
  if (!success) {
    throw new AppError(400, tServer(locale, "users.pendingInvitationNotFound"));
  }
  return { message: tServer(locale, "users.invitationAccepted") };
}

// ⭐ דחיית הזמנה
export async function rejectInvitationStatus(
  userId,
  hostId,
  locale: ServerLocale = "he-IL",
) {
  const success = await rejectInvitationStatusRepo(userId, hostId);
  if (!success) {
    throw new AppError(400, tServer(locale, "users.pendingInvitationNotFound"));
  }
  return { message: tServer(locale, "users.invitationRejected") };
}

// ⭐ בדיקה אם משתמש הוא אורח - מחזיר רשימת מארחים
// הערה: "guest" הוא מצב יחסים בטבלת user_hosts (guest_id/host_id)
// ולא role חדש. שדה role ב-users נשאר אחד מ-"admin"/"manager"/"user" בלבד.
export async function checkIfGuest(userId) {
  const hostIds = await isGuest(userId);
  return hostIds.length > 0 ? hostIds : null; // מחזיר null אם אין מארחים, או רשימה
}

// ⭐ בדיקה אם משתמש הוא מארח
export async function checkIfHost(userId) {
  const { isHost } = await import("./users.repository");
  return await isHost(userId);
}

// ⭐ שליחת הזמנה במייל
export async function sendArtistInvitation(
  hostId,
  hostName,
  email,
  locale: ServerLocale = "he-IL",
) {
  if (!email || !email.includes("@")) {
    throw new AppError(400, tServer(locale, "users.invalidEmail"));
  }

  // בדיקה אם המשתמש כבר קיים במערכת
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    // אם המשתמש כבר קיים, נזמין אותו ישירות
    if (existingUser.id === hostId) {
      throw new AppError(400, tServer(locale, "users.cannotInviteSelf"));
    }

    // בדיקה אם כבר מוזמן על ידי המארח הזה
    const { isGuest } = await import("./users.repository");
    const existingHosts = await isGuest(existingUser.id);
    if (existingHosts.includes(hostId)) {
      throw new AppError(400, tServer(locale, "users.artistAlreadyInvited"));
    }

    // הזמנה ישירה
    await inviteArtistRepo(existingUser.id, hostId);
    return {
      message: tServer(locale, "users.artistInvited"),
      isExistingUser: true,
    };
  }

  // יצירת token להזמנה
  const token = crypto.randomBytes(32).toString("hex");
  await saveInvitation(email, hostId, token);

  // יצירת קישור הזמנה
  const inviteLink = `${env.clientUrl}/invite/${token}`;

  // שליחת מייל
  const mail = buildArtistInvitationEmail(locale, inviteLink, hostName);

  await transporter.sendMail({
    from: env.mail.user,
    to: email,
    subject: mail.subject,
    html: mail.html,
  });

  return {
    message: tServer(locale, "users.invitationSentEmail"),
    isExistingUser: false,
  };
}

// ⭐ טיפול בקישור הזמנה
export async function acceptInvitation(token, locale: ServerLocale = "he-IL") {
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    throw new AppError(
      400,
      tServer(locale, "users.invitationInvalidOrExpired"),
    );
  }

  // סימון ההזמנה כמשומשת
  await markInvitationAsUsed(token);

  // אם המשתמש כבר קיים, הוסף אותו לטבלת user_hosts עם סטטוס pending
  const existingUser = await findUserByEmail(invitation.email);
  if (existingUser) {
    await inviteArtistRepo(existingUser.id, invitation.host_id);
    return {
      message: tServer(locale, "users.invitationSentAwaitingApproval"),
      userId: existingUser.id,
      needsLogin: true,
      needsApproval: true,
    };
  }

  // אם המשתמש לא קיים, נחזיר את המידע להרשמה
  return {
    message: tServer(locale, "users.joinPool"),
    email: invitation.email,
    hostId: invitation.host_id,
    needsRegistration: true,
  };
}
