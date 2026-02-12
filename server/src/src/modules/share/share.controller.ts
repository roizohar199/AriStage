import { asyncHandler } from "../../core/asyncHandler";
import { getSharedLineup } from "./share.service";

export const shareController = {
  getByToken: asyncHandler(async (req, res) => {
    const payload = await getSharedLineup(req.params.token);
    res.json(payload);
  }),
};
