import { Router } from "express";
import { requireAuth, requireRoles } from "../../src/middleware/auth";

const router = Router();
router.use(requireAuth, requireRoles(["admin"]));

// TODO: Implement GET /api/admin/feature-flags
// TODO: Implement PATCH /api/admin/feature-flags/:key

export default router;
