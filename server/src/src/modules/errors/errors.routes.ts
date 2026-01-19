import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { adminNoCache } from "../../middleware/adminNoCache.middleware.js";
import { errorsController } from "./errors.controller.js";

export const errorsRouter = Router();

errorsRouter.use(requireAuth);
errorsRouter.use(requireRoles(["admin", "manager"]));

errorsRouter.get("/", adminNoCache, errorsController.list);
errorsRouter.put("/:id", errorsController.update);
