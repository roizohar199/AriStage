import { Router } from "express";
import { requireAuth, requireRoles } from "../src/middleware/auth.js";
import { adminUsersRouter } from "../src/modules/adminUsers/adminUsers.routes.js";
import { adminSubscriptionsRouter } from "../src/modules/adminSubscriptions/adminSubscriptions.routes.js";
import { logsRouter as adminLogsRouter } from "../src/modules/logs/logs.routes.js";
import { adminPaymentsRouter } from "../src/modules/adminPayments/adminPayments.routes.js";
import { adminPlansRouter } from "../src/modules/adminPlans/adminPlans.routes.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(["admin"]));

router.use("/users", adminUsersRouter);
router.use("/subscriptions", adminSubscriptionsRouter);
router.use("/logs", adminLogsRouter);
router.use("/payments", adminPaymentsRouter);
router.use("/plans", adminPlansRouter);

export default router;
