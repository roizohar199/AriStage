import { asyncHandler } from "../../core/asyncHandler.js";
import { getDashboardPayload } from "./dashboard.service.js";

export const dashboardController = {
  stats: asyncHandler(async (req, res) => {
    const payload = await getDashboardPayload(req.user);
    res.json(payload);
  }),
};

