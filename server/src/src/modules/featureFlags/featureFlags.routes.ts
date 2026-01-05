import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { adminNoCache } from "../../middleware/adminNoCache.middleware.js";
import { featureFlagsController } from "./featureFlags.controller.js";

export const featureFlagsRouter = Router();

featureFlagsRouter.use(requireAuth);
featureFlagsRouter.use(requireRoles(["admin"]));

featureFlagsRouter.get("/", adminNoCache, featureFlagsController.list);
featureFlagsRouter.put("/:key", featureFlagsController.update);
