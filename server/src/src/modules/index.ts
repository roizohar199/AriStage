import { authRouter } from "./auth/auth.routes.js";
import { songsRouter } from "./songs/songs.routes.js";
import { lineupsRouter } from "./lineups/lineups.routes.js";
import { usersRouter } from "./users/users.routes.js";
import { lineupSongsRouter } from "./lineupSongs/lineupSongs.routes.js";
import { filesRouter } from "./files/files.routes.js";
import { dashboardRouter } from "./dashboard/dashboard.routes.js";
import { shareRouter } from "./share/share.routes.js";
import { supportRouter } from "./support/support.routes.js";
import { healthRouter } from "./health/health.routes.js";
import { subscriptionsRouter } from "./subscriptions/subscriptions.routes.js";
import { paymentsRouter } from "./payments/payments.routes.js";

import adminRouter from "../../routes/admin.js";

export function registerModules(app) {
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/subscriptions", subscriptionsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/songs", songsRouter);
  app.use("/api/lineups", lineupsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/lineup-songs", lineupSongsRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/dashboard-stats", dashboardRouter);
  app.use("/api/share", shareRouter);
  app.use("/support", supportRouter);
}
