import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { songsController } from "./songs.controller.js";
import { uploadSongChartPdf } from "../shared/upload.js";

const router = Router();

router.use(requireAuth);

router.get("/", songsController.list);
router.post("/", songsController.create);
router.put("/:id", songsController.update);
router.delete("/:id", songsController.remove);
router.post(
  "/:id/upload-chart",
  (req, res, next) => {
    uploadSongChartPdf.single("pdf")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || "שגיאה בהעלאת הקובץ" });
      }
      next();
    });
  },
  songsController.uploadChart
);
router.delete("/:id/delete-chart", songsController.deleteChart);

export const songsRouter = router;

