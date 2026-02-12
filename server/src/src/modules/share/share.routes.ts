import { Router } from "express";
import { shareController } from "./share.controller";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags";

const router = Router();

router.get(
  "/:token",
  requireFeatureFlagEnabled("module.shareLineup"),
  shareController.getByToken,
);

export const shareRouter = router;
