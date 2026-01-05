import { asyncHandler } from "../../core/asyncHandler.js";
import { AppError } from "../../core/errors.js";
import { getFeatureFlags, setFeatureFlag } from "./featureFlags.service.js";
import { logSystemEvent } from "../../utils/systemLogger.js";

export const featureFlagsController = {
  list: asyncHandler(async (_req, res) => {
    const rows = await getFeatureFlags();
    res.json(rows);
  }),

  update: asyncHandler(async (req, res) => {
    const key = String(req.params.key || "").trim();
    if (!key) throw new AppError(400, "Missing feature flag key");

    const enabled = Boolean(req.body?.enabled);
    await setFeatureFlag(key, enabled);

    void logSystemEvent(
      "info",
      "FEATURE_FLAG_TOGGLED",
      "Feature flag toggled",
      { key, enabled },
      (req as any).user?.id
    );

    res.json({ ok: true });
  }),
};
