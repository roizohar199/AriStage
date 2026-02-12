import { asyncHandler } from "../../core/asyncHandler";
import { getPlanByKey, listEnabledPlans } from "./plans.repository";
import { AppError } from "../../core/errors";

export const plansController = {
  listPublic: asyncHandler(async (req, res) => {
    const plans = await listEnabledPlans();
    res.json({ plans });
  }),

  // Legacy response shape: return the array directly (client expects Array.isArray(data) === true)
  listPublicLegacy: asyncHandler(async (_req, res) => {
    const plans = await listEnabledPlans();
    res.json(plans);
  }),

  getByKey: asyncHandler(async (req, res) => {
    const key = String(req.params.key ?? "")
      .trim()
      .toLowerCase();
    if (!key) {
      throw new AppError(400, "key is required");
    }

    const plan = await getPlanByKey(key);
    if (!plan) {
      throw new AppError(404, "Plan not found");
    }

    res.json({ plan });
  }),
};
