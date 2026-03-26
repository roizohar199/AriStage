import fetch from "node-fetch";
import PayPalSdk from "@paypal/paypal-server-sdk";
import { env } from "../../config/env";
import { AppError } from "../../core/errors";
import { logger } from "../../core/logger";
import type { BillingPeriod } from "../../services/subscriptionService";
import {
  getPlanByKey,
  isPlanBillingPeriodEnabled,
  type Plan,
} from "../plans/plans.repository";
import {
  createProviderPlanRecord,
  findLatestProviderPlanForLocalPlan,
  findMatchingProviderPlan,
} from "./payments.repository";

const {
  ApplicationContextUserAction,
  Client,
  Environment,
  SubscriptionsController,
} = PayPalSdk as any;

type PayPalPlanMappings = Record<
  string,
  Partial<Record<BillingPeriod, string>>
>;

type PayPalPlanResponse = {
  id?: string;
  product_id?: string;
  status?: string;
  billing_cycles?: Array<{
    frequency?: {
      interval_unit?: string;
      interval_count?: number;
    };
    tenure_type?: string;
    pricing_scheme?: {
      fixed_price?: {
        value?: string;
        currency_code?: string;
      };
    };
  }>;
};

type PayPalProductResponse = {
  id?: string;
};

const runtimePayPalPlanCache = new Map<string, string>();

type PayPalSubscriptionResponse = {
  id?: string;
  status?: string;
  plan_id?: string;
  custom_id?: string;
  start_time?: string;
  create_time?: string;
  update_time?: string;
  billing_info?: {
    next_billing_time?: string;
    final_payment_time?: string;
    last_payment?: {
      time?: string;
      amount?: {
        currency_code?: string;
        value?: string;
      };
    };
    last_failed_payment?: {
      time?: string;
    };
  };
  subscriber?: {
    payer_id?: string;
    email_address?: string;
  };
  links?: Array<{
    href?: string;
    rel?: string;
  }>;
};

export type PayPalSubscriptionSnapshot = {
  id: string;
  status: string | null;
  planId: string | null;
  customId: string | null;
  startTime: string | null;
  createTime: string | null;
  updateTime: string | null;
  nextBillingTime: string | null;
  finalPaymentTime: string | null;
  lastPaymentTime: string | null;
  payerId: string | null;
  subscriberEmail: string | null;
  approvalUrl: string | null;
  raw: PayPalSubscriptionResponse;
};

export type ParsedPayPalCustomId = {
  paymentId: number | null;
  userId: number | null;
  planKey: string | null;
  billingPeriod: BillingPeriod | null;
};

function ensurePayPalConfigured() {
  if (!env.paypal.clientId || !env.paypal.clientSecret) {
    throw new AppError(500, "PayPal is not configured on the server");
  }
}

function getPayPalClient() {
  ensurePayPalConfigured();

  return new Client({
    environment:
      env.paypal.mode === "live" ? Environment.Production : Environment.Sandbox,
    clientCredentialsAuthCredentials: {
      oAuthClientId: env.paypal.clientId,
      oAuthClientSecret: env.paypal.clientSecret,
    },
  });
}

function getSubscriptionsController() {
  return new SubscriptionsController(getPayPalClient());
}

function getPayPalBaseUrl() {
  return env.paypal.mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function parseApiResponseBody<T>(response: {
  body?: string | null;
  result?: unknown;
}): T {
  if (typeof response.body === "string" && response.body.trim()) {
    return JSON.parse(response.body) as T;
  }

  return response.result as T;
}

function getPlanMappings(): PayPalPlanMappings {
  if (!env.paypal.planMappings.trim()) {
    throw new AppError(500, "Missing PAYPAL_PLAN_MAPPINGS configuration");
  }

  try {
    return JSON.parse(env.paypal.planMappings) as PayPalPlanMappings;
  } catch (error) {
    logger.error("Failed to parse PAYPAL_PLAN_MAPPINGS", { error });
    throw new AppError(500, "PAYPAL_PLAN_MAPPINGS is invalid JSON");
  }
}

function isPlaceholderPayPalPlanId(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return !normalized || /REPLACE/i.test(normalized);
}

function normalizePayPalApiError(error: any): AppError {
  const details = error?.result ?? error?.body ?? error?.response ?? error;
  const firstIssue = Array.isArray(details?.details)
    ? details.details[0]
    : null;
  const message =
    firstIssue?.description ||
    details?.message ||
    error?.message ||
    "PayPal request failed";

  return new AppError(502, String(message), details ?? undefined);
}

function sanitizeReturnTo(value: string | null | undefined): string {
  const fallback = "/settings";
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  return raw;
}

function buildCallbackUrl(
  baseUrl: string,
  outcome: "success" | "cancelled",
  returnTo?: string | null,
): string {
  if (!baseUrl) {
    throw new AppError(500, "PayPal callback URL is not configured");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("paypal_outcome", outcome);
  url.searchParams.set("redirect_to", sanitizeReturnTo(returnTo));
  return url.toString();
}

export function buildPayPalCustomId(params: {
  paymentId: number;
  userId: number;
  planKey: string;
  billingPeriod: BillingPeriod;
}) {
  return [
    `payment=${params.paymentId}`,
    `user=${params.userId}`,
    `plan=${encodeURIComponent(params.planKey)}`,
    `period=${params.billingPeriod}`,
  ].join("&");
}

export function parsePayPalCustomId(
  value: string | null | undefined,
): ParsedPayPalCustomId {
  if (!value) {
    return {
      paymentId: null,
      userId: null,
      planKey: null,
      billingPeriod: null,
    };
  }

  const params = new URLSearchParams(String(value));
  const period = params.get("period");
  return {
    paymentId: Number(params.get("payment")) || null,
    userId: Number(params.get("user")) || null,
    planKey: params.get("plan")
      ? decodeURIComponent(String(params.get("plan")))
      : null,
    billingPeriod: period === "monthly" || period === "yearly" ? period : null,
  };
}

function mapSubscriptionResponse(
  raw: PayPalSubscriptionResponse,
): PayPalSubscriptionSnapshot {
  const approvalUrl =
    raw.links?.find(
      (link) => String(link.rel ?? "").toLowerCase() === "approve",
    )?.href ?? null;

  return {
    id: String(raw.id ?? ""),
    status: raw.status ?? null,
    planId: raw.plan_id ?? null,
    customId: raw.custom_id ?? null,
    startTime: raw.start_time ?? null,
    createTime: raw.create_time ?? null,
    updateTime: raw.update_time ?? null,
    nextBillingTime: raw.billing_info?.next_billing_time ?? null,
    finalPaymentTime: raw.billing_info?.final_payment_time ?? null,
    lastPaymentTime: raw.billing_info?.last_payment?.time ?? null,
    payerId: raw.subscriber?.payer_id ?? null,
    subscriberEmail: raw.subscriber?.email_address ?? null,
    approvalUrl,
    raw,
  };
}

export function resolvePayPalPlanId(
  planKey: string,
  billingPeriod: BillingPeriod,
): string {
  const mappings = getPlanMappings();
  const plan = mappings[String(planKey).trim().toLowerCase()];
  const paypalPlanId = plan?.[billingPeriod] ?? null;
  if (!paypalPlanId) {
    throw new AppError(
      500,
      `Missing PayPal plan mapping for ${planKey}/${billingPeriod}`,
    );
  }

  if (isPlaceholderPayPalPlanId(paypalPlanId)) {
    throw new AppError(
      503,
      `PayPal plan mapping for ${planKey}/${billingPeriod} is still a placeholder. Update PAYPAL_PLAN_MAPPINGS with real PayPal plan IDs.`,
    );
  }

  return paypalPlanId;
}

function getPlanAmount(localPlan: Plan, billingPeriod: BillingPeriod) {
  return billingPeriod === "yearly"
    ? Number(localPlan.yearly_price)
    : Number(localPlan.monthly_price);
}

function buildRuntimePlanCacheKey(
  localPlan: Plan,
  billingPeriod: BillingPeriod,
) {
  return [
    localPlan.key,
    billingPeriod,
    getPlanAmount(localPlan, billingPeriod),
    String(localPlan.currency).toUpperCase(),
  ].join(":");
}

function getBootstrapPlanId(
  planKey: string,
  billingPeriod: BillingPeriod,
): string | null {
  try {
    return resolvePayPalPlanId(planKey, billingPeriod);
  } catch {
    return null;
  }
}

async function callPayPalJsonApi<T>(params: {
  method?: string;
  path: string;
  accessToken?: string;
  body?: unknown;
}): Promise<T> {
  const accessToken = params.accessToken || (await fetchPayPalAccessToken());
  const response = await fetch(`${getPayPalBaseUrl()}${params.path}`, {
    method: params.method || "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(params.body ? { "Content-Type": "application/json" } : {}),
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const rawText = await response.text();
  let payload: unknown = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = rawText;
  }

  if (!response.ok) {
    throw normalizePayPalApiError({
      message: response.statusText,
      result: payload,
      statusCode: response.status,
    });
  }

  return payload as T;
}

async function getPayPalPlanDetails(
  planId: string,
): Promise<PayPalPlanResponse> {
  return callPayPalJsonApi<PayPalPlanResponse>({
    path: `/v1/billing/plans/${encodeURIComponent(planId)}`,
  });
}

function doesPayPalPlanMatchLocalPricing(params: {
  localPlan: Plan;
  billingPeriod: BillingPeriod;
  paypalPlan: PayPalPlanResponse;
}) {
  const expectedAmount = getPlanAmount(params.localPlan, params.billingPeriod);
  const expectedCurrency = String(params.localPlan.currency).toUpperCase();
  const expectedIntervalUnit =
    params.billingPeriod === "yearly" ? "YEAR" : "MONTH";

  const regularCycle = Array.isArray(params.paypalPlan.billing_cycles)
    ? params.paypalPlan.billing_cycles.find(
        (cycle) => String(cycle?.tenure_type ?? "").toUpperCase() === "REGULAR",
      )
    : null;
  const fixedPrice = regularCycle?.pricing_scheme?.fixed_price;

  return (
    Number(fixedPrice?.value ?? NaN) === expectedAmount &&
    String(fixedPrice?.currency_code ?? "").toUpperCase() ===
      expectedCurrency &&
    String(regularCycle?.frequency?.interval_unit ?? "").toUpperCase() ===
      expectedIntervalUnit &&
    Number(regularCycle?.frequency?.interval_count ?? 0) === 1 &&
    (!params.paypalPlan.status ||
      String(params.paypalPlan.status).toUpperCase() === "ACTIVE")
  );
}

async function createPayPalProduct(localPlan: Plan): Promise<string> {
  const product = await callPayPalJsonApi<PayPalProductResponse>({
    method: "POST",
    path: "/v1/catalogs/products",
    body: {
      name: `AriStage ${localPlan.name}`,
      description:
        localPlan.description || `Recurring subscription for ${localPlan.name}`,
      type: "SERVICE",
      category: "SOFTWARE",
    },
  });

  if (!product.id) {
    throw new AppError(502, "PayPal did not return a product id");
  }

  return product.id;
}

async function createPayPalBillingPlan(params: {
  localPlan: Plan;
  billingPeriod: BillingPeriod;
  productId: string;
}): Promise<PayPalPlanResponse> {
  const amount = getPlanAmount(params.localPlan, params.billingPeriod);
  const intervalUnit = params.billingPeriod === "yearly" ? "YEAR" : "MONTH";

  return callPayPalJsonApi<PayPalPlanResponse>({
    method: "POST",
    path: "/v1/billing/plans",
    body: {
      product_id: params.productId,
      name: `AriStage ${params.localPlan.name} ${params.billingPeriod} ${amount} ${params.localPlan.currency}`,
      description:
        params.localPlan.description ||
        `${params.billingPeriod} recurring subscription for ${params.localPlan.name}`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: String(amount),
              currency_code: String(params.localPlan.currency).toUpperCase(),
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    },
  });
}

async function resolvePayPalProductIdForLocalPlan(
  localPlan: Plan,
): Promise<string> {
  const latestProviderPlan = await findLatestProviderPlanForLocalPlan({
    provider: "paypal",
    localPlanKey: localPlan.key,
  });

  if (latestProviderPlan?.provider_product_id) {
    return latestProviderPlan.provider_product_id;
  }

  const bootstrapPlanIds = [
    getBootstrapPlanId(localPlan.key, "monthly"),
    getBootstrapPlanId(localPlan.key, "yearly"),
  ].filter((value): value is string => Boolean(value));

  for (const planId of bootstrapPlanIds) {
    try {
      const paypalPlan = await getPayPalPlanDetails(planId);
      if (paypalPlan.product_id) {
        return paypalPlan.product_id;
      }
    } catch (error) {
      logger.warn("Failed to inspect bootstrap PayPal plan", {
        planId,
        error,
      });
    }
  }

  return createPayPalProduct(localPlan);
}

async function ensurePayPalPlanIdForLocalPricing(
  planKey: string,
  billingPeriod: BillingPeriod,
): Promise<string> {
  const localPlan = await getPlanByKey(planKey);
  if (!localPlan || !isPlanBillingPeriodEnabled(localPlan, billingPeriod)) {
    throw new AppError(400, `Plan ${planKey} is not available`);
  }

  const runtimeCacheKey = buildRuntimePlanCacheKey(localPlan, billingPeriod);
  const cachedPlanId = runtimePayPalPlanCache.get(runtimeCacheKey);
  if (cachedPlanId) {
    return cachedPlanId;
  }

  const amount = getPlanAmount(localPlan, billingPeriod);
  const currency = String(localPlan.currency).toUpperCase();
  const matchingProviderPlan = await findMatchingProviderPlan({
    provider: "paypal",
    localPlanKey: localPlan.key,
    billingPeriod,
    currency,
    amount,
  });

  if (matchingProviderPlan?.provider_plan_id) {
    runtimePayPalPlanCache.set(
      runtimeCacheKey,
      matchingProviderPlan.provider_plan_id,
    );
    return matchingProviderPlan.provider_plan_id;
  }

  const bootstrapPlanId = getBootstrapPlanId(localPlan.key, billingPeriod);
  if (bootstrapPlanId) {
    try {
      const paypalPlan = await getPayPalPlanDetails(bootstrapPlanId);
      if (
        doesPayPalPlanMatchLocalPricing({
          localPlan,
          billingPeriod,
          paypalPlan,
        })
      ) {
        await createProviderPlanRecord({
          provider: "paypal",
          localPlanKey: localPlan.key,
          billingPeriod,
          currency,
          amount,
          providerProductId: paypalPlan.product_id ?? null,
          providerPlanId: bootstrapPlanId,
        });
        runtimePayPalPlanCache.set(runtimeCacheKey, bootstrapPlanId);
        return bootstrapPlanId;
      }
    } catch (error) {
      logger.warn(
        "Failed to validate bootstrap PayPal plan against local pricing",
        {
          planKey: localPlan.key,
          billingPeriod,
          bootstrapPlanId,
          error,
        },
      );
    }
  }

  const productId = await resolvePayPalProductIdForLocalPlan(localPlan);
  const createdPlan = await createPayPalBillingPlan({
    localPlan,
    billingPeriod,
    productId,
  });

  if (!createdPlan.id) {
    throw new AppError(502, "PayPal did not return a plan id");
  }

  await createProviderPlanRecord({
    provider: "paypal",
    localPlanKey: localPlan.key,
    billingPeriod,
    currency,
    amount,
    providerProductId: productId,
    providerPlanId: createdPlan.id,
  });

  runtimePayPalPlanCache.set(runtimeCacheKey, createdPlan.id);
  return createdPlan.id;
}

export async function createPayPalSubscription(params: {
  paymentId: number;
  userId: number;
  planKey: string;
  billingPeriod: BillingPeriod;
  email?: string | null;
  locale?: string | null;
  returnTo?: string | null;
}) {
  const controller = getSubscriptionsController();
  let response;

  try {
    response = await controller.createSubscription({
      prefer: "return=representation",
      paypalRequestId: `ari-stage-subscription-${params.paymentId}`,
      body: {
        planId: await ensurePayPalPlanIdForLocalPricing(
          params.planKey,
          params.billingPeriod,
        ),
        customId: buildPayPalCustomId({
          paymentId: params.paymentId,
          userId: params.userId,
          planKey: params.planKey,
          billingPeriod: params.billingPeriod,
        }),
        subscriber: params.email
          ? {
              emailAddress: params.email,
            }
          : undefined,
        applicationContext: {
          brandName: "AriStage",
          locale: params.locale || undefined,
          userAction: ApplicationContextUserAction.SubscribeNow,
          returnUrl: buildCallbackUrl(
            env.paypal.returnUrl,
            "success",
            params.returnTo,
          ),
          cancelUrl: buildCallbackUrl(
            env.paypal.cancelUrl,
            "cancelled",
            params.returnTo,
          ),
        },
      },
    });
  } catch (error: any) {
    throw error instanceof AppError ? error : normalizePayPalApiError(error);
  }

  const raw = parseApiResponseBody<PayPalSubscriptionResponse>(response);
  const snapshot = mapSubscriptionResponse(raw);

  if (!snapshot.id || !snapshot.approvalUrl) {
    logger.error(
      "PayPal create subscription response missing required fields",
      {
        raw,
      },
    );
    throw new AppError(502, "PayPal did not return an approval link");
  }

  return snapshot;
}

export async function getPayPalSubscription(
  subscriptionId: string,
): Promise<PayPalSubscriptionSnapshot> {
  const controller = getSubscriptionsController();
  const response = await controller.getSubscription({
    id: subscriptionId,
    fields: "last_failed_payment,plan",
  });

  const raw = parseApiResponseBody<PayPalSubscriptionResponse>(response);
  return mapSubscriptionResponse(raw);
}

export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason: string,
): Promise<void> {
  const controller = getSubscriptionsController();
  await controller.cancelSubscription({
    id: subscriptionId,
    body: {
      reason,
    },
  });
}

async function fetchPayPalAccessToken(): Promise<string> {
  ensurePayPalConfigured();
  const baseUrl =
    env.paypal.mode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${env.paypal.clientId}:${env.paypal.clientSecret}`,
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error("Failed to obtain PayPal access token", {
      status: response.status,
      body: text,
    });
    throw new AppError(502, "Failed to authenticate with PayPal");
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new AppError(502, "PayPal access token response was invalid");
  }

  return payload.access_token;
}

export async function verifyPayPalWebhookSignature(params: {
  headers: Record<string, string | undefined>;
  eventBody: Record<string, unknown>;
}): Promise<boolean> {
  if (!env.paypal.webhookId) {
    throw new AppError(500, "PAYPAL_WEBHOOK_ID is not configured");
  }

  const accessToken = await fetchPayPalAccessToken();
  const baseUrl =
    env.paypal.mode === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  const response = await fetch(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: params.headers["paypal-auth-algo"],
        cert_url: params.headers["paypal-cert-url"],
        transmission_id: params.headers["paypal-transmission-id"],
        transmission_sig: params.headers["paypal-transmission-sig"],
        transmission_time: params.headers["paypal-transmission-time"],
        webhook_id: env.paypal.webhookId,
        webhook_event: params.eventBody,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    logger.warn("PayPal webhook verification failed", {
      status: response.status,
      body: text,
    });
    return false;
  }

  const payload = (await response.json()) as { verification_status?: string };
  return String(payload.verification_status ?? "").toUpperCase() === "SUCCESS";
}
