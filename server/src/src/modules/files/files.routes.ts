import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { filesController } from "./files.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", filesController.list);
router.post("/", filesController.create);
router.put("/:id", filesController.update);
router.delete("/:id", filesController.remove);

export const filesRouter = router;

