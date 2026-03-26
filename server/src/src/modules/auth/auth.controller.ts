import { asyncHandler } from "../../core/asyncHandler";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  getResetSafeResponse,
  complete2FALogin,
} from "./auth.service";
import { logger } from "../../core/logger";
import { Request, Response } from "express";
import { logSystemEvent } from "../../utils/systemLogger";
import {
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "./refreshToken.service";
import { signToken } from "./token.service";
import { findUserById } from "../users/users.repository";
import { AppError } from "../../core/errors";
import { resolveRequestLocale, tServer } from "../../i18n/serverI18n";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");

    const payload = await loginUser(
      req.body.email,
      req.body.password,
      locale,
      ipAddress,
      userAgent,
    );

    if (payload?.role === "admin") {
      void logSystemEvent(
        "info",
        "ADMIN_LOGIN",
        "Admin login success",
        { userId: payload.id },
        payload.id,
      );
    }

    res.json(payload);
  }),

  // Complete 2FA login - after user verifies 2FA code
  complete2FA: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const { userId, token } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");

    if (!userId || !token) {
      throw new AppError(400, tServer(locale, "twoFactor.userAndCodeRequired"));
    }

    const payload = await complete2FALogin(
      userId,
      token,
      locale,
      ipAddress,
      userAgent,
    );

    if (payload?.role === "admin") {
      void logSystemEvent(
        "info",
        "ADMIN_LOGIN_2FA",
        "Admin login with 2FA success",
        { userId: payload.id },
        payload.id,
      );
    }

    res.json(payload);
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    logger.info("🔵 [REGISTER] התחלת הרשמה", {
      hasEmail: typeof req.body?.email === "string",
      hasFile: !!req.file,
      filePath: req.file?.path,
    });

    const tempAvatar = req.file ? req.file.path : null;
    const normalizedRegisterPayload = {
      ...req.body,
      full_name:
        typeof req.body?.fullName === "string"
          ? req.body.fullName
          : req.body?.full_name,
      artist_role:
        typeof req.body?.artistRole === "string"
          ? req.body.artistRole
          : req.body?.artist_role || null,
      preferred_locale:
        typeof req.body?.preferredLocale === "string"
          ? req.body.preferredLocale
          : req.body?.preferred_locale,
      tempAvatar,
    };

    try {
      const newUser = await registerUser(normalizedRegisterPayload, locale);

      logger.info("✅ [REGISTER] הרשמה הצליחה", {
        userId: newUser.id,
      });
      res.json({ message: tServer(locale, "auth.registered"), user: newUser });
    } catch (error: any) {
      logger.error("❌ [REGISTER] שגיאה בהרשמה", {
        error: error.message,
        stack: error.stack,
        hasFile: !!req.file,
      });
      throw error;
    }
  }),

  resetRequest: async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    try {
      const response = await requestPasswordReset(req.body.email, locale);
      res.json(response);
    } catch (err: any) {
      logger.error("❌ reset-request error:", { error: err.message });
      res.json(getResetSafeResponse(locale));
    }
  },

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    await resetPasswordWithToken(req.body.token, req.body.password, locale);
    res.json({ message: tServer(locale, "auth.passwordUpdatedLogin") });
  }),

  // Refresh access token using refresh token
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const { refreshToken } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");

    if (!refreshToken) {
      throw new AppError(401, tServer(locale, "auth.refreshTokenRequired"));
    }

    // Verify and consume the current refresh token, then rotate it.
    const userId = await verifyRefreshToken(refreshToken, locale);

    // Get user data
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError(401, tServer(locale, "auth.userNotFound"));
    }

    // Generate new access token
    const newAccessToken = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name || "",
      artist_role: user.artist_role || null,
      avatar: user.avatar || null,
      preferred_locale: user.preferred_locale || "he-IL",
    });

    const { token: nextRefreshToken, expiresAt: refreshExpiresAt } =
      await generateRefreshToken(user.id, ipAddress, userAgent, locale);

    logger.debug("Access token refreshed", { userId });

    res.json({
      token: newAccessToken,
      refreshToken: nextRefreshToken,
      refreshExpiresAt,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar: user.avatar,
      },
    });
  }),

  // Logout - revoke current refresh token
  logout: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
      logger.info("User logged out", { userId: req.user?.id });
    }

    res.json({ message: tServer(locale, "auth.loggedOut") });
  }),

  // Logout from all sessions - revoke all user's refresh tokens
  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
    }

    await revokeAllUserTokens(userId, locale);
    logger.info("User logged out from all sessions", { userId });

    res.json({ message: tServer(locale, "auth.loggedOutAll") });
  }),
};
