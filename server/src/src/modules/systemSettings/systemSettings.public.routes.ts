import { Router } from "express";
import * as controller from "./systemSettings.controller.js";

const router = Router();

// Public i18n configuration (used by client bootstrap before login)
router.get("/i18n", controller.getI18nSettings);

export default router;
