import { asyncHandler } from "../../core/asyncHandler";
import { getSystemLogs } from "./logs.service";

export const logsController = {
  list: asyncHandler(async (req, res) => {
    const rows = await getSystemLogs({ limit: (req as any).query?.limit });
    res.json(rows);
  }),
};
