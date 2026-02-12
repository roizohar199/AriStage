import { asyncHandler } from "../../core/asyncHandler";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  resetSafeResponse,
} from "./auth.service";
import { logger } from "../../core/logger";
import { Request, Response } from "express";
import { logSystemEvent } from "../../utils/systemLogger";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const payload = await loginUser(req.body.email, req.body.password);

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
};
