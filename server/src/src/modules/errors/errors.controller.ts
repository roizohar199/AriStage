import { asyncHandler } from "../../core/asyncHandler";
import { AppError } from "../../core/errors";
import { getSystemErrors, resolveSystemError } from "./errors.service";
import { logSystemEvent } from "../../utils/systemLogger";
import { tRequest } from "../../i18n/serverI18n";

export const errorsController = {
  list: asyncHandler(async (req, res) => {
    const rows = await getSystemErrors({ limit: req.query?.limit });
    res.json(rows);
  }),

  update: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const resolved =
      req.body?.resolved === true || req.body?.resolved === "true";

    const ok = await resolveSystemError(id, resolved);
    if (!ok) {
      throw new AppError(404, tRequest(req, "errors.recordNotFound"));
    }

    if (resolved) {
      void logSystemEvent(
        "info",
        "ERROR_RESOLVED",
        "Error marked as resolved",
        { errorId: id },
        (req as any).user?.id,
      );
    }

    res.json({ ok: true });
  }),
};
