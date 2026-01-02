import { Router } from "express";
import { requireAuth, requireRoles } from "../../src/middleware/auth";

const router = Router();
router.use(requireAuth, requireRoles(["admin"]));

// TODO: Implement GET /api/admin/system/health
// TODO: Implement GET /api/admin/system/stats

export default router;
