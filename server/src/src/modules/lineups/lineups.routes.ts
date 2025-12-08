import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { lineupsController } from "./lineups.controller.js";

const router = Router();

router.get("/public/:token", lineupsController.public);

router.use(requireAuth);

router.get("/", lineupsController.list);
router.get("/by-user/:userId", lineupsController.listByUserId);
router.get("/:id", lineupsController.get);
router.post("/", lineupsController.create);
router.put("/:id", lineupsController.update);

router.get("/:id/share", lineupsController.shareStatus);
router.post("/:id/share", lineupsController.generateShare);
router.delete("/:id/share", lineupsController.disableShare);

export const lineupsRouter = router;

