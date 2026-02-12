import { Router } from "express";
import { plansController } from "./plans.controller";

const router = Router();

// Canonical public endpoint
router.get("/", plansController.listPublic);
// Backwards compatible endpoint used by the client (expects an array)
router.get("/available", plansController.listPublicLegacy);
router.get("/:key", plansController.getByKey);

export const plansRouter = router;
