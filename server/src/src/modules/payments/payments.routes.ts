import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags";
import {
  createMockPayment,
  findPaymentById,
  markPaymentPaid,
} from "./payments.repository";
import { getPlanByKey } from "../plans/plans.repository";
import { activatePlanForUser } from "../../services/subscriptionService";
import { AppError } from "../../core/errors";
import { resolveRequestLocale, tServer } from "../../i18n/serverI18n";

const router = Router();

router.post(
  "/create",
  requireAuth,
  requireFeatureFlagEnabled("module.payments"),
  async (req, res, next) => {
    try {
      const locale = resolveRequestLocale(req);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
      }

      const { plan, billing_period, billingPeriod } = req.body || {};

      const resolvedPlan = String(plan ?? "pro").trim();
      if (!resolvedPlan) {
        throw new AppError(400, tServer(locale, "payments.planRequired"));
      }

      const resolvedBillingPeriod =
        billing_period || billingPeriod || "monthly";
      if (
        resolvedBillingPeriod !== "monthly" &&
        resolvedBillingPeriod !== "yearly"
      ) {
        throw new AppError(
          400,
          tServer(locale, "payments.invalidBillingPeriod"),
        );
      }

      const planRow = await getPlanByKey(resolvedPlan);
      if (!planRow) {
        throw new AppError(400, tServer(locale, "payments.invalidPlan"));
      }
      if (!planRow.enabled) {
        throw new AppError(400, tServer(locale, "payments.planUnavailable"));
      }

      const payment = await createMockPayment(
        Number(userId),
        resolvedPlan,
        resolvedBillingPeriod,
      );

      return res.status(201).json({
        paymentId: payment.id,
        id: payment.id,
        payment,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/mock-success",
  requireAuth,
  requireFeatureFlagEnabled("module.payments"),
  async (req, res, next) => {
    try {
      const locale = resolveRequestLocale(req);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
      }

      const { paymentId } = req.body || {};
      const idNum = Number(paymentId);

      if (!Number.isFinite(idNum) || idNum <= 0) {
        throw new AppError(400, tServer(locale, "payments.paymentIdRequired"));
      }

      const payment = await findPaymentById(idNum);
      if (!payment) {
        throw new AppError(404, tServer(locale, "payments.paymentNotFound"));
      }

      if (payment.user_id !== Number(userId)) {
        throw new AppError(403, tServer(locale, "payments.otherUserForbidden"));
      }

      if (payment.status === "paid") {
        return res.json({
          ok: true,
          paymentId: payment.id,
          status: payment.status,
        });
      }

      await markPaymentPaid(payment.id);
      await activatePlanForUser({
        userId: Number(userId),
        planKey: payment.plan,
        billingPeriod: payment.billing_period,
      });

      return res.json({
        ok: true,
        paymentId: payment.id,
        status: "paid",
      });
    } catch (err) {
      next(err);
    }
  },
);

export const paymentsRouter = router;
