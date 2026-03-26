import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireFeatureFlagEnabled } from "../../middleware/featureFlags";
import { validateBody } from "../../middleware/validate";
import { AppError } from "../../core/errors";
import { logger } from "../../core/logger";
import { resolveRequestLocale, tServer } from "../../i18n/serverI18n";
import {
  getPlanByKey,
  isPlanBillingPeriodEnabled,
} from "../plans/plans.repository";
import {
  activatePlanForUser,
  findUserIdByProviderSubscriptionId,
  markSubscriptionCancelledAtPeriodEnd,
} from "../../services/subscriptionService";
import {
  createPaymentRecord,
  createMockPayment,
  findLatestPendingPaymentForSubscription,
  findPaymentById,
  findPaymentByProviderCaptureId,
  findPaymentByProviderSubscriptionId,
  markPaymentFailed,
  markPaymentPaid,
  registerWebhookEvent,
  updatePaymentProviderReferences,
  updateWebhookEventStatus,
} from "./payments.repository";
import {
  cancelPayPalSubscription,
  createPayPalSubscription,
  getPayPalSubscription,
  parsePayPalCustomId,
  verifyPayPalWebhookSignature,
  type PayPalSubscriptionSnapshot,
} from "./paypal.service";
import {
  createPaymentSchema,
  mockSuccessSchema,
  paypalActivateSchema,
  paypalCancelSchema,
} from "./payments.schemas";
import {
  getUserSubscriptionState,
  updateUserSubscriptionFields,
} from "../subscriptions/subscriptions.repository";

const router = Router();

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  create_time?: string;
  summary?: string;
  resource?: {
    id?: string;
    billing_agreement_id?: string;
    status?: string;
  };
};

function normalizeBillingPeriod(value: unknown) {
  return value === "yearly" ? "yearly" : "monthly";
}

function normalizeReturnTo(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/settings";
  }

  return raw;
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return JSON.stringify({ fallback: true });
  }
}

async function resolvePayPalContext(
  snapshot: PayPalSubscriptionSnapshot,
  explicitPaymentId?: number | null,
) {
  const parsedCustomId = parsePayPalCustomId(snapshot.customId);
  const payment = explicitPaymentId
    ? await findPaymentById(explicitPaymentId)
    : parsedCustomId.paymentId
      ? await findPaymentById(parsedCustomId.paymentId)
      : (await findLatestPendingPaymentForSubscription(snapshot.id)) ||
        (await findPaymentByProviderSubscriptionId(snapshot.id));

  const userId =
    payment?.user_id ??
    parsedCustomId.userId ??
    (await findUserIdByProviderSubscriptionId(snapshot.id));
  const planKey = payment?.plan ?? parsedCustomId.planKey;
  const billingPeriod = payment?.billing_period ?? parsedCustomId.billingPeriod;

  if (!userId || !planKey || !billingPeriod) {
    throw new AppError(
      400,
      "Unable to match PayPal subscription to local plan",
    );
  }

  return {
    payment,
    userId,
    planKey,
    billingPeriod,
  };
}

async function ensureLocalPaymentForPayPal(params: {
  snapshot: PayPalSubscriptionSnapshot;
  paymentId?: number | null;
  captureId?: string | null;
  eventId?: string | null;
  payloadJson: string;
}) {
  const context = await resolvePayPalContext(params.snapshot, params.paymentId);

  if (params.captureId) {
    const existingCapture = await findPaymentByProviderCaptureId(
      params.captureId,
    );
    if (existingCapture) {
      return { context, payment: existingCapture };
    }
  }

  let payment = context.payment;

  if (
    payment &&
    payment.status === "paid" &&
    payment.provider_capture_id &&
    params.captureId &&
    payment.provider_capture_id !== params.captureId
  ) {
    payment = null;
  }

  if (!payment) {
    payment = await createPaymentRecord({
      userId: context.userId,
      provider: "paypal",
      planKey: context.planKey,
      billingPeriod: context.billingPeriod,
      transactionId: params.snapshot.id,
      providerSubscriptionId: params.snapshot.id,
      providerEventId: params.eventId ?? null,
      providerPayloadJson: params.payloadJson,
    });
  }

  return { context, payment };
}

async function syncPayPalSubscriptionToLocalState(params: {
  snapshot: PayPalSubscriptionSnapshot;
  paymentId?: number | null;
  captureId?: string | null;
  eventId?: string | null;
  payload: unknown;
}) {
  const payloadJson = safeStringify(params.payload);
  const { context, payment } = await ensureLocalPaymentForPayPal({
    snapshot: params.snapshot,
    paymentId: params.paymentId,
    captureId: params.captureId,
    eventId: params.eventId,
    payloadJson,
  });

  const status = String(params.snapshot.status ?? "").toUpperCase();

  await updatePaymentProviderReferences(payment.id, {
    transactionId: params.captureId ?? params.snapshot.id,
    providerSubscriptionId: params.snapshot.id,
    providerCaptureId: params.captureId ?? payment.provider_capture_id,
    providerEventId: params.eventId ?? payment.provider_event_id,
    providerPayloadJson: payloadJson,
  });

  const currentPlan = await getPlanByKey(context.planKey);
  if (
    !currentPlan ||
    !isPlanBillingPeriodEnabled(currentPlan, context.billingPeriod)
  ) {
    const unavailableReason = `Plan ${context.planKey}/${context.billingPeriod} is no longer available`;

    logger.warn("PayPal subscription matched a disabled plan period", {
      userId: context.userId,
      planKey: context.planKey,
      billingPeriod: context.billingPeriod,
      providerSubscriptionId: params.snapshot.id,
      captureId: params.captureId ?? null,
      eventId: params.eventId ?? null,
    });

    if (
      params.captureId &&
      (payment.status !== "paid" ||
        payment.provider_capture_id !== params.captureId)
    ) {
      await markPaymentPaid(payment.id, {
        transactionId: params.captureId,
        providerSubscriptionId: params.snapshot.id,
        providerCaptureId: params.captureId,
        providerEventId: params.eventId ?? payment.provider_event_id,
        providerPayloadJson: payloadJson,
      });

      await activatePlanForUser({
        userId: context.userId,
        planKey: context.planKey,
        billingPeriod: context.billingPeriod,
        provider: "paypal",
        providerCustomerId: params.snapshot.payerId,
        providerSubscriptionId: params.snapshot.id,
        startedAt:
          params.snapshot.startTime ?? params.snapshot.createTime ?? new Date(),
        renewsAt: params.snapshot.nextBillingTime ?? undefined,
      });
    } else if (payment.status === "pending") {
      await markPaymentFailed(payment.id, {
        providerEventId: params.eventId ?? payment.provider_event_id,
        providerPayloadJson: payloadJson,
        failureReason: unavailableReason,
      });
    }

    try {
      await cancelPayPalSubscription(params.snapshot.id, unavailableReason);
    } catch (error) {
      logger.warn("Failed to cancel disabled PayPal subscription immediately", {
        userId: context.userId,
        planKey: context.planKey,
        billingPeriod: context.billingPeriod,
        providerSubscriptionId: params.snapshot.id,
        error,
      });
    }

    await markSubscriptionCancelledAtPeriodEnd({
      userId: context.userId,
      cancelledAt: params.snapshot.updateTime ?? new Date(),
      renewsAt:
        params.snapshot.nextBillingTime ??
        params.snapshot.finalPaymentTime ??
        (await getUserSubscriptionState(context.userId))
          .subscription_expires_at,
      provider: "paypal",
      providerSubscriptionId: params.snapshot.id,
    });

    return {
      userId: context.userId,
      paymentId: payment.id,
      activated: Boolean(params.captureId),
      status,
    };
  }

  if (status === "ACTIVE" || status === "APPROVED") {
    if (
      payment.status !== "paid" ||
      (params.captureId && payment.provider_capture_id !== params.captureId)
    ) {
      await markPaymentPaid(payment.id, {
        transactionId: params.captureId ?? params.snapshot.id,
        providerSubscriptionId: params.snapshot.id,
        providerCaptureId: params.captureId ?? payment.provider_capture_id,
        providerEventId: params.eventId ?? payment.provider_event_id,
        providerPayloadJson: payloadJson,
      });
    }

    await activatePlanForUser({
      userId: context.userId,
      planKey: context.planKey,
      billingPeriod: context.billingPeriod,
      provider: "paypal",
      providerCustomerId: params.snapshot.payerId,
      providerSubscriptionId: params.snapshot.id,
      startedAt:
        params.snapshot.startTime ?? params.snapshot.createTime ?? new Date(),
      renewsAt: params.snapshot.nextBillingTime ?? undefined,
    });

    return {
      userId: context.userId,
      paymentId: payment.id,
      activated: true,
      status,
    };
  }

  if (status === "CANCELLED") {
    await markSubscriptionCancelledAtPeriodEnd({
      userId: context.userId,
      cancelledAt: params.snapshot.updateTime ?? new Date(),
      renewsAt:
        params.snapshot.nextBillingTime ??
        params.snapshot.finalPaymentTime ??
        (await getUserSubscriptionState(context.userId))
          .subscription_expires_at,
      provider: "paypal",
      providerSubscriptionId: params.snapshot.id,
    });

    return {
      userId: context.userId,
      paymentId: payment.id,
      activated: false,
      status,
    };
  }

  if (status === "SUSPENDED" || status === "EXPIRED") {
    const currentState = await getUserSubscriptionState(context.userId);
    const expiresAtMs = currentState.subscription_expires_at
      ? new Date(currentState.subscription_expires_at).getTime()
      : NaN;
    const hasFutureAccess =
      !Number.isNaN(expiresAtMs) && expiresAtMs > Date.now();

    if (hasFutureAccess) {
      await updateUserSubscriptionFields(context.userId, {
        subscription_provider: "paypal",
        provider_customer_id: params.snapshot.payerId,
        provider_subscription_id: params.snapshot.id,
        subscription_renews_at: params.snapshot.nextBillingTime ?? null,
        subscription_cancelled_at: params.snapshot.updateTime ?? null,
      });
    } else {
      await updateUserSubscriptionFields(context.userId, {
        subscription_provider: "paypal",
        provider_customer_id: params.snapshot.payerId,
        provider_subscription_id: params.snapshot.id,
        subscription_status: "expired",
        subscription_renews_at: params.snapshot.nextBillingTime ?? null,
        subscription_cancelled_at: params.snapshot.updateTime ?? new Date(),
      });
    }

    return {
      userId: context.userId,
      paymentId: payment.id,
      activated: false,
      status,
    };
  }

  await updateUserSubscriptionFields(context.userId, {
    subscription_provider: "paypal",
    provider_customer_id: params.snapshot.payerId,
    provider_subscription_id: params.snapshot.id,
    subscription_renews_at: params.snapshot.nextBillingTime ?? null,
  });

  return {
    userId: context.userId,
    paymentId: payment.id,
    activated: false,
    status,
  };
}

async function markDeniedPayPalPayment(event: PayPalWebhookEvent) {
  const subscriptionId = String(
    event.resource?.billing_agreement_id ?? "",
  ).trim();
  if (!subscriptionId) {
    return;
  }

  const snapshot = await getPayPalSubscription(subscriptionId);
  const payloadJson = safeStringify(event);
  const { context, payment } = await ensureLocalPaymentForPayPal({
    snapshot,
    captureId: null,
    eventId: event.id ?? null,
    payloadJson,
  });

  await markPaymentFailed(payment.id, {
    providerEventId: event.id ?? null,
    providerPayloadJson: payloadJson,
    failureReason: event.summary ?? "PayPal payment denied",
  });

  const currentState = await getUserSubscriptionState(context.userId);
  const expiresAtMs = currentState.subscription_expires_at
    ? new Date(currentState.subscription_expires_at).getTime()
    : NaN;
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    await updateUserSubscriptionFields(context.userId, {
      subscription_status: "expired",
      subscription_cancelled_at: new Date(),
    });
  }
}

router.post(
  "/create",
  requireAuth,
  requireFeatureFlagEnabled("module.payments"),
  validateBody(createPaymentSchema),
  async (req, res, next) => {
    try {
      const locale = resolveRequestLocale(req);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
      }

      const {
        plan,
        billing_period,
        billingPeriod,
        provider,
        return_to,
        returnTo,
      } = req.body || {};

      const resolvedPlan = String(plan ?? "pro")
        .trim()
        .toLowerCase();
      if (!resolvedPlan) {
        throw new AppError(400, tServer(locale, "payments.planRequired"));
      }

      const resolvedBillingPeriod = normalizeBillingPeriod(
        billing_period || billingPeriod,
      );

      const planRow = await getPlanByKey(resolvedPlan);
      if (!planRow) {
        throw new AppError(400, tServer(locale, "payments.invalidPlan"));
      }
      if (!isPlanBillingPeriodEnabled(planRow, resolvedBillingPeriod)) {
        throw new AppError(400, tServer(locale, "payments.planUnavailable"));
      }

      const resolvedProvider = provider === "mock" ? "mock" : "paypal";

      if (resolvedProvider === "mock") {
        const payment = await createMockPayment(
          Number(userId),
          resolvedPlan,
          resolvedBillingPeriod,
        );

        return res.status(201).json({
          provider: resolvedProvider,
          paymentId: payment.id,
          id: payment.id,
          payment,
        });
      }

      const payment = await createPaymentRecord({
        userId: Number(userId),
        provider: "paypal",
        planKey: resolvedPlan,
        billingPeriod: resolvedBillingPeriod,
      });

      try {
        const snapshot = await createPayPalSubscription({
          paymentId: payment.id,
          userId: Number(userId),
          planKey: resolvedPlan,
          billingPeriod: resolvedBillingPeriod,
          email: req.user?.email ?? null,
          locale: req.user?.preferred_locale ?? locale,
          returnTo: normalizeReturnTo(return_to || returnTo),
        });

        await updatePaymentProviderReferences(payment.id, {
          transactionId: snapshot.id,
          providerSubscriptionId: snapshot.id,
          providerPayloadJson: safeStringify(snapshot.raw),
        });

        return res.status(201).json({
          provider: "paypal",
          paymentId: payment.id,
          id: payment.id,
          approvalUrl: snapshot.approvalUrl,
          providerSubscriptionId: snapshot.id,
          status: snapshot.status,
          payment: await findPaymentById(payment.id),
        });
      } catch (error: any) {
        await markPaymentFailed(payment.id, {
          failureReason: error?.message ?? "PayPal create subscription failed",
        });
        throw error;
      }
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/mock-success",
  requireAuth,
  requireFeatureFlagEnabled("module.payments"),
  validateBody(mockSuccessSchema),
  async (req, res, next) => {
    try {
      const locale = resolveRequestLocale(req);
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
      }

      const idNum = Number(req.body?.paymentId);
      const payment = await findPaymentById(idNum);
      if (!payment) {
        throw new AppError(404, tServer(locale, "payments.paymentNotFound"));
      }

      if (payment.user_id !== Number(userId)) {
        throw new AppError(403, tServer(locale, "payments.otherUserForbidden"));
      }

      if (payment.status !== "paid") {
        await markPaymentPaid(payment.id);
        await activatePlanForUser({
          userId: Number(userId),
          planKey: payment.plan,
          billingPeriod: payment.billing_period,
          provider: "mock",
        });
      }

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

router.post(
  "/paypal/activate",
  requireAuth,
  requireFeatureFlagEnabled("module.payments"),
  validateBody(paypalActivateSchema),
  async (req, res, next) => {
    try {
      const locale = resolveRequestLocale(req);
      const userId = Number(req.user?.id);
      if (!userId) {
        throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
      }

      const subscriptionId = String(
        req.body?.subscriptionId ??
          req.body?.subscription_id ??
          req.body?.ba_token ??
          req.body?.token ??
          "",
      ).trim();

      if (!subscriptionId) {
        throw new AppError(400, "PayPal subscription id is required");
      }

      const snapshot = await getPayPalSubscription(subscriptionId);
      const parsed = parsePayPalCustomId(snapshot.customId);
      if (parsed.userId && parsed.userId !== userId) {
        throw new AppError(403, tServer(locale, "payments.otherUserForbidden"));
      }

      const syncResult = await syncPayPalSubscriptionToLocalState({
        snapshot,
        paymentId: parsed.paymentId,
        payload: snapshot.raw,
      });

      if (syncResult.userId !== userId) {
        throw new AppError(403, tServer(locale, "payments.otherUserForbidden"));
      }

      return res.json({
        ok: true,
        activated: syncResult.activated,
        paymentId: syncResult.paymentId,
        providerSubscriptionId: snapshot.id,
        status: snapshot.status,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/paypal/cancel",
  requireAuth,
  requireFeatureFlagEnabled("module.payments"),
  validateBody(paypalCancelSchema),
  async (req, res, next) => {
    try {
      const locale = resolveRequestLocale(req);
      const userId = Number(req.user?.id);
      if (!userId) {
        throw new AppError(401, tServer(locale, "auth.notAuthenticated"));
      }

      const currentState = await getUserSubscriptionState(userId);
      const subscriptionId = String(
        req.body?.subscriptionId ?? currentState.provider_subscription_id ?? "",
      ).trim();

      if (!subscriptionId) {
        throw new AppError(400, "No PayPal subscription found to cancel");
      }

      await cancelPayPalSubscription(
        subscriptionId,
        String(req.body?.reason ?? "Cancelled by customer").trim(),
      );

      await markSubscriptionCancelledAtPeriodEnd({
        userId,
        cancelledAt: new Date(),
        renewsAt:
          currentState.subscription_renews_at ??
          currentState.subscription_expires_at,
        provider: "paypal",
        providerSubscriptionId: subscriptionId,
      });

      return res.json({
        ok: true,
        providerSubscriptionId: subscriptionId,
        cancelAtPeriodEnd: true,
        renewsAt:
          currentState.subscription_renews_at ??
          currentState.subscription_expires_at,
      });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/webhooks/paypal",
  requireFeatureFlagEnabled("module.payments"),
  async (req, res, next) => {
    const event = (req.body || {}) as PayPalWebhookEvent;
    const eventId = String(event.id ?? "").trim();
    const eventType = String(event.event_type ?? "").trim();
    const resourceId = String(
      event.resource?.id ?? event.resource?.billing_agreement_id ?? "",
    ).trim();

    if (!eventId || !eventType) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid PayPal webhook payload" });
    }

    try {
      const verified = await verifyPayPalWebhookSignature({
        headers: req.headers as Record<string, string | undefined>,
        eventBody: event as unknown as Record<string, unknown>,
      });

      if (!verified) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid PayPal signature" });
      }

      const webhookEvent = await registerWebhookEvent({
        provider: "paypal",
        eventId,
        eventType,
        resourceId: resourceId || null,
        payloadJson: safeStringify(event),
      });

      if (
        webhookEvent.isDuplicate &&
        webhookEvent.processing_status === "processed"
      ) {
        return res.json({ ok: true, duplicate: true });
      }

      switch (eventType) {
        case "BILLING.SUBSCRIPTION.CREATED":
        case "BILLING.SUBSCRIPTION.ACTIVATED":
        case "BILLING.SUBSCRIPTION.UPDATED":
        case "BILLING.SUBSCRIPTION.CANCELLED":
        case "BILLING.SUBSCRIPTION.SUSPENDED":
        case "BILLING.SUBSCRIPTION.EXPIRED": {
          if (resourceId) {
            const snapshot = await getPayPalSubscription(resourceId);
            await syncPayPalSubscriptionToLocalState({
              snapshot,
              eventId,
              payload: event,
            });
          }
          break;
        }
        case "PAYMENT.SALE.COMPLETED": {
          const subscriptionId = String(
            event.resource?.billing_agreement_id ?? "",
          ).trim();
          const captureId = String(event.resource?.id ?? "").trim();
          if (subscriptionId) {
            const snapshot = await getPayPalSubscription(subscriptionId);
            await syncPayPalSubscriptionToLocalState({
              snapshot,
              captureId: captureId || null,
              eventId,
              payload: event,
            });
          }
          break;
        }
        case "PAYMENT.SALE.DENIED": {
          await markDeniedPayPalPayment(event);
          break;
        }
        default:
          logger.info("Ignoring unsupported PayPal webhook event", {
            eventId,
            eventType,
          });
      }

      await updateWebhookEventStatus(webhookEvent.id, "processed");
      return res.json({ ok: true });
    } catch (err) {
      try {
        const webhookEvent = await registerWebhookEvent({
          provider: "paypal",
          eventId,
          eventType,
          resourceId: resourceId || null,
          payloadJson: safeStringify(event),
        });
        await updateWebhookEventStatus(webhookEvent.id, "failed");
      } catch (updateErr) {
        logger.error("Failed to mark webhook as failed", { updateErr });
      }

      next(err);
    }
  },
);

export const paymentsRouter = router;
