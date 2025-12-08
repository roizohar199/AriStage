import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { lineupSongsController } from "./lineupSongs.controller.js";
import { uploadChartPdf } from "../shared/upload.js";

const router = Router();

router.use(requireAuth);

router.get("/:lineupId", lineupSongsController.list);
router.post("/:lineupId", lineupSongsController.create);
router.put("/:lineupId/order", lineupSongsController.reorder);
router.delete("/:lineupId/:songId", lineupSongsController.remove);
router.post(
  "/:lineupSongId/upload-chart",
  uploadChartPdf.single("pdf"),
  lineupSongsController.uploadChart
);

export const lineupSongsRouter = router;

