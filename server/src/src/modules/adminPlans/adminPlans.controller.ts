import { asyncHandler } from "../../core/asyncHandler.js";
import { AppError } from "../../core/errors.js";
import { logSystemEvent } from "../../utils/systemLogger.js";
import { resolveRequestLocale, tServer } from "../../i18n/serverI18n";
import {
  createPlan,
  listPlans,
  setPlanEnabled,
  updatePlan,
  deletePlan,
  type CreatePlanInput,
  type UpdatePlanInput,
} from "./adminPlans.repository.js";

function parsePlanId(raw: string, locale: "he-IL" | "en-US"): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new AppError(400, tServer(locale, "admin.invalidPlanId"), undefined);
  }
  return n;
}

function requireString(
  value: unknown,
  field: string,
  locale: "he-IL" | "en-US",
): string {
  const s = String(value ?? "").trim();
  if (!s) {
    throw new AppError(
      400,
      tServer(locale, "admin.fieldRequired", { field }),
      undefined,
    );
  }
  return s;
}

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function requireInt(
  value: unknown,
  field: string,
  locale: "he-IL" | "en-US",
): number {
  const n = Number(value);
  if (!Number.isFinite(n))
    throw new AppError(
      400,
      tServer(locale, "admin.fieldMustBeNumber", { field }),
      undefined,
    );
  return Math.trunc(n);
}

function requireEnabled(value: unknown, locale: "he-IL" | "en-US"): boolean {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  throw new AppError(
    400,
    tServer(locale, "admin.enabledMustBeBoolean"),
    undefined,
  );
}

export const adminPlansController = {
  list: asyncHandler(async (_req, res) => {
    const plans = await listPlans();
    res.json(plans);
  }),

  create: asyncHandler(async (req: any, res) => {
    const locale = resolveRequestLocale(req);
    const body = req.body || {};

    const input: CreatePlanInput = {
      key: requireString(body.key, "key", locale),
      name: requireString(body.name, "name", locale),
      description: optionalString(body.description),
      currency: requireString(body.currency, "currency", locale),
      monthly_price: requireInt(body.monthly_price, "monthly_price", locale),
      yearly_price: requireInt(body.yearly_price, "yearly_price", locale),
      enabled:
        body.enabled !== undefined
          ? requireEnabled(body.enabled, locale)
          : true,
    };

    const created = await createPlan(input);

    void logSystemEvent(
      "info",
      "admin_create_plan",
      "Admin created plan",
      { planId: created.id, key: created.key, enabled: created.enabled },
      Number(req.user?.id),
    );

    res.status(201).json(created);
  }),

  update: asyncHandler(async (req: any, res) => {
    const locale = resolveRequestLocale(req);
    const id = parsePlanId(String(req.params.id), locale);
    const body = req.body || {};

    const input: UpdatePlanInput = {
      key: requireString(body.key, "key", locale),
      name: requireString(body.name, "name", locale),
      description: optionalString(body.description),
      currency: requireString(body.currency, "currency", locale),
      monthly_price: requireInt(body.monthly_price, "monthly_price", locale),
      yearly_price: requireInt(body.yearly_price, "yearly_price", locale),
      enabled: requireEnabled(body.enabled, locale),
    };

    const updated = await updatePlan(id, input);
    if (!updated)
      throw new AppError(404, tServer(locale, "admin.planNotFound"), undefined);

    void logSystemEvent(
      "info",
      "admin_update_plan",
      "Admin updated plan",
      { planId: updated.id, key: updated.key, enabled: updated.enabled },
      Number(req.user?.id),
    );

    res.json(updated);
  }),

  toggleEnabled: asyncHandler(async (req: any, res) => {
    const locale = resolveRequestLocale(req);
    const id = parsePlanId(String(req.params.id), locale);
    const body = req.body || {};
    const enabled = requireEnabled(body.enabled, locale);

    const updated = await setPlanEnabled(id, enabled);
    if (!updated)
      throw new AppError(404, tServer(locale, "admin.planNotFound"), undefined);

    void logSystemEvent(
      "info",
      "admin_toggle_plan_enabled",
      "Admin toggled plan enabled",
      { planId: updated.id, key: updated.key, enabled: updated.enabled },
      Number(req.user?.id),
    );

    res.json(updated);
  }),

  delete: asyncHandler(async (req: any, res) => {
    const locale = resolveRequestLocale(req);
    const id = parsePlanId(String(req.params.id), locale);

    const success = await deletePlan(id);
    if (!success)
      throw new AppError(404, tServer(locale, "admin.planNotFound"), undefined);

    void logSystemEvent(
      "info",
      "admin_delete_plan",
      "Admin deleted plan",
      { planId: id },
      Number(req.user?.id),
    );

    res.json({ success: true });
  }),
};
