import { authRouter } from "./auth/auth.routes";
import { songsRouter } from "./songs/songs.routes";
import { lineupsRouter } from "./lineups/lineups.routes";
import { usersRouter } from "./users/users.routes";
import { lineupSongsRouter } from "./lineupSongs/lineupSongs.routes";
import { filesRouter } from "./files/files.routes";
import { dashboardRouter } from "./dashboard/dashboard.routes";
import { shareRouter } from "./share/share.routes";
import { supportRouter } from "./support/support.routes";
import { healthRouter } from "./health/health.routes";
import { subscriptionsRouter } from "./subscriptions/subscriptions.routes";
import { paymentsRouter } from "./payments/payments.routes";
import { logsRouter } from "./logs/logs.routes";
import { errorsRouter } from "./errors/errors.routes";
import { featureFlagsRouter } from "./featureFlags/featureFlags.routes";
import { plansRouter } from "./plans/plans.routes";

import adminRouter from "../../routes/admin";

export function registerModules(app) {
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/plans", plansRouter);
  app.use("/api/subscriptions", subscriptionsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/logs", logsRouter);
  app.use("/api/errors", errorsRouter);
  app.use("/api/feature-flags", featureFlagsRouter);
  app.use("/api/songs", songsRouter);
  app.use("/api/lineups", lineupsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/lineup-songs", lineupSongsRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/dashboard-stats", dashboardRouter);
  app.use("/api/share", shareRouter);
  app.use("/support", supportRouter);
}
