import { Request, Response, NextFunction } from "express";
import { emitToUserAndHost } from "../core/socket";

/**
 * כל בקשת POST/PUT/PATCH/DELETE שנסגרת ב־2xx/3xx
 * תשלח event "global:refresh" לכל המשתמש הרלוונטי + המארח שלו.
 */
export function emitRefreshOnMutation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log(
    "[TEMP][REFRESH] emitRefreshOnMutation",
    req.method,
    req.path,
    req.body,
    "user:",
    req.user,
  );
  const methodsToWatch = ["POST", "PUT", "PATCH", "DELETE"];

  // רק פעולות כתיבה
  if (!methodsToWatch.includes(req.method)) {
    return next();
  }

  // חייב להיות משתמש מחובר ו־io גלובלי
  const userId = (req as any).user?.id;
  if (!userId || !global.io) {
    return next();
  }

  // מפה בין מודול ל־type שישב ב־data-refresh בצד Client
  // משתמש ב-originalUrl כדי לזהות את המודול
  const originalUrl = req.originalUrl || req.path || "";
  let type: string;

  if (
    originalUrl.includes("/api/songs") ||
    originalUrl.startsWith("/api/songs")
  ) {
    type = "song";
  } else if (
    originalUrl.includes("/api/lineups") ||
    originalUrl.startsWith("/api/lineups")
  ) {
    type = "lineup";
  } else if (
    originalUrl.includes("/api/lineup-songs") ||
    originalUrl.startsWith("/api/lineup-songs")
  ) {
    type = "lineup-song";
  } else if (
    originalUrl.includes("/api/users") ||
    originalUrl.startsWith("/api/users")
  ) {
    type = "user";
  } else if (
    originalUrl.includes("/api/files") ||
    originalUrl.startsWith("/api/files")
  ) {
    type = "file";
  } else {
    type = "global";
  }

  // נשלח event רק כשהתגובה נסגרת בהצלחה
  res.on("finish", () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      emitToUserAndHost(global.io, userId, "global:refresh", {
        type, // לדוגמה: "song", "lineup"
        action: req.method.toLowerCase(), // לדוגמה: "post", "put"
        path: req.originalUrl, // לדוגמה: "/api/songs/12"
      }).catch((err) => {
        console.error("Socket global:refresh emit failed:", err);
      });
    }
  });

  next();
}
