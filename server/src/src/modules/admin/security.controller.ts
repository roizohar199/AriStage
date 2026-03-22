import { Request, Response } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { AppError } from "../../core/errors";
import { getAuditLogs } from "../security/auditLogger.service";
import {
  getSecurityOverview,
  getLockedAccounts,
  getActiveSessions,
  revokeSession,
  revokeAllUserSessions,
  unlockAccount,
  getSecurityHealthScore,
} from "./security.service";
import { resolveRequestLocale, tRequest, tServer } from "../../i18n/serverI18n";

/**
 * Admin Security Controller
 * Provides admin endpoints for security monitoring and management
 */

export const securityController = {
  /**
   * GET /api/admin/security/overview
   * Get comprehensive security overview
   */
  getOverview: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const overview = await getSecurityOverview(locale);
    res.json(overview);
  }),

  /**
   * GET /api/admin/security/audit-logs
   * Get paginated audit logs with filters
   */
  getAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const {
      userId,
      category,
      eventType,
      severity,
      startDate,
      endDate,
      page = "1",
      limit = "50",
    } = req.query;

    const logs = await getAuditLogs({
      userId: userId ? parseInt(userId as string) : undefined,
      eventCategory: category as any,
      eventType: eventType as string,
      severity: severity as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
    });

    res.json({
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hasMore: logs.length === parseInt(limit as string),
      },
    });
  }),

  /**
   * GET /api/admin/security/locked-accounts
   * Get list of currently locked accounts
   */
  getLockedAccounts: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const lockedAccounts = await getLockedAccounts(locale);
    res.json(lockedAccounts);
  }),

  /**
   * POST /api/admin/security/unlock-account
   * Unlock a locked account
   */
  unlockAccount: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, tServer(locale, "users.emailRequired"));
    }

    await unlockAccount(email, locale);

    res.json({
      message: tRequest(req, "security.accountUnlocked"),
    });
  }),

  /**
   * GET /api/admin/security/active-sessions
   * Get list of active user sessions
   */
  getActiveSessions: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const sessions = await getActiveSessions(locale);
    res.json(sessions);
  }),

  /**
   * POST /api/admin/security/revoke-session/:id
   * Revoke a specific session
   */
  revokeSession: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      throw new AppError(400, tServer(locale, "security.invalidSessionId"));
    }

    await revokeSession(sessionId, locale);

    res.json({
      message: tRequest(req, "security.sessionRevoked"),
    });
  }),

  /**
   * POST /api/admin/security/revoke-user-sessions/:userId
   * Revoke all sessions for a specific user
   */
  revokeUserSessions: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      throw new AppError(400, tServer(locale, "security.invalidUserId"));
    }

    const revokedCount = await revokeAllUserSessions(userId, locale);

    res.json({
      message: tRequest(req, "security.sessionsRevoked", {
        count: revokedCount,
      }),
      revokedCount,
    });
  }),

  /**
   * GET /api/admin/security/health
   * Get security health score and analysis
   */
  getHealthScore: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const health = await getSecurityHealthScore(locale);
    res.json(health);
  }),

  /**
   * GET /api/admin/security/failed-logins
   * Get recent failed login attempts
   */
  getFailedLogins: asyncHandler(async (req: Request, res: Response) => {
    const { limit = "50" } = req.query;

    const logs = await getAuditLogs({
      eventType: "FAILED_LOGIN",
      limit: parseInt(limit as string),
      offset: 0,
    });

    res.json(logs);
  }),
};
