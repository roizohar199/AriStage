import { asyncHandler } from "../../core/asyncHandler.js";
import { sendContactMessage } from "./support.service.js";

export const supportController = {
  contact: asyncHandler(async (req, res) => {
    await sendContactMessage(req.body);
    res.json({ ok: true });
  }),
};

