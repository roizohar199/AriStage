import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import * as controller from "./systemSettings.controller.js";

const router = Router();

// Public route - i18n settings available to all authenticated users
router.get("/i18n", requireAuth, controller.getI18nSettings);

// Admin-only routes
router.use(requireAuth, requireRoles(["admin"]));

router.get("/", controller.listSystemSettings);
router.put("/i18n", controller.updateI18nSettings);

export default router;
