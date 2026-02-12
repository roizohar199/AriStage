import { Router } from "express";
import { requireAuth, requireRoles } from "../src/middleware/auth";
import { adminUsersRouter } from "../src/modules/adminUsers/adminUsers.routes";
import { adminSubscriptionsRouter } from "../src/modules/adminSubscriptions/adminSubscriptions.routes";
import { logsRouter as adminLogsRouter } from "../src/modules/logs/logs.routes";
import { adminPaymentsRouter } from "../src/modules/adminPayments/adminPayments.routes";
import { adminPlansRouter } from "../src/modules/adminPlans/adminPlans.routes";
import adminFilesRouter from "./admin/files";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(["admin"]));

router.use("/users", adminUsersRouter);
router.use("/subscriptions", adminSubscriptionsRouter);
router.use("/logs", adminLogsRouter);
router.use("/payments", adminPaymentsRouter);
router.use("/plans", adminPlansRouter);
router.use("/files", adminFilesRouter);

export default router;
