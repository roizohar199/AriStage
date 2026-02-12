import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth";
import { adminUsersController } from "./adminUsers.controller";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(["admin"]));

router.get("/", adminUsersController.listUsers);

// Update subscription fields for a user
router.get("/:id/subscription", adminUsersController.getSubscription);
router.put("/:id/subscription", adminUsersController.updateSubscription);

export const adminUsersRouter = router;
