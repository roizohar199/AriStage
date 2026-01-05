import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller.js";
import { requireAuth, requireRoles } from "../../middleware/auth.js";

const router = Router();

router.get("/public", subscriptionsController.getPublic);
router.get("/plans", subscriptionsController.getPlans);
router.get("/settings", subscriptionsController.getSettings);
router.get("/me", requireAuth, subscriptionsController.me);
router.put(
  "/settings",
  requireAuth,
  requireRoles(["admin"]),
  subscriptionsController.updateSettings
);

export const subscriptionsRouter = router;
