import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { emitRefreshOnMutation } from "../../middleware/refresh.js";
import { lineupsController } from "./lineups.controller.js";

const router = Router();

router.get("/public/:token", lineupsController.public);

router.use(requireAuth);

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

router.post("/:id/download-charts", lineupsController.downloadCharts);

export const lineupsRouter = router;
