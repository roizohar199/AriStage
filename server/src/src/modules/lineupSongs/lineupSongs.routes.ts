import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireActiveSubscription } from "../../middleware/subscription.js";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags.js";
import { emitRefreshOnMutation } from "../../middleware/refresh.js";
import { lineupSongsController } from "./lineupSongs.controller.js";
import { uploadChartPdf } from "../shared/upload.js";

const router = Router();

router.use(requireAuth);
router.use(requireActiveSubscription);
router.use(requireFeatureFlagEnabled("module.lineups"));

router.get("/:lineupId", lineupSongsController.list);
router.post("/:lineupId", lineupSongsController.create);
router.put("/:lineupId/order", lineupSongsController.reorder);
router.delete("/:lineupId/:songId", lineupSongsController.remove);
router.post(
  "/:lineupSongId/upload-chart",
  requireFeatureFlagEnabled("module.charts"),
  uploadChartPdf.single("pdf"),
  lineupSongsController.uploadChart,
);
router.delete(
  "/:lineupSongId/delete-chart",
  requireFeatureFlagEnabled("module.charts"),
  lineupSongsController.deleteChart
);

export const lineupSongsRouter = router;
