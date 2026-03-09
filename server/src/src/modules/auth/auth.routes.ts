import { Router } from "express";
import { authController } from "./auth.controller";
import { twoFactorController } from "./twoFactor.controller";
import { uploadTempAvatar } from "../shared/upload";
import {
  authLimiter,
  passwordResetLimiter,
  sensitiveOperationLimiter,
} from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import {
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshTokenSchema,
  verify2FASchema,
  disable2FASchema,
} from "../../validation/schemas/auth.schemas";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// Login - with strict rate limiting
router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  authController.login,
);

// Complete 2FA login
router.post("/login/2fa", authLimiter, authController.complete2FA);

// Register - with validation and temp avatar upload
router.post(
  "/register",
  authLimiter,
  uploadTempAvatar.single("avatar"),
  validateBody(registerSchema),
  authController.register,
);

// Password reset request - strict rate limiting
router.post(
  "/reset-request",
  passwordResetLimiter,
  validateBody(passwordResetRequestSchema),
  authController.resetRequest,
);

// Password reset confirmation - with validation
router.post(
  "/reset-password",
  validateBody(passwordResetSchema),
  authController.resetPassword,
);

// Refresh access token
router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  authController.refresh,
);

// Logout - revoke current refresh token
router.post("/logout", authController.logout);

// Logout from all sessions - requires authentication
router.post("/logout-all", requireAuth, authController.logoutAll);

// === Two-Factor Authentication Routes ===

// Setup 2FA - returns QR code
router.post(
  "/2fa/setup",
  requireAuth,
  sensitiveOperationLimiter,
  twoFactorController.setup,
);

// Verify and enable 2FA
router.post(
  "/2fa/verify-setup",
  requireAuth,
  validateBody(verify2FASchema),
  twoFactorController.verifySetup,
);

// Verify 2FA code (during login or for sensitive operations)
router.post(
  "/2fa/verify",
  validateBody(verify2FASchema),
  twoFactorController.verify,
);

// Disable 2FA
router.delete(
  "/2fa",
  requireAuth,
  validateBody(disable2FASchema),
  sensitiveOperationLimiter,
  twoFactorController.disable,
);

// Get 2FA status
router.get("/2fa/status", requireAuth, twoFactorController.status);

export const authRouter = router;
