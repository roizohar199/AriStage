import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { emitRefreshOnMutation } from "../../middleware/refresh.js";
import { lineupSongsController } from "./lineupSongs.controller.js";
import { uploadChartPdf } from "../shared/upload.js";

const router = Router();

router.use(requireAuth);

// כל פעולה של POST/PUT/DELETE במודול LineupSongs תגרום ל־global:refresh
router.use(emitRefreshOnMutation);

router.get("/:lineupId", lineupSongsController.list);
router.post("/:lineupId", lineupSongsController.create);
router.put("/:lineupId/order", lineupSongsController.reorder);
router.delete("/:lineupId/:songId", lineupSongsController.remove);
router.post(
  "/:lineupSongId/upload-chart",
  uploadChartPdf.single("pdf"),
  lineupSongsController.uploadChart
);
router.delete("/:lineupSongId/delete-chart", lineupSongsController.deleteChart);

export const lineupSongsRouter = router;

