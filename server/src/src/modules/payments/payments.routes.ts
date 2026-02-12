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

const router = Router();

router.post(
  "/create",
  requireAuth,
  requireFeatureFlagEnabled("module.payments"),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const { plan, billing_period, billingPeriod } = req.body || {};

      const resolvedPlan = String(plan ?? "pro").trim();
      if (!resolvedPlan) {
        throw new AppError(400, "plan is required");
      }

      const resolvedBillingPeriod =
        billing_period || billingPeriod || "monthly";
      if (
        resolvedBillingPeriod !== "monthly" &&
        resolvedBillingPeriod !== "yearly"
      ) {
        throw new AppError(400, "Invalid billing period");
      }

      const planRow = await getPlanByKey(resolvedPlan);
      if (!planRow) {
        throw new AppError(400, "Invalid plan");
      }
      if (!planRow.enabled) {
        throw new AppError(400, "Plan is not available");
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
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const { paymentId } = req.body || {};
      const idNum = Number(paymentId);

      if (!Number.isFinite(idNum) || idNum <= 0) {
        throw new AppError(400, "paymentId is required");
      }

      const payment = await findPaymentById(idNum);
      if (!payment) {
        throw new AppError(404, "Payment not found");
      }

      if (payment.user_id !== Number(userId)) {
        throw new AppError(403, "Cannot confirm payment for another user");
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
