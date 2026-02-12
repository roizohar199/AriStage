import { asyncHandler } from "../../core/asyncHandler";
import { AppError } from "../../core/errors";
import { getFeatureFlags, setFeatureFlag } from "./featureFlags.service";
import { logSystemEvent } from "../../utils/systemLogger";
import { clearFeatureFlagsCache } from "../../middleware/featureFlags";

export const featureFlagsController = {
  list: asyncHandler(async (_req, res) => {
    const rows = await getFeatureFlags();
    res.json(rows);
  }),

  listClient: asyncHandler(async (_req, res) => {
    const rows = await getFeatureFlags();
    const clientRows = (Array.isArray(rows) ? rows : []).filter((r: any) =>
      String(r?.key || "").startsWith("module."),
    );
    res.json(clientRows);
  }),

  update: asyncHandler(async (req, res) => {
    const key = String(req.params.key || "").trim();
    if (!key) throw new AppError(400, "Missing feature flag key");

    const enabled = Boolean(req.body?.enabled);
    const description =
      req.body?.description === undefined ? undefined : req.body?.description;

    await setFeatureFlag(key, enabled, description);
    clearFeatureFlagsCache();

    void logSystemEvent(
      "info",
      "FEATURE_FLAG_TOGGLED",
      "Feature flag toggled",
      { key, enabled, description },
      (req as any).user?.id,
    );

    res.json({ ok: true });
  }),
};
