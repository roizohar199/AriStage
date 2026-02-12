import { Router } from "express";
import { authController } from "./auth.controller";
import { uploadTempAvatar } from "../shared/upload";

const router = Router();

router.post("/login", authController.login);

// ⭐ בהרשמה — העלאה לתיקייה זמנית
router.post(
  "/register",
  uploadTempAvatar.single("avatar"),
  authController.register,
);

router.post("/reset-request", authController.resetRequest);
router.post("/reset-password", authController.resetPassword);

export const authRouter = router;
