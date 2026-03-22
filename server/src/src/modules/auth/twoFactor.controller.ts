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
import { resolveRequestLocale, tServer } from "../../i18n/serverI18n";

/**
 * Two-Factor Authentication Controller
 */

export const twoFactorController = {
  // Initialize 2FA setup - returns QR code and backup codes
  setup: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
    }

    const { secret, qrCode, backupCodes } = await setup2FA(
      userId,
      email,
      locale,
    );

    res.json({
      message: tServer(locale, "twoFactor.setupInitiated"),
      secret,
      qrCode,
      backupCodes,
      instructions: [
        tServer(locale, "twoFactor.instructions.install"),
        tServer(locale, "twoFactor.instructions.scan"),
        tServer(locale, "twoFactor.instructions.verify"),
        tServer(locale, "twoFactor.instructions.saveBackupCodes"),
      ],
    });
  }),

  // Verify 2FA setup and enable it
  verifySetup: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
    }

    if (!token || token.length !== 6) {
      throw new AppError(400, tServer(locale, "twoFactor.invalidCodeFormat"));
    }

    await verify2FASetup(userId, token, locale);

    res.json({
      message: tServer(locale, "twoFactor.enabled"),
    });
  }),

  // Verify 2FA code during login
  verify: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const { userId, token } = req.body;

    if (!userId || !token) {
      throw new AppError(
        400,
        tServer(locale, "twoFactor.userAndTokenRequired"),
      );
    }

    const valid = await verify2FA(userId, token, locale);

    if (!valid) {
      throw new AppError(401, tServer(locale, "twoFactor.invalidCode"));
    }

    res.json({
      message: tServer(locale, "twoFactor.verified"),
      valid: true,
    });
  }),

  // Disable 2FA
  disable: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const userId = req.user?.id;
    const { password, token } = req.body;

    if (!userId) {
      throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
    }

    if (!password) {
      throw new AppError(
        400,
        tServer(locale, "twoFactor.passwordRequiredToDisable"),
      );
    }

    await disable2FA(userId, password, token, locale);

    res.json({
      message: tServer(locale, "twoFactor.disabled"),
    });
  }),

  // Get 2FA status
  status: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
    }

    const enabled = await is2FAEnabled(userId);
    const backupCodesRemaining = await getRemainingBackupCodes(userId);

    res.json({
      enabled,
      backupCodesRemaining,
    });
  }),
};
