import { asyncHandler } from "../../core/asyncHandler.js";
import {
  getDashboardPayload,
  getSharedDashboardStats,
} from "./dashboard.service.js";

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
