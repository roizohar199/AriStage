import { asyncHandler } from "../../core/asyncHandler";
import { AppError } from "../../core/errors";
import { getSystemErrors, resolveSystemError } from "./errors.service";
import { logSystemEvent } from "../../utils/systemLogger";

export const errorsController = {
  list: asyncHandler(async (req, res) => {
    const rows = await getSystemErrors({ limit: req.query?.limit });
    res.json(rows);
  }),

  update: asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const resolved = Boolean(req.body?.resolved);

    const ok = await resolveSystemError(id, resolved);
    if (!ok) {
      throw new AppError(404, "Error not found");
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
