import { Router } from "express";
import { requireAuth, requireRoles } from "../../src/middleware/auth";

const router = Router();
router.use(requireAuth, requireRoles(["admin"]));

// TODO: Implement GET /api/admin/users
// TODO: Implement GET /api/admin/users/:id
// TODO: Implement PATCH /api/admin/users/:id
// TODO: Implement DELETE /api/admin/users/:id

export default router;
