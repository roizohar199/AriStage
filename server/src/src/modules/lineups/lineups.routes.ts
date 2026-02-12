import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireActiveSubscription } from "../../middleware/subscription";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags";
import { emitRefreshOnMutation } from "../../middleware/refresh";
import { lineupsController } from "./lineups.controller";

const router = Router();

router.get(
  "/public/:token",
  requireFeatureFlagEnabled("module.lineups"),
  requireFeatureFlagEnabled("module.shareLineup"),
  lineupsController.public,
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

router.get(
  "/:id/share",
  requireFeatureFlagEnabled("module.shareLineup"),
  lineupsController.shareStatus,
);
router.post(
  "/:id/share",
  requireFeatureFlagEnabled("module.shareLineup"),
  lineupsController.generateShare,
);
router.delete(
  "/:id/share",
  requireFeatureFlagEnabled("module.shareLineup"),
  lineupsController.disableShare,
);

router.post(
  "/:id/download-charts",
  requireFeatureFlagEnabled("module.charts"),
  lineupsController.downloadCharts,
);
router.post(
  "/:id/download-lyrics",
  requireFeatureFlagEnabled("module.lyrics"),
  lineupsController.downloadLyrics,
);

export const lineupsRouter = router;
