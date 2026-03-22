import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireActiveSubscription } from "../../middleware/subscription";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags";
import { emitRefreshOnMutation } from "../../middleware/refresh";
import {
  sensitiveOperationLimiter,
  uploadLimiter,
} from "../../middleware/rateLimiter";
import {
  resolveRequestLocale,
  tRequest,
  translateServerMessage,
} from "../../i18n/serverI18n";
import { songsController } from "./songs.controller";
import { uploadSongChartPdf } from "../shared/upload";

const router = Router();

function getUploadErrorMessage(req: any, err: any): string {
  const fallbackMessage = tRequest(req, "songs.chartUploadFailed");
  const rawMessage = typeof err?.message === "string" ? err.message.trim() : "";

  if (!rawMessage) return fallbackMessage;

  return (
    translateServerMessage(resolveRequestLocale(req), rawMessage) ||
    fallbackMessage
  );
}

router.use(requireAuth);
router.use(requireActiveSubscription);

// כל פעולה של POST/PUT/DELETE במודול Songs תגרום ל־global:refresh
router.use(emitRefreshOnMutation);

router.get("/", songsController.list);
router.post(
  "/",
  requireFeatureFlagEnabled("module.addSongs"),
  sensitiveOperationLimiter,
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
  uploadLimiter,
  (req, res, next) => {
    uploadSongChartPdf.single("pdf")(req, res, (err: any) => {
      if (err) {
        return res
          .status(400)
          .json({ message: getUploadErrorMessage(req, err) });
      }
      next();
    });
  },
  songsController.uploadPrivateChart,
);
router.delete(
  "/:id/private-charts/:chartId",
  requireFeatureFlagEnabled("module.charts"),
  sensitiveOperationLimiter,
  songsController.deletePrivateChart,
);
router.put(
  "/:id",
  requireFeatureFlagEnabled("module.addSongs"),
  sensitiveOperationLimiter,
  songsController.update,
);
router.delete(
  "/:id",
  requireFeatureFlagEnabled("module.addSongs"),
  sensitiveOperationLimiter,
  songsController.remove,
);
router.post(
  "/:id/upload-chart",
  requireFeatureFlagEnabled("module.charts"),
  uploadLimiter,
  (req, res, next) => {
    uploadSongChartPdf.single("pdf")(req, res, (err: any) => {
      if (err) {
        return res
          .status(400)
          .json({ message: getUploadErrorMessage(req, err) });
      }
      next();
    });
  },
  songsController.uploadChart,
);
router.delete(
  "/:id/delete-chart",
  requireFeatureFlagEnabled("module.charts"),
  sensitiveOperationLimiter,
  songsController.deleteChart,
);

router.put(
  "/:id/lyrics",
  requireFeatureFlagEnabled("module.lyrics"),
  sensitiveOperationLimiter,
  songsController.upsertLyrics,
);
router.delete(
  "/:id/lyrics",
  requireFeatureFlagEnabled("module.lyrics"),
  sensitiveOperationLimiter,
  songsController.deleteLyrics,
);

export const songsRouter = router;
