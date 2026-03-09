import { Router } from "express";
import { requireAuth, requireRoles } from "../src/middleware/auth";
import { adminUsersRouter } from "../src/modules/adminUsers/adminUsers.routes";
import { adminSubscriptionsRouter } from "../src/modules/adminSubscriptions/adminSubscriptions.routes";
import { logsRouter as adminLogsRouter } from "../src/modules/logs/logs.routes";
import { adminPaymentsRouter } from "../src/modules/adminPayments/adminPayments.routes";
import { adminPlansRouter } from "../src/modules/adminPlans/adminPlans.routes";
import systemSettingsRouter from "../src/modules/systemSettings/systemSettings.routes";
import adminFilesRouter from "./admin/files";
import adminSecurityRouter from "./admin/security";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(["admin"]));

router.use("/users", adminUsersRouter);
router.use("/subscriptions", adminSubscriptionsRouter);
router.use("/logs", adminLogsRouter);
router.use("/payments", adminPaymentsRouter);
router.use("/plans", adminPlansRouter);
router.use("/system-settings", systemSettingsRouter);
router.use("/files", adminFilesRouter);
router.use("/security", adminSecurityRouter);

export default router;
