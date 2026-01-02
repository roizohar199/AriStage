// Main admin router
import { Router } from "express";
import usersRouter from "./users.js";
import subscriptionsRouter from "./subscriptions.js";
import repositoriesRouter from "./repositories.js";
import filesRouter from "./files.js";
import invitationsRouter from "./invitations.js";
import logsRouter from "./logs.js";
import issuesRouter from "./issues.js";
import featureFlagsRouter from "./featureFlags.js";
import systemRouter from "./system.js";

const adminRouter = Router();

adminRouter.use("/users", usersRouter);
adminRouter.use("/subscriptions", subscriptionsRouter);
adminRouter.use("/repositories", repositoriesRouter);
adminRouter.use("/files", filesRouter);
adminRouter.use("/invitations", invitationsRouter);
adminRouter.use("/logs", logsRouter);
adminRouter.use("/issues", issuesRouter);
adminRouter.use("/feature-flags", featureFlagsRouter);
adminRouter.use("/system", systemRouter);

export default adminRouter;
