import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth";
import { adminNoCache } from "../../middleware/adminNoCache.middleware";
import { logsController } from "./logs.controller";

export const logsRouter = Router();

logsRouter.use(requireAuth);
logsRouter.use(requireRoles(["admin", "manager"]));

logsRouter.get("/", adminNoCache, logsController.list);
