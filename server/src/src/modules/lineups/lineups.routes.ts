import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireActiveSubscription } from "../../middleware/subscription.js";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags.js";
import { emitRefreshOnMutation } from "../../middleware/refresh.js";
import { lineupsController } from "./lineups.controller.js";

const router = Router();

router.get(
  "/public/:token",
  requireFeatureFlagEnabled("module.lineups"),
  lineupsController.public
);

router.use(requireAuth);
router.use(requireActiveSubscription);
router.use(requireFeatureFlagEnabled("module.lineups"));

// כל פעולה של POST/PUT/DELETE במודול Lineups תגרום ל־global:refresh
router.use(emitRefreshOnMutation);

router.get("/", lineupsController.list);
router.get("/shared-with-me", lineupsController.sharedWithMe);
router.get("/by-user/:userId", lineupsController.listByUserId);
router.get("/:id", lineupsController.get);
router.post("/", lineupsController.create);
router.put("/:id", lineupsController.update);
router.delete("/:id", lineupsController.remove);

router.get("/:id/share", lineupsController.shareStatus);
router.post("/:id/share", lineupsController.generateShare);
router.delete("/:id/share", lineupsController.disableShare);

router.post(
  "/:id/download-charts",
  requireFeatureFlagEnabled("module.charts"),
  lineupsController.downloadCharts
);
router.post(
  "/:id/download-lyrics",
  requireFeatureFlagEnabled("module.lyrics"),
  lineupsController.downloadLyrics
);

export const lineupsRouter = router;
