import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth";
import { adminNoCache } from "../../middleware/adminNoCache.middleware";
import { errorsController } from "./errors.controller";

export const errorsRouter = Router();

errorsRouter.use(requireAuth);
errorsRouter.use(requireRoles(["admin", "manager"]));

errorsRouter.get("/", adminNoCache, errorsController.list);
errorsRouter.put("/:id", errorsController.update);
