import { asyncHandler } from "../../core/asyncHandler";
import { Request, Response } from "express";
import {
  setup2FA,
  verify2FASetup,
  verify2FA,
  disable2FA,
  is2FAEnabled,
  getRemainingBackupCodes,
} from "./twoFactor.service";
import { AppError } from "../../core/errors";
import { logger } from "../../core/logger";

/**
 * Two-Factor Authentication Controller
 */

export const twoFactorController = {
  // Initialize 2FA setup - returns QR code and backup codes
  setup: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      throw new AppError(401, "Not authenticated");
    }

    const { secret, qrCode, backupCodes } = await setup2FA(userId, email);

    res.json({
      message:
        "2FA setup initiated. Scan the QR code with your authenticator app.",
      secret,
      qrCode,
      backupCodes,
      instructions: [
        "1. Install an authenticator app (Google Authenticator, Authy, etc.)",
        "2. Scan the QR code with the app",
        "3. Enter the 6-digit code from the app to verify",
        "4. Save your backup codes in a secure place",
      ],
    });
  }),

  // Verify 2FA setup and enable it
  verifySetup: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      throw new AppError(401, "Not authenticated");
    }

    if (!token || token.length !== 6) {
      throw new AppError(400, "Invalid 2FA code format");
    }

    await verify2FASetup(userId, token);

    res.json({
      message: "2FA has been successfully enabled for your account",
    });
  }),

  // Verify 2FA code during login
  verify: asyncHandler(async (req: Request, res: Response) => {
    const { userId, token } = req.body;

    if (!userId || !token) {
      throw new AppError(400, "User ID and token are required");
    }

    const valid = await verify2FA(userId, token);

    if (!valid) {
      throw new AppError(401, "Invalid 2FA code");
    }

    res.json({
      message: "2FA verification successful",
      valid: true,
    });
  }),

  // Disable 2FA
  disable: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { password, token } = req.body;

    if (!userId) {
      throw new AppError(401, "Not authenticated");
    }

    if (!password) {
      throw new AppError(400, "Password is required to disable 2FA");
    }

    await disable2FA(userId, password, token);

    res.json({
      message: "2FA has been disabled for your account",
    });
  }),

  // Get 2FA status
  status: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, "Not authenticated");
    }

    const enabled = await is2FAEnabled(userId);
    const backupCodesRemaining = await getRemainingBackupCodes(userId);

    res.json({
      enabled,
      backupCodesRemaining,
    });
  }),
};
