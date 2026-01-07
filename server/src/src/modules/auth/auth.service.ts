import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { AppError } from "../../core/errors.js";
import { signToken } from "./token.service.js";
import {
  createUser,
  findUserByEmail,
  findUserByResetToken,
  saveResetToken,
  updatePassword,
} from "./auth.repository.js";

import { transporter } from "../../integrations/mail/transporter.js";
import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";
import { resolveSubscriptionStatus } from "../subscriptions/resolveSubscriptionStatus.js";
import { touchUserLastSeen } from "../users/users.repository.js";

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
export async function loginUser(email, password) {
  if (!email || !password) {
    throw new AppError(400, "נא להזין אימייל וסיסמה");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(401, "משתמש לא נמצא");
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError(401, "סיסמה שגויה");
  }

  // Best-effort activity stamp (do not block login on DB issues).
  void touchUserLastSeen(user.id).catch(() => undefined);

  const token = signToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name || "",
    avatar: user.avatar || null,
    artist_role: user.artist_role || null,
  });

  const subscription_status = resolveSubscriptionStatus(user);

  return {
    id: user.id,
    full_name: user.full_name || "",
    email: user.email,
    role: user.role,
    artist_role: user.artist_role || null,
    avatar: user.avatar || null,
    subscription_type: user.subscription_type ?? null,
    subscription_status,
    subscription_expires_at: user.subscription_expires_at ?? null,
    token,
  };
}

//
// ======================= REGISTER =======================
//
export async function registerUser(payload) {
  const { full_name, email, password, artist_role, tempAvatar } = payload;

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
    subscription_expires_at: addDaysMysqlDateTime(30),
    artist_role: artist_role || null,
    avatar: null,
  });

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
  await import("../../database/pool.js").then(({ pool }) =>
    pool.query("UPDATE users SET avatar = ? WHERE id = ?", [avatarPath, id])
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

  const hashed = await bcrypt.hash(password, 10);
  await updatePassword(user.id, hashed);
}
