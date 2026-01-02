import bcrypt from "bcryptjs";
import { AppError } from "../../core/errors.js";
import { signToken } from "../auth/token.service.js";

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
} from "./users.repository.js";
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
} from "./users.repository.js";
import crypto from "crypto";
import { transporter } from "../../integrations/mail/transporter.js";
import { env } from "../../config/env.js";

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

export async function updateProfile(userId, payload) {
  // ⭐ יש עדכון רק אם אחד מהשדות לא undefined
  const hasUpdates =
    payload.full_name !== undefined ||
    payload.email !== undefined ||
    payload.theme !== undefined ||
    payload.artist_role !== undefined ||
    payload.avatar !== undefined; // כאן avatar מגיע כמחרוזת מה-controller

  if (!hasUpdates) {
    throw new AppError(400, "לא נשלחו נתונים לעדכון");
  }

  const affected = await updateSettings(userId, {
    full_name: payload.full_name ?? undefined,
    email: payload.email ?? undefined,
    theme: payload.theme ?? undefined,
    artist_role: payload.artist_role ?? undefined,
    avatar: payload.avatar ?? undefined, // ⭐ פה זה כבר נתיב (string), לא File
  });

  if (!affected) {
    throw new AppError(400, "העדכון נכשל");
  }

  return getCurrentUser(userId);
}

export async function changePassword(userId, newPassword) {
  if (!newPassword?.trim()) {
    throw new AppError(400, "לא הוזנה סיסמה חדשה");
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await updatePassword(userId, hash);
}

export function getUsers(user) {
  return listUsers(user.role, user.id);
}

export async function createUserAccount(currentUser, payload) {
  if (!payload.email || !payload.password || !payload.full_name) {
    throw new AppError(400, "חובה להזין שם מלא, אימייל וסיסמה");
  }

  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new AppError(400, "האימייל כבר קיים במערכת");
  }

  const hash = await bcrypt.hash(payload.password, 10);

  const nextTypeRaw =
    payload.subscription_type !== undefined
      ? payload.subscription_type
      : "trial";
  const nextTypeLower = String(nextTypeRaw ?? "").toLowerCase();
  if (nextTypeLower && nextTypeLower !== "trial" && nextTypeLower !== "pro") {
    throw new AppError(400, `Invalid subscription_type: ${nextTypeLower}`);
  }
  const isPaidTier = nextTypeLower === "pro";
  const subscription_status = isPaidTier ? "active" : "trial";
  const subscription_expires_at = addDaysMysqlDateTime(30);

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

export async function updateUserAccount(requestingUser, id, payload) {
  if (requestingUser.role !== "admin" && requestingUser.id !== Number(id)) {
    throw new AppError(403, "אין לך הרשאה לעדכן משתמש זה");
  }

  const nextTypeLower =
    payload.subscription_type !== undefined
      ? String(payload.subscription_type ?? "").toLowerCase()
      : undefined;

  if (nextTypeLower && nextTypeLower !== "trial" && nextTypeLower !== "pro") {
    throw new AppError(400, `Invalid subscription_type: ${nextTypeLower}`);
  }
  const isPaidTier = nextTypeLower === "pro";

  // If admin changes tier via legacy endpoint, keep consistency with enforcement rules
  const subscription_status =
    requestingUser.role === "admin" && nextTypeLower
      ? isPaidTier
        ? "active"
        : "trial"
      : undefined;

  const subscription_expires_at =
    requestingUser.role === "admin" && nextTypeLower
      ? addDaysMysqlDateTime(30)
      : undefined;

  await updateUserRecord(id, {
    full_name: payload.full_name,
    role: payload.role,
    subscription_type: nextTypeLower,
    subscription_status,
    subscription_expires_at,
  });
}

export function removeUserAccount(id) {
  return deleteUserById(id);
}

export async function impersonateUser(id) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError(404, "משתמש לא נמצא");
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
      subscription_type: user.subscription_type,
      artist_role: user.artist_role,
      avatar: user.avatar,
    },
  };
}

// ⭐ הזמנת אמן למאגר שלי
export async function inviteArtistToMyCollection(hostId, artistId) {
  if (hostId === artistId) {
    throw new AppError(400, "לא ניתן להזמין את עצמך");
  }

  const artist = await findUserById(artistId);
  if (!artist) {
    throw new AppError(404, "אמן לא נמצא");
  }

  // בדיקה אם האמן כבר מוזמן על ידי המארח הזה
  const { isGuest } = await import("./users.repository.js");
  const existingHosts = await isGuest(artistId);
  if (existingHosts.includes(hostId)) {
    throw new AppError(400, "האמן כבר מוזמן על ידי המארח הזה");
  }

  const success = await inviteArtistRepo(artistId, hostId);
  if (!success) {
    throw new AppError(400, "ההזמנה נכשלה");
  }

  return { message: "האמן הוזמן בהצלחה למאגר שלך" };
}

// ⭐ ביטול הזמנת אמן מהמאגר שלי
export async function uninviteArtistFromMyCollection(hostId, artistId) {
  if (hostId === artistId) {
    throw new AppError(400, "לא ניתן לבטל הזמנה של עצמך");
  }

  const artist = await findUserById(artistId);
  if (!artist) {
    throw new AppError(404, "אמן לא נמצא");
  }

  const success = await uninviteArtistRepo(artistId, hostId);
  if (!success) {
    throw new AppError(400, "ביטול ההזמנה נכשל - האמן לא הוזמן על ידך");
  }

  return { message: "השיתוף בוטל בהצלחה" };
}

// ⭐ אורח מבטל את השתתפותו במאגר (כל המארחים או מארח ספציפי)
export async function leaveMyCollection(
  artistId,
  hostId: number | null = null
) {
  const { isGuest } = await import("./users.repository.js");
  const existingHosts = await isGuest(artistId);
  const existingHostsArray: number[] = Array.isArray(existingHosts)
    ? existingHosts
    : existingHosts
    ? [existingHosts]
    : [];

  if (existingHostsArray.length === 0) {
    throw new AppError(400, "אינך אורח במאגר - אין לך השתתפות לבטל");
  }

  if (hostId && !existingHostsArray.includes(hostId)) {
    throw new AppError(400, "אינך אורח במאגר הזה");
  }

  const success = await leaveCollectionRepo(artistId, hostId);
  if (!success) {
    throw new AppError(400, "ביטול ההשתתפות נכשל");
  }

  return {
    message: hostId
      ? "השתתפותך במאגר בוטלה בהצלחה"
      : "כל השתתפויותיך במאגרים בוטלו בהצלחה",
  };
}

// ⭐ קבלת הזמנות ממתינות לאישור
export async function getPendingInvitations(userId) {
  const { findPendingInvitations } = await import("./users.repository.js");
  return await findPendingInvitations(userId);
}

// ⭐ אישור הזמנה
export async function acceptInvitationStatus(userId, hostId) {
  const success = await acceptInvitationStatusRepo(userId, hostId);
  if (!success) {
    throw new AppError(400, "לא נמצאה הזמנה ממתינה לאישור");
  }
  return { message: "הזמנה אושרה בהצלחה" };
}

// ⭐ דחיית הזמנה
export async function rejectInvitationStatus(userId, hostId) {
  const success = await rejectInvitationStatusRepo(userId, hostId);
  if (!success) {
    throw new AppError(400, "לא נמצאה הזמנה ממתינה לאישור");
  }
  return { message: "הזמנה נדחתה" };
}

// ⭐ בדיקה אם משתמש הוא אורח - מחזיר רשימת מארחים
export async function checkIfGuest(userId) {
  const hostIds = await isGuest(userId);
  return hostIds.length > 0 ? hostIds : null; // מחזיר null אם אין מארחים, או רשימה
}

// ⭐ בדיקה אם משתמש הוא מארח
export async function checkIfHost(userId) {
  const { isHost } = await import("./users.repository.js");
  return await isHost(userId);
}

// ⭐ שליחת הזמנה במייל
export async function sendArtistInvitation(hostId, hostName, email) {
  if (!email || !email.includes("@")) {
    throw new AppError(400, "נא להזין כתובת אימייל תקינה");
  }

  // בדיקה אם המשתמש כבר קיים במערכת
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    // אם המשתמש כבר קיים, נזמין אותו ישירות
    if (existingUser.id === hostId) {
      throw new AppError(400, "לא ניתן להזמין את עצמך");
    }

    // בדיקה אם כבר מוזמן על ידי המארח הזה
    const { isGuest } = await import("./users.repository.js");
    const existingHosts = await isGuest(existingUser.id);
    if (existingHosts.includes(hostId)) {
      throw new AppError(400, "האמן כבר מוזמן על ידי המארח הזה");
    }

    // הזמנה ישירה
    await inviteArtistRepo(existingUser.id, hostId);
    return { message: "האמן הוזמן בהצלחה למאגר שלך", isExistingUser: true };
  }

  // יצירת token להזמנה
  const token = crypto.randomBytes(32).toString("hex");
  await saveInvitation(email, hostId, token);

  // יצירת קישור הזמנה
  const inviteLink = `${env.clientUrl}/invite/${token}`;

  // שליחת מייל
  await transporter.sendMail({
    from: env.mail.user,
    to: email,
    subject: "הזמנה למאגר Ari Stage",
    html: `
<div style="width:100%; background:#0d0d0d; padding:40px 0; font-family:Arial, sans-serif; direction:rtl; text-align:right;">
  <div style="max-width:480px; margin:auto; background:#141414; padding:30px; border-radius:16px; border:1px solid #2a2a2a; direction:rtl; text-align:right;">
    <h2 style="text-align:center; color:#ff8800; font-size:26px; margin-bottom:10px; font-weight:bold; direction:rtl;">
      Ari Stage
    </h2>
    <p style="text-align:center; color:#cccccc; font-size:14px; margin-bottom:25px; direction:rtl;">
      הזמנה למאגר אמנים
    </p>
    <p style="color:#e5e5e5; font-size:15px; line-height:1.8; direction:rtl;">
      שלום 👋<br>
      <strong>${hostName}</strong> מזמין אותך להצטרף למאגר שלו ב-Ari Stage.<br>
      לאחר ההצטרפות, תוכל לצפות בליינאפים והשירים שלו (קריאה בלבד).
    </p>
    <div style="text-align:center; margin:30px 0; direction:rtl;">
      <a href="${inviteLink}" style="background:#ff8800; color:#000; padding:14px 26px; font-size:16px; font-weight:bold; text-decoration:none; border-radius:10px; display:inline-block; box-shadow:0 0 12px rgba(255,136,0,0.4);">
        הצטרף למאגר
      </a>
    </div>
    <p style="color:#bbbbbb; font-size:13px; direction:rtl;">
      אם הכפתור לא עובד, אפשר להעתיק את הקישור הבא:
    </p>
    <p style="color:#ffbb66; font-size:13px; word-break:break-all; background:#1f1f1f; padding:10px; border-radius:8px; margin-top:8px; direction:ltr; text-align:left;">
      ${inviteLink}
    </p>
    <p style="color:#999; font-size:12px; margin-top:20px; direction:rtl;">
      הקישור תקף ל-7 ימים.
    </p>
  </div>
</div>
    `,
  });

  return { message: "הזמנה נשלחה בהצלחה למייל", isExistingUser: false };
}

// ⭐ טיפול בקישור הזמנה
export async function acceptInvitation(token) {
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    throw new AppError(400, "הזמנה לא תקינה או פגה תוקף");
  }

  // סימון ההזמנה כמשומשת
  await markInvitationAsUsed(token);

  // אם המשתמש כבר קיים, הוסף אותו לטבלת user_hosts עם סטטוס pending
  const existingUser = await findUserByEmail(invitation.email);
  if (existingUser) {
    await inviteArtistRepo(existingUser.id, invitation.host_id);
    return {
      message: "הזמנה נשלחה - אנא אשר את ההזמנה",
      userId: existingUser.id,
      needsLogin: true,
      needsApproval: true,
    };
  }

  // אם המשתמש לא קיים, נחזיר את המידע להרשמה
  return {
    message: "הצטרף למאגר",
    email: invitation.email,
    hostId: invitation.host_id,
    needsRegistration: true,
  };
}
