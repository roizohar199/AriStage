import { asyncHandler } from "../../core/asyncHandler.js";
import { AppError } from "../../core/errors.js";
import { logger } from "../../core/logger.js";
import { logSystemEvent } from "../../utils/systemLogger.js";
import { resolveRequestLocale, tServer } from "../../i18n/serverI18n";
import type { BillingPeriod } from "../../services/subscriptionService.js";
import { markSubscriptionCancelledAtPeriodEnd } from "../../services/subscriptionService.js";
import { listActiveProviderSubscriptionsForPlanPeriod } from "../payments/payments.repository.js";
import { cancelPayPalSubscription } from "../payments/paypal.service.js";
import {
  createPlan,
  getPlanById,
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

async function cancelDisabledBillingPeriodRenewals(params: {
  planKey: string;
  billingPeriod: BillingPeriod;
}) {
  const activeSubscriptions =
    await listActiveProviderSubscriptionsForPlanPeriod({
      provider: "paypal",
      planKey: params.planKey,
      billingPeriod: params.billingPeriod,
    });

  let cancelledCount = 0;
  let failedCount = 0;

  for (const subscription of activeSubscriptions) {
    try {
      await cancelPayPalSubscription(
        subscription.provider_subscription_id,
        `Plan ${params.planKey}/${params.billingPeriod} was disabled by admin`,
      );
      await markSubscriptionCancelledAtPeriodEnd({
        userId: subscription.user_id,
        cancelledAt: new Date(),
        renewsAt: subscription.subscription_renews_at,
        provider: "paypal",
        providerSubscriptionId: subscription.provider_subscription_id,
      });
      cancelledCount += 1;
    } catch (error) {
      failedCount += 1;
      logger.error(
        "Failed to cancel PayPal renewal after plan period disable",
        {
          planKey: params.planKey,
          billingPeriod: params.billingPeriod,
          userId: subscription.user_id,
          providerSubscriptionId: subscription.provider_subscription_id,
          error,
        },
      );
    }
  }

  return {
    billingPeriod: params.billingPeriod,
    affectedCount: activeSubscriptions.length,
    cancelledCount,
    failedCount,
  };
}

async function enforcePlanAvailabilityTransitions(params: {
  previousPlan: Awaited<ReturnType<typeof getPlanById>>;
  nextPlan: Awaited<ReturnType<typeof getPlanById>>;
}) {
  const previousPlan = params.previousPlan;
  const nextPlan = params.nextPlan;
  if (!previousPlan || !nextPlan) {
    return [];
  }

  const periodsToDisable = (["monthly", "yearly"] as const).filter(
    (billingPeriod) => {
      const previousEnabled =
        previousPlan.enabled &&
        (billingPeriod === "monthly"
          ? previousPlan.monthly_enabled
          : previousPlan.yearly_enabled);
      const nextEnabled =
        nextPlan.enabled &&
        (billingPeriod === "monthly"
          ? nextPlan.monthly_enabled
          : nextPlan.yearly_enabled);

      return previousEnabled && !nextEnabled;
    },
  );

  const results: Array<{
    billingPeriod: BillingPeriod;
    affectedCount: number;
    cancelledCount: number;
    failedCount: number;
  }> = [];
  for (const billingPeriod of periodsToDisable) {
    results.push(
      await cancelDisabledBillingPeriodRenewals({
        planKey: nextPlan.key,
        billingPeriod,
      }),
    );
  }

  return results;
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
      monthly_enabled:
        body.monthly_enabled !== undefined
          ? requireEnabled(body.monthly_enabled, locale)
          : true,
      yearly_enabled:
        body.yearly_enabled !== undefined
          ? requireEnabled(body.yearly_enabled, locale)
          : true,
    };

    const created = await createPlan(input);

    void logSystemEvent(
      "info",
      "admin_create_plan",
      "Admin created plan",
      {
        planId: created.id,
        key: created.key,
        enabled: created.enabled,
        monthly_enabled: created.monthly_enabled,
        yearly_enabled: created.yearly_enabled,
      },
      Number(req.user?.id),
    );

    res.status(201).json(created);
  }),

  update: asyncHandler(async (req: any, res) => {
    const locale = resolveRequestLocale(req);
    const id = parsePlanId(String(req.params.id), locale);
    const body = req.body || {};
    const previousPlan = await getPlanById(id);

    const input: UpdatePlanInput = {
      key: requireString(body.key, "key", locale),
      name: requireString(body.name, "name", locale),
      description: optionalString(body.description),
      currency: requireString(body.currency, "currency", locale),
      monthly_price: requireInt(body.monthly_price, "monthly_price", locale),
      yearly_price: requireInt(body.yearly_price, "yearly_price", locale),
      enabled: requireEnabled(body.enabled, locale),
      monthly_enabled: requireEnabled(body.monthly_enabled, locale),
      yearly_enabled: requireEnabled(body.yearly_enabled, locale),
    };

    const updated = await updatePlan(id, input);
    if (!updated)
      throw new AppError(404, tServer(locale, "admin.planNotFound"), undefined);

    const renewalResults = await enforcePlanAvailabilityTransitions({
      previousPlan,
      nextPlan: updated,
    });

    void logSystemEvent(
      "info",
      "admin_update_plan",
      "Admin updated plan",
      {
        planId: updated.id,
        key: updated.key,
        enabled: updated.enabled,
        monthly_enabled: updated.monthly_enabled,
        yearly_enabled: updated.yearly_enabled,
        renewalResults,
      },
      Number(req.user?.id),
    );

    res.json(updated);
  }),

  toggleEnabled: asyncHandler(async (req: any, res) => {
    const locale = resolveRequestLocale(req);
    const id = parsePlanId(String(req.params.id), locale);
    const body = req.body || {};
    const enabled = requireEnabled(body.enabled, locale);
    const previousPlan = await getPlanById(id);

    const updated = await setPlanEnabled(id, enabled);
    if (!updated)
      throw new AppError(404, tServer(locale, "admin.planNotFound"), undefined);

    const renewalResults = await enforcePlanAvailabilityTransitions({
      previousPlan,
      nextPlan: updated,
    });

    void logSystemEvent(
      "info",
      "admin_toggle_plan_enabled",
      "Admin toggled plan enabled",
      {
        planId: updated.id,
        key: updated.key,
        enabled: updated.enabled,
        monthly_enabled: updated.monthly_enabled,
        yearly_enabled: updated.yearly_enabled,
        renewalResults,
      },
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
