import { asyncHandler } from "../../core/asyncHandler";
import { resolveRequestLocale } from "../../i18n/serverI18n";
import { sendContactMessage } from "./support.service";

export const supportController = {
  contact: asyncHandler(async (req, res) => {
    await sendContactMessage(req.body, resolveRequestLocale(req));
    res.json({ ok: true });
  }),
};
