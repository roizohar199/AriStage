import { asyncHandler } from "../../core/asyncHandler.js";
import { getHealthSnapshot } from "./health.service.js";

export const healthController = {
  check: asyncHandler(async (req, res) => {
    const result = await getHealthSnapshot();
    res.json(result);
  }),
};

