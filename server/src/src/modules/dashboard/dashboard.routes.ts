import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireActiveSubscription } from "../../middleware/subscription";
import { adminNoCacheIfAdmin } from "../../middleware/adminNoCache.middleware";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.use(requireAuth);
router.use(requireActiveSubscription);

router.get("/", adminNoCacheIfAdmin, dashboardController.stats);
router.get("/shared", dashboardController.sharedStats);

export const dashboardRouter = router;
