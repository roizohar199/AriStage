import { pool } from "../../database/pool";
import { logger } from "../../core/logger";
import { AppError } from "../../core/errors";
import {
  getAuditLogs,
  getSecurityStats,
} from "../security/auditLogger.service";

/**
 * Admin Security Service
 * Provides security monitoring and management functionality for administrators
 */

export interface SecurityOverview {
  stats: {
    totalEvents: number;
    failedLogins: number;
    lockedAccounts: number;
    criticalEvents: number;
    active2FAUsers: number;
    activeSessions: number;
  };
  recentEvents: any[];
  topFailedLogins: Array<{
    email: string;
    attempts: number;
  }>;
  riskIndicators: {
    bruteForceAttempts: number;
    suspiciousIPs: number;
    unusualHours: number;
  };
}

/**
 * Get comprehensive security overview for admin dashboard
 */
export const getSecurityOverview = async (): Promise<SecurityOverview> => {
  try {
    // Get basic stats from audit logger
    const stats = await getSecurityStats();

    // Get 2FA statistics
    const [twoFactorRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE two_factor_enabled = 1",
    )) as any[];
    const active2FAUsers = twoFactorRows[0]?.count || 0;

    // Get active sessions count (refresh tokens not expired)
    const [sessionRows] = (await pool.query(
      "SELECT COUNT(*) as count FROM refresh_tokens WHERE expires_at > NOW() AND revoked_at IS NULL",
    )) as any[];
    const activeSessions = sessionRows[0]?.count || 0;

    // Get recent security events (last 50)
    const recentEvents = await getAuditLogs({
      limit: 50,
      offset: 0,
    });

    // Get top failed login attempts in last 24 hours
    const [failedLoginRows] = (await pool.query(
      `SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.email')) as email,
        COUNT(*) as attempts
      FROM security_audit_logs
      WHERE event_type = 'FAILED_LOGIN'
        AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY email
      ORDER BY attempts DESC
      LIMIT 10`,
    )) as any[];

    // Calculate risk indicators
    // Brute force attempts: more than 3 failed logins from same IP in last hour
    const [bruteForceRows] = (await pool.query(
      `SELECT COUNT(DISTINCT ip_address) as count
      FROM security_audit_logs
      WHERE event_category = 'SECURITY'
        AND event_type = 'BRUTE_FORCE_DETECTED'
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    )) as any[];

    // Suspicious IPs: IPs with multiple failed attempts
    const [suspiciousIPRows] = (await pool.query(
      `SELECT COUNT(DISTINCT ip_address) as count
      FROM security_audit_logs
      WHERE event_type = 'FAILED_LOGIN'
        AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY ip_address
      HAVING COUNT(*) > 3`,
    )) as any[];

    // Unusual hours: logins between 2 AM - 5 AM
    const [unusualHoursRows] = (await pool.query(
      `SELECT COUNT(*) as count
      FROM security_audit_logs
      WHERE event_type = 'LOGIN'
        AND success = 1
        AND HOUR(created_at) BETWEEN 2 AND 5
        AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
    )) as any[];

    return {
      stats: {
        ...stats,
        active2FAUsers,
        activeSessions,
      },
      recentEvents,
      topFailedLogins: failedLoginRows || [],
      riskIndicators: {
        bruteForceAttempts: bruteForceRows[0]?.count || 0,
        suspiciousIPs: suspiciousIPRows.length || 0,
        unusualHours: unusualHoursRows[0]?.count || 0,
      },
    };
  } catch (error: any) {
    logger.error("Failed to get security overview", { error: error.message });
    throw new AppError(500, "Failed to get security overview");
  }
};

/**
 * Get list of currently locked accounts
 */
export const getLockedAccounts = async (): Promise<
  Array<{
    email: string;
    lockedAt: Date;
    remainingMinutes: number;
  }>
> => {
  try {
    // Import the account lockout service
    const { getLockedAccounts: getLockedAccountsList } =
      await import("../security/accountLockout.service");

    const lockedAccounts = getLockedAccountsList();

    return lockedAccounts.map((account) => ({
      email: account.identifier,
      lockedAt: account.lockedUntil,
      remainingMinutes: Math.ceil(
        (account.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      ),
    }));
  } catch (error: any) {
    logger.error("Failed to get locked accounts", { error: error.message });
    throw new AppError(500, "Failed to get locked accounts");
  }
};

/**
 * Get active user sessions with details
 */
export const getActiveSessions = async (): Promise<
  Array<{
    id: number;
    userId: number;
    userEmail: string;
    userName: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
    lastUsed: Date | null;
  }>
> => {
  try {
    const [rows] = (await pool.query(
      `SELECT 
        rt.id,
        rt.user_id,
        u.email as user_email,
        u.full_name as user_name,
        rt.ip_address,
        rt.user_agent,
        rt.created_at,
        rt.expires_at,
        rt.last_used_at
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.expires_at > NOW() 
        AND rt.revoked_at IS NULL
      ORDER BY rt.created_at DESC`,
    )) as any[];

    return rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      userName: row.user_name,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      lastUsed: row.last_used_at,
    }));
  } catch (error: any) {
    logger.error("Failed to get active sessions", { error: error.message });
    throw new AppError(500, "Failed to get active sessions");
  }
};

/**
 * Revoke a specific session (refresh token)
 */
export const revokeSession = async (sessionId: number): Promise<void> => {
  try {
    const [result] = (await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL",
      [sessionId],
    )) as any[];

    if (result.affectedRows === 0) {
      throw new AppError(404, "Session not found or already revoked");
    }

    logger.info("Session revoked by admin", { sessionId });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error("Failed to revoke session", {
      sessionId,
      error: error.message,
    });
    throw new AppError(500, "Failed to revoke session");
  }
};

/**
 * Revoke all sessions for a specific user
 */
export const revokeAllUserSessions = async (
  userId: number,
): Promise<number> => {
  try {
    const [result] = (await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
      [userId],
    )) as any[];

    const revokedCount = result.affectedRows || 0;

    logger.info("All user sessions revoked by admin", { userId, revokedCount });

    return revokedCount;
  } catch (error: any) {
    logger.error("Failed to revoke user sessions", {
      userId,
      error: error.message,
    });
    throw new AppError(500, "Failed to revoke user sessions");
  }
};

/**
 * Unlock a locked account (clear failed attempts)
 */
export const unlockAccount = async (email: string): Promise<void> => {
  try {
    const { clearFailedAttempts } =
      await import("../security/accountLockout.service");

    clearFailedAttempts(email);

    logger.info("Account unlocked by admin", { email });
  } catch (error: any) {
    logger.error("Failed to unlock account", { email, error: error.message });
    throw new AppError(500, "Failed to unlock account");
  }
};

/**
 * Get security health score (0-100)
 */
export const getSecurityHealthScore = async (): Promise<{
  score: number;
  factors: Record<string, { value: number; weight: number; score: number }>;
}> => {
  try {
    const overview = await getSecurityOverview();

    // Calculate individual factors (0-100 each)
    const factors = {
      twoFactorAdoption: {
        weight: 0.25,
        value: 0,
        score: 0,
      },
      failedLoginRate: {
        weight: 0.2,
        value: 0,
        score: 0,
      },
      criticalEvents: {
        weight: 0.25,
        value: 0,
        score: 0,
      },
      riskIndicators: {
        weight: 0.3,
        value: 0,
        score: 0,
      },
    };

    // Get total users
    const [userCount] = (await pool.query(
      "SELECT COUNT(*) as count FROM users",
    )) as any[];
    const totalUsers = userCount[0]?.count || 1;

    // 2FA adoption rate
    const twoFactorRate = (overview.stats.active2FAUsers / totalUsers) * 100;
    factors.twoFactorAdoption.value = twoFactorRate;
    factors.twoFactorAdoption.score = Math.min(100, twoFactorRate * 2); // 50% adoption = 100 score

    // Failed login rate (lower is better)
    const failedLoginRate = (overview.stats.failedLogins / totalUsers) * 100;
    factors.failedLoginRate.value = failedLoginRate;
    factors.failedLoginRate.score = Math.max(0, 100 - failedLoginRate * 10);

    // Critical events (lower is better)
    factors.criticalEvents.value = overview.stats.criticalEvents;
    factors.criticalEvents.score = Math.max(
      0,
      100 - overview.stats.criticalEvents * 10,
    );

    // Risk indicators (lower is better)
    const totalRisk =
      overview.riskIndicators.bruteForceAttempts +
      overview.riskIndicators.suspiciousIPs +
      overview.riskIndicators.unusualHours;
    factors.riskIndicators.value = totalRisk;
    factors.riskIndicators.score = Math.max(0, 100 - totalRisk * 5);

    // Calculate weighted score
    const score = Object.values(factors).reduce(
      (sum, factor) => sum + factor.score * factor.weight,
      0,
    );

    return {
      score: Math.round(score),
      factors,
    };
  } catch (error: any) {
    logger.error("Failed to calculate security health score", {
      error: error.message,
    });
    throw new AppError(500, "Failed to calculate security health score");
  }
};
