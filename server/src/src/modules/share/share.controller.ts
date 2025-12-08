import { asyncHandler } from "../../core/asyncHandler.js";
import { getSharedLineup } from "./share.service.js";

export const shareController = {
  getByToken: asyncHandler(async (req, res) => {
    const payload = await getSharedLineup(req.params.token);
    res.json(payload);
  }),
};

