import { asyncHandler } from "../../core/asyncHandler";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  resetSafeResponse,
  complete2FALogin,
} from "./auth.service";
import { logger } from "../../core/logger";
import { Request, Response } from "express";
import { logSystemEvent } from "../../utils/systemLogger";
import {
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from "./refreshToken.service";
import { signToken } from "./token.service";
import { findUserById } from "../users/users.repository";
import { AppError } from "../../core/errors";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");

    const payload = await loginUser(
      req.body.email,
      req.body.password,
      ipAddress,
      userAgent,
    );

    if (payload?.role === "admin") {
      void logSystemEvent(
        "info",
        "ADMIN_LOGIN",
        "Admin login success",
        { email: payload.email },
        payload.id,
      );
    }

    res.json(payload);
  }),

  // Complete 2FA login - after user verifies 2FA code
  complete2FA: asyncHandler(async (req: Request, res: Response) => {
    const { userId, token } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get("user-agent");

    if (!userId || !token) {
      throw new AppError(400, "User ID and 2FA code are required");
    }

    const payload = await complete2FALogin(userId, token, ipAddress, userAgent);

    if (payload?.role === "admin") {
      void logSystemEvent(
        "info",
        "ADMIN_LOGIN_2FA",
        "Admin login with 2FA success",
        { email: payload.email },
        payload.id,
      );
    }

    res.json(payload);
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    logger.info("🔵 [REGISTER] התחלת הרשמה", {
      body: req.body,
      hasFile: !!req.file,
      filePath: req.file?.path,
    });

    const tempAvatar = req.file ? req.file.path : null;

    try {
      const newUser = await registerUser({
        ...req.body,
        artist_role: req.body.artist_role || null,
        tempAvatar, // שולחים את התמונה הזמנית ל-service
      });

      logger.info("✅ [REGISTER] הרשמה הצליחה", {
        userId: newUser.id,
        email: newUser.email,
      });
      res.json({ message: "נוצר בהצלחה", user: newUser });
    } catch (error: any) {
      logger.error("❌ [REGISTER] שגיאה בהרשמה", {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });
      throw error;
    }
  }),

  resetRequest: async (req: Request, res: Response) => {
    try {
      const response = await requestPasswordReset(req.body.email);
      res.json(response);
    } catch (err: any) {
      logger.error("❌ reset-request error:", { error: err.message });
      res.json(resetSafeResponse);
    }
  },

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await resetPasswordWithToken(req.body.token, req.body.password);
    res.json({ message: "הסיסמה עודכנה בהצלחה! אפשר להתחבר." });
  }),

  // Refresh access token using refresh token
  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(401, "Refresh token is required");
    }

    // Verify the refresh token and get user ID
    const userId = await verifyRefreshToken(refreshToken);

    // Get user data
    const user = await findUserById(userId);
    if (!user) {
      throw new AppError(401, "User not found");
    }

    // Generate new access token
    const newAccessToken = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name || "",
      artist_role: user.artist_role || null,
      avatar: user.avatar || null,
    });

    logger.debug("Access token refreshed", { userId });

    res.json({
      token: newAccessToken,
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
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
      logger.info("User logged out", { userId: req.user?.id });
    }

    res.json({ message: "התנתקת בהצלחה" });
  }),

  // Logout from all sessions - revoke all user's refresh tokens
  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, "Not authenticated");
    }

    await revokeAllUserTokens(userId);
    logger.info("User logged out from all sessions", { userId });

    res.json({ message: "התנתקת מכל המכשירים בהצלחה" });
  }),
};
