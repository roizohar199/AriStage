import { Router } from "express";
import { requireAuth, requireRoles } from "../../src/middleware/auth";

const router = Router();
router.use(requireAuth, requireRoles(["admin"]));

// TODO: Implement GET /api/admin/files
// TODO: Implement DELETE /api/admin/files/:id

export default router;
