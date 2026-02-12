import { Router } from "express";
import { supportController } from "./support.controller";

const router = Router();

router.post("/contact", supportController.contact);

export const supportRouter = router;
