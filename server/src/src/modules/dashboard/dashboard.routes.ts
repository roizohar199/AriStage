import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireActiveSubscription } from "../../middleware/subscription.js";
import { adminNoCacheIfAdmin } from "../../middleware/adminNoCache.middleware.js";
import { dashboardController } from "./dashboard.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireActiveSubscription);

router.get("/", adminNoCacheIfAdmin, dashboardController.stats);
router.get("/shared", dashboardController.sharedStats);

export const dashboardRouter = router;
