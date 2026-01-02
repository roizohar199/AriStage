import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller.js";

const router = Router();

router.get("/public", subscriptionsController.getPublic);
router.get("/plans", subscriptionsController.getPlans);
router.put("/settings", subscriptionsController.updateSettings);

export const subscriptionsRouter = router;
