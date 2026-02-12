import { pool } from "../database/pool";
import { logger } from "../core/logger";

export type SystemLogLevel = "info" | "warn" | "error";

export async function logSystemEvent(
  level: SystemLogLevel,
  action: string,
  message: string,
  context?: Record<string, any> | null,
  userId?: number,
) {
  const safeLevel: SystemLogLevel =
    level === "warn" || level === "error" ? level : "info";
  const safeAction = String(action || "").slice(0, 64);
  const safeMessage = String(message || "").slice(0, 1000);
  const safeUserId =
    userId != null && Number.isFinite(Number(userId)) ? Number(userId) : null;

  let contextJson: string | null = null;
  if (context != null) {
    try {
      contextJson = JSON.stringify(context);
    } catch {
      contextJson = null;
    }
  }

  // Best-effort only: never throw or block request handling.
  try {
    // Preferred schema (per spec)
    await pool.query(
      "INSERT INTO system_logs (level, action, message, context, userId, createdAt) VALUES (?, ?, ?, ?, ?, NOW())",
      [safeLevel, safeAction, safeMessage, contextJson, safeUserId],
    );
    return;
  } catch (err: any) {
    // Fallback: older schema compatibility
    try {
      await pool.query(
        "INSERT INTO system_logs (action, user, entity, meta, created_at) VALUES (?, ?, ?, ?, NOW())",
        [
          safeAction,
          safeUserId != null ? String(safeUserId) : null,
          safeMessage,
          contextJson,
        ],
      );
      return;
    } catch (fallbackErr: any) {
      logger.warn("Failed to write system log", {
        action: safeAction,
        message: fallbackErr?.message,
        code: fallbackErr?.code,
      });
    }

    logger.debug?.("System log insert failed (primary)", {
      message: err?.message,
      code: err?.code,
    });
  }
}
