import { asyncHandler } from "../../core/asyncHandler";
import {
  getDashboardPayload,
  getSharedDashboardStats,
} from "./dashboard.service";
import { resolveRequestLocale } from "../../i18n/serverI18n";

export const dashboardController = {
  stats: asyncHandler(async (req, res) => {
    const payload = await getDashboardPayload(
      req.user,
      resolveRequestLocale(req),
    );
    res.json(payload);
  }),
  sharedStats: asyncHandler(async (req, res) => {
    const stats = await getSharedDashboardStats(
      req.user,
      resolveRequestLocale(req),
    );
    res.json(stats);
  }),
};
