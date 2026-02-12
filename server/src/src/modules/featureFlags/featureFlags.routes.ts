import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth";
import {
  adminNoCache,
  adminNoCacheIfAdmin,
} from "../../middleware/adminNoCache.middleware";
import { featureFlagsController } from "./featureFlags.controller";

export const featureFlagsRouter = Router();

featureFlagsRouter.use(requireAuth);

// Client-accessible flags (requires auth, no admin role needed)
featureFlagsRouter.get(
  "/client",
  adminNoCacheIfAdmin,
  featureFlagsController.listClient,
);

// Admin management
featureFlagsRouter.use(requireRoles(["admin"]));
featureFlagsRouter.get("/", adminNoCache, featureFlagsController.list);
featureFlagsRouter.put("/:key", featureFlagsController.update);
