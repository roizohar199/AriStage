import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/public", subscriptionsController.getPublic);
router.get("/plans", subscriptionsController.getPlans);
router.get("/settings", subscriptionsController.getSettings);
router.get("/me", requireAuth, subscriptionsController.me);
router.put("/settings", subscriptionsController.updateSettings);

export const subscriptionsRouter = router;
