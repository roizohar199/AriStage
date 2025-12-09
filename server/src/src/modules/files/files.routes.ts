import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { emitRefreshOnMutation } from "../../middleware/refresh.js";
import { filesController } from "./files.controller.js";

const router = Router();

router.use(requireAuth);

// כל פעולה של POST/PUT/DELETE במודול Files תגרום ל־global:refresh
router.use(emitRefreshOnMutation);

router.get("/", filesController.list);
router.post("/", filesController.create);
router.put("/:id", filesController.update);
router.delete("/:id", filesController.remove);

export const filesRouter = router;

