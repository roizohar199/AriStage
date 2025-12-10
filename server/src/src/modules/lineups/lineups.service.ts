import crypto from "crypto";
import { AppError } from "../../core/errors.js";
import { env } from "../../config/env.js";
import { getSharedLineup } from "../share/share.service.js";
import {
  deactivateShare,
  findActiveShare,
  findLineupById,
  insertLineup,
  insertShareToken,
  lineupBelongsToUser,
  listLineups,
  listLineupsByUserId,
  updateLineupRecord,
} from "./lineups.repository.js";
import { checkIfGuest } from "../users/users.service.js";

const emitLineupEvent = async (lineupId, event, payload) => {
  if (!global.io) return;
  
  // שליחה לחדר של הליינאפ
  global.io.to(`lineup_${lineupId}`).emit(event, payload);
  
  // שליחה גם לחדר של המארח שיצר את הליינאפ (כדי שכל האמנים שלו יקבלו את העדכון)
  try {
    const lineup = await findLineupById(lineupId);
    if (lineup && lineup.created_by) {
      // שליחה למארח ולכל האמנים שלו
      const { emitToHost } = await import("../../core/socket.js");
      await emitToHost(global.io, lineup.created_by, event, payload);
    }
  } catch (err) {
    // אם יש שגיאה, רק לוג - לא לשבור את הפעולה
    console.warn("⚠️ Warning: Could not emit to host room:", err.message);
  }
};

// פונקציה עוזרת: הפקת baseUrl דינמי מהבקשה
function resolveBaseUrl(req) {
  // אם הגדרת CLIENT_URL — הוא מנצח
  if (env.clientUrl && env.clientUrl.trim() !== "") {
    return env.clientUrl;
  }

  // Origin שנשלח מהדפדפן
  if (req.headers.origin) {
    return req.headers.origin.replace(/\/$/, "");
  }

  // Referer יכול גם להכיל את כתובת האתר
  if (req.headers.referer) {
    return req.headers.referer.replace(/\/$/, "");
  }

  // fallback — כתובת ה־API
  return `${req.protocol}://${req.headers.host}`;
}

export function getPublicLineup(token) {
  return getSharedLineup(token);
}

export async function getLineups(user) {
  // בדף הליינאפים - הצג רק את הליינאפים שהמשתמש יצר בעצמו
  return listLineups(user.role, user.id, null);
}

// פונקציה לקבלת ליינאפים של משתמש ספציפי (לשימוש ב-ArtistProfile)
export async function getLineupsByUserId(targetUserId) {
  return listLineupsByUserId(targetUserId);
}

// פונקציה לקבלת ליינאפ בודד לפי ID (עם בדיקת הרשאות)
export async function getLineupById(lineupId, user) {
  const lineup = await findLineupById(lineupId);
  if (!lineup) {
    throw new AppError(404, "ליינאפ לא נמצא");
  }

  // בדיקת הרשאות: האם המשתמש הוא הבעלים או אורח של המארח
  if (user.role === "admin") {
    return lineup;
  }

  const hasAccess = await lineupBelongsToUser(lineupId, user.id);
  if (hasAccess) {
    return lineup;
  }

  // אם לא, בדיקה אם המשתמש הוא אורח והליינאפ שייך למארח שלו
  const hostId = await checkIfGuest(user.id);
  if (hostId) {
    const hostHasAccess = await lineupBelongsToUser(lineupId, hostId);
    if (hostHasAccess) {
      return lineup;
    }
  }

  throw new AppError(403, "אין לך גישה לליינאפ הזה");
}

export async function createLineup(user, payload) {
  if (!payload.title?.trim()) {
    throw new AppError(400, "חובה להזין שם לליינאפ");
  }

  // כל המשתמשים יכולים ליצור ליינאפים (כולל אורחים)
  const lineup = await insertLineup({
    title: payload.title.trim(),
    date: payload.date || null,
    time: payload.time || null,
    location: payload.location || "",
    description: payload.description || "",
    created_by: user.id,
  });

  return lineup;
}

export async function updateLineup(user, id, payload) {
  if (!payload.title?.trim()) {
    throw new AppError(400, "חובה להזין שם לליינאפ");
  }

  // כל המשתמשים יכולים לערוך את הליינאפים שלהם (כולל אורחים)
  if (user.role !== "admin") {
    const ownsLineup = await lineupBelongsToUser(id, user.id);
    if (!ownsLineup) {
      throw new AppError(403, "אין לך הרשאה לערוך את הליינאפ הזה");
    }
  }

  const lineup = await updateLineupRecord(id, {
    title: payload.title.trim(),
    date: payload.date || null,
    time: payload.time || null,
    location: payload.location || "",
    description: payload.description || "",
  });

  await emitLineupEvent(id, "lineup-updated", { lineupId: id });
  await emitLineupEvent(id, "lineup:updated", { lineupId: id });

  return lineup;
}

/* ⭐ גרסה מתוקנת — מקבלת req ליצירת URL אמיתי מהדפדפן */
export async function getShareStatus(req, lineupId) {
  const share = await findActiveShare(lineupId);
  if (!share) {
    return { active: false, url: null };
  }

  const baseUrl = resolveBaseUrl(req);

  return {
    active: true,
    url: `${baseUrl}/share/${share.share_token}`,
  };
}

/* ⭐ גרסה מתוקנת — מקבלת req ליצירת URL אמיתי מהדפדפן */
export async function createShareLink(req, lineupId) {
  console.log("ORIGIN:", req.headers.origin);
  console.log("REFERER:", req.headers.referer);
  console.log("HOST:", req.headers.host);
  console.log("PROTO:", req.protocol);
  let share = await findActiveShare(lineupId);

  if (!share) {
    const token = crypto.randomBytes(16).toString("hex");
    await insertShareToken(lineupId, token);
    share = { share_token: token };
  }

  const baseUrl = resolveBaseUrl(req);
  const url = `${baseUrl}/share/${share.share_token}`;

  await emitLineupEvent(lineupId, "share:update", { id: lineupId, url });

  return { token: share.share_token, url };
}

export async function disableShareLink(lineupId) {
  await deactivateShare(lineupId);
  await emitLineupEvent(lineupId, "share:update", { id: lineupId, url: null });
}
