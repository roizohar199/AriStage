import { Router } from "express";
import { requireAuth, requireRoles } from "../../src/middleware/auth";

const router = Router();
router.use(requireAuth, requireRoles(["admin"]));

// TODO: Implement GET /api/admin/repositories
// TODO: Implement DELETE /api/admin/repositories/:type/:id

export default router;
