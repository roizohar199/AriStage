import { asyncHandler } from "../../core/asyncHandler";
import { sendContactMessage } from "./support.service";

export const supportController = {
  contact: asyncHandler(async (req, res) => {
    await sendContactMessage(req.body);
    res.json({ ok: true });
  }),
};
