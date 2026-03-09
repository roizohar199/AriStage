import { Router } from "express";
import { securityController } from "./security.controller";
import { requireAuth, requireRoles } from "../../middleware/auth";

/**
 * Admin Security Routes
 * All routes require admin authentication
 */

const router = Router();

// Apply admin authentication to all routes
router.use(requireAuth);
router.use(requireRoles(["admin"]));

// Security overview and health
router.get("/overview", securityController.getOverview);
router.get("/health", securityController.getHealthScore);

// Audit logs
router.get("/audit-logs", securityController.getAuditLogs);
router.get("/failed-logins", securityController.getFailedLogins);

// Account management
router.get("/locked-accounts", securityController.getLockedAccounts);
router.post("/unlock-account", securityController.unlockAccount);

// Session management
router.get("/active-sessions", securityController.getActiveSessions);
router.post("/revoke-session/:id", securityController.revokeSession);
router.post(
  "/revoke-user-sessions/:userId",
  securityController.revokeUserSessions,
);

export default router;
