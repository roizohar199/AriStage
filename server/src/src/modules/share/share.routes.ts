import { Router } from "express";
import { shareController } from "./share.controller.js";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags.js";

const router = Router();

router.get(
  "/:token",
  requireFeatureFlagEnabled("module.shareLineup"),
  shareController.getByToken,
);

export const shareRouter = router;
