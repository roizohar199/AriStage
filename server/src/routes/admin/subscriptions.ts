import { Router } from "express";
import { requireAuth, requireRoles } from "../../src/middleware/auth";

const router = Router();
router.use(requireAuth, requireRoles(["admin"]));

// TODO: Implement GET /api/admin/subscriptions
// TODO: Implement PATCH /api/admin/subscriptions/:userId
// TODO: Implement POST /api/admin/subscriptions/grant

export default router;
