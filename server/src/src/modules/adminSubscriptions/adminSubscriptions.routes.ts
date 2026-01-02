import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { adminSubscriptionsController } from "./adminSubscriptions.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(["admin"]));

router.get("/settings", adminSubscriptionsController.getSettings);
router.put("/settings", adminSubscriptionsController.updateSettings);
router.get("/users", adminSubscriptionsController.listUsers);

export const adminSubscriptionsRouter = router;
