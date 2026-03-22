import { Router } from "express";
import { sensitiveOperationLimiter } from "../../middleware/rateLimiter";
import { validateBody } from "../../middleware/validate";
import { supportController } from "./support.controller";
import { supportContactSchema } from "../../validation/schemas/app.schemas";

const router = Router();

router.post(
  "/contact",
  sensitiveOperationLimiter,
  validateBody(supportContactSchema),
  supportController.contact,
);

export const supportRouter = router;
