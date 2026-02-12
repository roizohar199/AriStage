import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireActiveSubscription } from "../../middleware/subscription";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags";
import { emitRefreshOnMutation } from "../../middleware/refresh";
import { songsController } from "./songs.controller";
import { uploadSongChartPdf } from "../shared/upload";

const router = Router();

router.use(requireAuth);
router.use(requireActiveSubscription);

// כל פעולה של POST/PUT/DELETE במודול Songs תגרום ל־global:refresh
router.use(emitRefreshOnMutation);

router.get("/", songsController.list);
router.post(
  "/",
  requireFeatureFlagEnabled("module.addSongs"),
  songsController.create,
);
router.get(
  "/:id/private-charts",
  requireFeatureFlagEnabled("module.charts"),
  songsController.getPrivateCharts,
);
router.post(
  "/:id/private-charts",
  requireFeatureFlagEnabled("module.charts"),
  (req, res, next) => {
    uploadSongChartPdf.single("pdf")(req, res, (err: any) => {
      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "שגיאה בהעלאת הקובץ" });
      }
      next();
    });
  },
  songsController.uploadPrivateChart,
);
router.delete(
  "/:id/private-charts/:chartId",
  requireFeatureFlagEnabled("module.charts"),
  songsController.deletePrivateChart,
);
router.put(
  "/:id",
  requireFeatureFlagEnabled("module.addSongs"),
  songsController.update,
);
router.delete(
  "/:id",
  requireFeatureFlagEnabled("module.addSongs"),
  songsController.remove,
);
router.post(
  "/:id/upload-chart",
  requireFeatureFlagEnabled("module.charts"),
  (req, res, next) => {
    uploadSongChartPdf.single("pdf")(req, res, (err: any) => {
      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "שגיאה בהעלאת הקובץ" });
      }
      next();
    });
  },
  songsController.uploadChart,
);
router.delete(
  "/:id/delete-chart",
  requireFeatureFlagEnabled("module.charts"),
  songsController.deleteChart,
);

router.put(
  "/:id/lyrics",
  requireFeatureFlagEnabled("module.lyrics"),
  songsController.upsertLyrics,
);
router.delete(
  "/:id/lyrics",
  requireFeatureFlagEnabled("module.lyrics"),
  songsController.deleteLyrics,
);

export const songsRouter = router;
