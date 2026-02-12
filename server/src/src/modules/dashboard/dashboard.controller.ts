import { asyncHandler } from "../../core/asyncHandler";
import {
  getDashboardPayload,
  getSharedDashboardStats,
} from "./dashboard.service";

export const dashboardController = {
  stats: asyncHandler(async (req, res) => {
    const payload = await getDashboardPayload(req.user);
    res.json(payload);
  }),
  sharedStats: asyncHandler(async (req, res) => {
    const stats = await getSharedDashboardStats(req.user);
    res.json(stats);
  }),
};
