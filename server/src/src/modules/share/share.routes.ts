import { Router } from "express";
import { shareController } from "./share.controller.js";

const router = Router();

router.get("/:token", shareController.getByToken);

export const shareRouter = router;

