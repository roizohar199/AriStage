import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth.js";
import { adminPlansController } from "./adminPlans.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(["admin"]));

router.get("/", adminPlansController.list);
router.post("/", adminPlansController.create);
router.put("/:id", adminPlansController.update);
router.patch("/:id/enabled", adminPlansController.toggleEnabled);
router.delete("/:id", adminPlansController.delete);

export const adminPlansRouter = router;
