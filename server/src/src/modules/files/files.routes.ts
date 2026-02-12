import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireActiveSubscription } from "../../middleware/subscription";
import { emitRefreshOnMutation } from "../../middleware/refresh";
import { filesController } from "./files.controller";

const router = Router();

router.use(requireAuth);
router.use(requireActiveSubscription);

// כל פעולה של POST/PUT/DELETE במודול Files תגרום ל־global:refresh
router.use(emitRefreshOnMutation);

router.get("/", filesController.list);
router.post("/", filesController.create);
router.put("/:id", filesController.update);
router.delete("/:id", filesController.remove);

export const filesRouter = router;
