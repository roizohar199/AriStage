import { asyncHandler } from "../../core/asyncHandler";
import { getHealthSnapshot } from "./health.service";

export const healthController = {
  check: asyncHandler(async (req, res) => {
    const result = await getHealthSnapshot();
    res.json(result);
  }),
};
