import { pool } from "../../database/pool";
import { logger } from "../../core/logger";

/**
 * Security Audit Logger Service
 * Comprehensive security event logging for monitoring and compliance
 */

export type EventCategory = "AUTH" | "ACCESS" | "DATA" | "ADMIN" | "SECURITY";
export type EventSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityEvent {
  userId?: number;
  eventType: string;
  eventCategory: EventCategory;
  eventAction: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: EventSeverity;
  success?: boolean;
}

/**
 * Log a security event
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  const {
    userId = null,
    eventType,
    eventCategory,
    eventAction,
    ipAddress = null,
    userAgent = null,
    metadata = {},
    severity = "low",
    success = true,
  } = event;

  try {
    await pool.query(
      `INSERT INTO security_audit_logs 
       (user_id, event_type, event_category, event_action, ip_address, user_agent, metadata, severity, success)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        eventType,
        eventCategory,
        eventAction,
        ipAddress,
        userAgent,
        JSON.stringify(metadata),
        severity,
        success ? 1 : 0,
      ],
    );

    // Log critical events to console as well
    if (severity === "critical" || !success) {
      logger.warn("Security event logged", {
        eventType,
        eventCategory,
        eventAction,
        userId,
        severity,
        success,
      });
    }
  } catch (error: any) {
    logger.error("Failed to log security event", {
      error: error.message,
      event: eventType,
    });
    // Don't throw - logging failure shouldn't break application flow
  }
};

/**
 * Log authentication events
 */
export const logAuthEvent = async (
  eventType:
    | "LOGIN"
    | "LOGOUT"
    | "REGISTER"
    | "FAILED_LOGIN"
    | "PASSWORD_CHANGE"
    | "PASSWORD_RESET"
    | "PASSWORD_RESET_REQUESTED"
    | "2FA_ENABLED"
    | "2FA_DISABLED"
    | "ACCOUNT_LOCKED",
  userId: number | undefined,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  const success =
    !eventType.includes("FAILED") && eventType !== "ACCOUNT_LOCKED";
  const severity: EventSeverity =
    eventType === "ACCOUNT_LOCKED"
      ? "high"
      : eventType === "FAILED_LOGIN"
        ? "medium"
        : eventType === "PASSWORD_CHANGE" || eventType.includes("2FA")
          ? "medium"
          : "low";

  await logSecurityEvent({
    userId,
    eventType,
    eventCategory: "AUTH",
    eventAction: eventType.toLowerCase().replace(/_/g, " "),
    ipAddress,
    userAgent,
    metadata,
    severity,
    success,
  });
};

/**
 * Log access control events
 */
export const logAccessEvent = async (
  eventType:
    | "PERMISSION_DENIED"
    | "ROLE_CHANGE"
    | "SUBSCRIPTION_CHECK"
    | "TOKEN_REFRESH"
    | "SESSION_REVOKED",
  userId: number | undefined,
  ipAddress?: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  const success = eventType !== "PERMISSION_DENIED";
  const severity: EventSeverity =
    eventType === "PERMISSION_DENIED"
      ? "medium"
      : eventType === "ROLE_CHANGE"
        ? "high"
        : "low";

  await logSecurityEvent({
    userId,
    eventType,
    eventCategory: "ACCESS",
    eventAction: eventType.toLowerCase().replace(/_/g, " "),
    ipAddress,
    metadata,
    severity,
    success,
  });
};

/**
 * Log data access/modification events
 */
export const logDataEvent = async (
  eventType:
    | "DATA_ACCESS"
    | "DATA_EXPORT"
    | "DATA_DELETION"
    | "SENSITIVE_DATA_ACCESS"
    | "FILE_UPLOAD"
    | "FILE_DELETION",
  userId: number | undefined,
  metadata?: Record<string, any>,
): Promise<void> => {
  const severity: EventSeverity =
    eventType === "SENSITIVE_DATA_ACCESS" || eventType === "DATA_DELETION"
      ? "medium"
      : "low";

  await logSecurityEvent({
    userId,
    eventType,
    eventCategory: "DATA",
    eventAction: eventType.toLowerCase().replace(/_/g, " "),
    metadata,
    severity,
  });
};

/**
 * Log admin actions
 */
export const logAdminEvent = async (
  eventType:
    | "USER_CREATED"
    | "USER_DISABLED"
    | "SETTINGS_CHANGED"
    | "FEATURE_FLAG_CHANGED"
    | "ADMIN_ACCESS"
    | "SYSTEM_CONFIG_CHANGED",
  userId: number | undefined,
  ipAddress?: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  const severity: EventSeverity =
    eventType === "SYSTEM_CONFIG_CHANGED"
      ? "high"
      : eventType === "USER_DISABLED"
        ? "medium"
        : "low";

  await logSecurityEvent({
    userId,
    eventType,
    eventCategory: "ADMIN",
    eventAction: eventType.toLowerCase().replace(/_/g, " "),
    ipAddress,
    metadata,
    severity,
  });
};

/**
 * Log security incidents
 */
export const logSecurityIncident = async (
  eventType:
    | "SUSPICIOUS_ACTIVITY"
    | "RATE_LIMIT_EXCEEDED"
    | "FILE_UPLOAD_BLOCKED"
    | "INVALID_TOKEN"
    | "SQL_INJECTION_ATTEMPT"
    | "XSS_ATTEMPT"
    | "BRUTE_FORCE_DETECTED",
  userId: number | undefined,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  const severity: EventSeverity =
    eventType === "SQL_INJECTION_ATTEMPT" ||
    eventType === "BRUTE_FORCE_DETECTED"
      ? "critical"
      : eventType === "XSS_ATTEMPT" || eventType === "SUSPICIOUS_ACTIVITY"
        ? "high"
        : "medium";

  await logSecurityEvent({
    userId,
    eventType,
    eventCategory: "SECURITY",
    eventAction: eventType.toLowerCase().replace(/_/g, " "),
    ipAddress,
    userAgent,
    metadata,
    severity,
    success: false,
  });
};

/**
 * Get security audit logs with filters
 */
export const getAuditLogs = async (filters: {
  userId?: number;
  eventCategory?: EventCategory;
  eventType?: string;
  severity?: EventSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
  const {
    userId,
    eventCategory,
    eventType,
    severity,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  let query = "SELECT * FROM security_audit_logs WHERE 1=1";
  const params: any[] = [];

  if (userId) {
    query += " AND user_id = ?";
    params.push(userId);
  }

  if (eventCategory) {
    query += " AND event_category = ?";
    params.push(eventCategory);
  }

  if (eventType) {
    query += " AND event_type = ?";
    params.push(eventType);
  }

  if (severity) {
    query += " AND severity = ?";
    params.push(severity);
  }

  if (startDate) {
    query += " AND created_at >= ?";
    params.push(startDate);
  }

  if (endDate) {
    query += " AND created_at <= ?";
    params.push(endDate);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  try {
    const [rows] = (await pool.query(query, params)) as any[];
    return rows || [];
  } catch (error: any) {
    logger.error("Failed to get audit logs", { error: error.message });
    return [];
  }
};

/**
 * Get security statistics
 */
export const getSecurityStats = async (
  hours: number = 24,
): Promise<{
  totalEvents: number;
  failedLogins: number;
  lockedAccounts: number;
  criticalEvents: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
}> => {
  try {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Total events
    const [totalRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM security_audit_logs WHERE created_at >= ?",
      [cutoffDate],
    )) as any[];

    // Failed logins
    const [failedRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM security_audit_logs WHERE event_type = 'FAILED_LOGIN' AND created_at >= ?",
      [cutoffDate],
    )) as any[];

    // Locked accounts
    const [lockedRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM security_audit_logs WHERE event_type = 'ACCOUNT_LOCKED' AND created_at >= ?",
      [cutoffDate],
    )) as any[];

    // Critical events
    const [criticalRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM security_audit_logs WHERE severity = 'critical' AND created_at >= ?",
      [cutoffDate],
    )) as any[];

    // Top event types
    const [topEvents] = (await pool.query(
      `SELECT event_type as eventType, COUNT(*) as count 
       FROM security_audit_logs 
       WHERE created_at >= ? 
       GROUP BY event_type 
       ORDER BY count DESC 
       LIMIT 10`,
      [cutoffDate],
    )) as any[];

    return {
      totalEvents: totalRows[0]?.count || 0,
      failedLogins: failedRows[0]?.count || 0,
      lockedAccounts: lockedRows[0]?.count || 0,
      criticalEvents: criticalRows[0]?.count || 0,
      topEventTypes: topEvents || [],
    };
  } catch (error: any) {
    logger.error("Failed to get security stats", { error: error.message });
    return {
      totalEvents: 0,
      failedLogins: 0,
      lockedAccounts: 0,
      criticalEvents: 0,
      topEventTypes: [],
    };
  }
};

/**
 * Clean up old audit logs (run periodically)
 */
export const cleanupOldAuditLogs = async (
  daysToKeep: number = 90,
): Promise<number> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const [result] = await pool.query(
      "DELETE FROM security_audit_logs WHERE created_at < ?",
      [cutoffDate],
    );

    const deletedCount = (result as any).affectedRows;
    logger.info("Cleaned up old audit logs", { deletedCount, daysToKeep });

    return deletedCount;
  } catch (error: any) {
    logger.error("Failed to cleanup audit logs", { error: error.message });
    return 0;
  }
};

// Run cleanup every 7 days
setInterval(
  () => {
    cleanupOldAuditLogs().catch((error) => {
      logger.error("Audit log cleanup failed", { error: error.message });
    });
  },
  7 * 24 * 60 * 60 * 1000,
);
