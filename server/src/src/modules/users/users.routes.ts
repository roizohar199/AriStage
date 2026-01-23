import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { requireActiveSubscription } from "../../middleware/subscription.js";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags.js";
import { emitRefreshOnMutation } from "../../middleware/refresh.js";
import { usersController } from "./users.controller.js";
import { uploadUserAvatar } from "../shared/upload.js"; // ⭐ שימוש נכון

const router = Router();

// ⭐ קבלת הזמנה (public route - לא דורש auth)
router.get(
  "/invite/:token",
  requireFeatureFlagEnabled("module.pendingInvitations"),
  usersController.acceptInvitation,
);

router.use(requireAuth);
router.use(requireActiveSubscription);

// כל פעולה של POST/PUT/DELETE במודול Users תגרום ל־global:refresh
router.use(emitRefreshOnMutation);

router.get("/me", usersController.me);

// ⭐ מאגר אמנים — מי הזמין אותי
router.get(
  "/my-collection",
  requireFeatureFlagEnabled("module.invitedMeArtists"),
  usersController.myCollection,
);

// ⭐ מחוברים אליי — מי אני הזמנתי
router.get(
  "/connected-to-me",
  requireFeatureFlagEnabled("module.inviteArtist"),
  usersController.connectedToMe,
);

// ⭐ מסלול עדכון משתמש עם העלאת תמונה לפי משתמש
router.put(
  "/settings",
  uploadUserAvatar.single("avatar"), // ← תמיכה ב־FormData + שמירה לפי userId
  usersController.updateSettings,
);

router.delete("/avatar", usersController.deleteAvatar);

router.put("/password", usersController.updatePassword);

router.get("/", usersController.list);

router.post("/", requireRoles(["admin", "manager"]), usersController.create);

router.put("/:id", usersController.update);

router.delete("/:id", requireRoles(["admin"]), usersController.remove);

router.post(
  "/:id/impersonate",
  requireRoles(["admin"]),
  usersController.impersonate,
);

// ⭐ הזמנת אמן למאגר שלי
router.post(
  "/invite-artist",
  requireFeatureFlagEnabled("module.inviteArtist"),
  usersController.inviteArtist,
);

// ⭐ ביטול הזמנת אמן מהמאגר שלי
router.post(
  "/uninvite-artist",
  requireFeatureFlagEnabled("module.inviteArtist"),
  usersController.uninviteArtist,
);

// ⭐ אורח מבטל את השתתפותו במאגר
router.post(
  "/leave-collection",
  requireFeatureFlagEnabled("module.invitedMeArtists"),
  usersController.leaveCollection,
);

// ⭐ קבלת הזמנה ממתינה לאישור
router.get(
  "/pending-invitation",
  requireFeatureFlagEnabled("module.pendingInvitations"),
  usersController.pendingInvitation,
);

// ⭐ אישור הזמנה
router.post(
  "/accept-invitation",
  requireFeatureFlagEnabled("module.pendingInvitations"),
  usersController.acceptInvitationStatus,
);

// ⭐ דחיית הזמנה
router.post(
  "/reject-invitation",
  requireFeatureFlagEnabled("module.pendingInvitations"),
  usersController.rejectInvitationStatus,
);

// ⭐ בדיקה אם משתמש הוא אורח
router.get("/check-guest", usersController.checkGuest);

// ⭐ שליחת הזמנה במייל
router.post("/send-invitation", usersController.sendInvitation);

export const usersRouter = router;
