import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireActiveSubscription } from "../../middleware/subscription";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags";
import { emitRefreshOnMutation } from "../../middleware/refresh";
import { uploadLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { lineupSongsController } from "./lineupSongs.controller";
import { uploadChartPdf } from "../shared/upload";
import {
  lineupSongCreateSchema,
  lineupSongReorderSchema,
} from "../../validation/schemas/app.schemas";

const router = Router();

router.use(requireAuth);
router.use(requireActiveSubscription);
router.use(requireFeatureFlagEnabled("module.lineups"));

router.get("/:lineupId", lineupSongsController.list);
router.post(
  "/:lineupId",
  validateBody(lineupSongCreateSchema),
  lineupSongsController.create,
);
router.put(
  "/:lineupId/order",
  validateBody(lineupSongReorderSchema),
  lineupSongsController.reorder,
);
router.delete("/:lineupId/:songId", lineupSongsController.remove);
router.post(
  "/:lineupSongId/upload-chart",
  requireFeatureFlagEnabled("module.charts"),
  uploadLimiter,
  uploadChartPdf.single("pdf"),
  lineupSongsController.uploadChart,
);
router.delete(
  "/:lineupSongId/delete-chart",
  requireFeatureFlagEnabled("module.charts"),
  lineupSongsController.deleteChart,
);

export const lineupSongsRouter = router;
