import { pool } from "../../database/pool";
import {
  getPlanByKey,
  isPlanBillingPeriodEnabled,
} from "../plans/plans.repository";

import type { BillingPeriod } from "../../services/subscriptionService";

export type PaymentProvider = "mock" | "paypal";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentRecord = {
  id: number;
  user_id: number;
  provider: PaymentProvider;
  transaction_id: string | null;
  provider_subscription_id: string | null;
  provider_order_id: string | null;
  provider_capture_id: string | null;
  provider_event_id: string | null;
  provider_payload_json: string | null;
  failure_reason: string | null;
  plan: string;
  billing_period: BillingPeriod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: Date;
  paid_at: Date | null;
};

export type ProviderPlanRecord = {
  id: number;
  provider: PaymentProvider;
  local_plan_key: string;
  billing_period: BillingPeriod;
  currency: string;
  amount: number;
  provider_product_id: string | null;
  provider_plan_id: string;
  created_at: Date;
};

export type CreatePaymentRecordParams = {
  userId: number;
  provider: PaymentProvider;
  planKey: string;
  billingPeriod: BillingPeriod;
  status?: PaymentStatus;
  transactionId?: string | null;
  providerSubscriptionId?: string | null;
  providerOrderId?: string | null;
  providerCaptureId?: string | null;
  providerEventId?: string | null;
  providerPayloadJson?: string | null;
  failureReason?: string | null;
};

type PaymentRow = PaymentRecord;
type ProviderPlanRow = ProviderPlanRecord;

function mapPaymentRow(row: any): PaymentRecord {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    provider: String(row.provider) as PaymentProvider,
    transaction_id: row.transaction_id ?? null,
    provider_subscription_id: row.provider_subscription_id ?? null,
    provider_order_id: row.provider_order_id ?? null,
    provider_capture_id: row.provider_capture_id ?? null,
    provider_event_id: row.provider_event_id ?? null,
    provider_payload_json: row.provider_payload_json ?? null,
    failure_reason: row.failure_reason ?? null,
    plan: String(row.plan),
    billing_period: String(row.billing_period) as BillingPeriod,
    amount: Number(row.amount),
    currency: String(row.currency),
    status: String(row.status) as PaymentStatus,
    created_at: row.created_at,
    paid_at: row.paid_at ?? null,
  };
}

function mapProviderPlanRow(row: any): ProviderPlanRecord {
  return {
    id: Number(row.id),
    provider: String(row.provider) as PaymentProvider,
    local_plan_key: String(row.local_plan_key),
    billing_period: String(row.billing_period) as BillingPeriod,
    currency: String(row.currency),
    amount: Number(row.amount),
    provider_product_id: row.provider_product_id ?? null,
    provider_plan_id: String(row.provider_plan_id),
    created_at: row.created_at,
  };
}

function requireValidPaymentIdentity(params: {
  userId: number;
  planKey: string;
  billingPeriod: BillingPeriod;
}) {
  if (!Number.isFinite(params.userId) || params.userId <= 0) {
    throw new Error("Invalid userId for createPaymentRecord");
  }

  const normalizedPlanKey = String(params.planKey ?? "").trim();
  if (!normalizedPlanKey) {
    throw new Error("Invalid planKey for createPaymentRecord");
  }

  if (params.billingPeriod !== "monthly" && params.billingPeriod !== "yearly") {
    throw new Error("Invalid billingPeriod for createPaymentRecord");
  }

  return normalizedPlanKey;
}

export async function createPaymentRecord(
  params: CreatePaymentRecordParams,
): Promise<PaymentRecord> {
  const normalizedPlanKey = requireValidPaymentIdentity({
    userId: params.userId,
    planKey: params.planKey,
    billingPeriod: params.billingPeriod,
  });

  const plan = await getPlanByKey(normalizedPlanKey);
  if (!plan) {
    throw new Error(
      `Unknown plan for createPaymentRecord: ${normalizedPlanKey}`,
    );
  }

  if (!plan.enabled) {
    throw new Error(
      `Plan is disabled for createPaymentRecord: ${normalizedPlanKey}`,
    );
  }

  if (!isPlanBillingPeriodEnabled(plan, params.billingPeriod)) {
    throw new Error(
      `Plan billing period is disabled for createPaymentRecord: ${normalizedPlanKey}/${params.billingPeriod}`,
    );
  }

  const amount =
    params.billingPeriod === "yearly"
      ? Number(plan.yearly_price)
      : Number(plan.monthly_price);

  const [result] = await pool.query(
    "INSERT INTO payments (user_id, provider, transaction_id, provider_subscription_id, provider_order_id, provider_capture_id, provider_event_id, provider_payload_json, failure_reason, plan, billing_period, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      params.userId,
      params.provider,
      params.transactionId ?? null,
      params.providerSubscriptionId ?? null,
      params.providerOrderId ?? null,
      params.providerCaptureId ?? null,
      params.providerEventId ?? null,
      params.providerPayloadJson ?? null,
      params.failureReason ?? null,
      normalizedPlanKey,
      params.billingPeriod,
      amount,
      String(plan.currency),
      params.status ?? "pending",
    ],
  );

  const insertId = Number((result as any).insertId);
  const payment = await findPaymentById(insertId);
  if (!payment) {
    throw new Error("Failed to fetch created payment record");
  }

  return payment;
}

export async function createMockPayment(
  userId: number,
  planKey: string,
  billingPeriod: BillingPeriod,
): Promise<PaymentRecord> {
  const transactionId = `mock_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  return createPaymentRecord({
    userId,
    provider: "mock",
    planKey,
    billingPeriod,
    transactionId,
  });
}

export async function findPaymentById(
  id: number,
): Promise<PaymentRecord | null> {
  const [rows] = await pool.query("SELECT * FROM payments WHERE id = ?", [id]);
  const payment = (rows as PaymentRow[])[0];
  return payment ? mapPaymentRow(payment) : null;
}

export async function findPaymentByProviderSubscriptionId(
  providerSubscriptionId: string,
): Promise<PaymentRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM payments WHERE provider_subscription_id = ? ORDER BY id DESC LIMIT 1",
    [providerSubscriptionId],
  );

  const payment = (rows as PaymentRow[])[0];
  return payment ? mapPaymentRow(payment) : null;
}

export async function findPaymentByProviderCaptureId(
  providerCaptureId: string,
): Promise<PaymentRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM payments WHERE provider_capture_id = ? LIMIT 1",
    [providerCaptureId],
  );

  const payment = (rows as PaymentRow[])[0];
  return payment ? mapPaymentRow(payment) : null;
}

export async function findLatestPendingPaymentForSubscription(
  providerSubscriptionId: string,
): Promise<PaymentRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM payments WHERE provider_subscription_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1",
    [providerSubscriptionId],
  );

  const payment = (rows as PaymentRow[])[0];
  return payment ? mapPaymentRow(payment) : null;
}

export async function updatePaymentProviderReferences(
  id: number,
  details: {
    transactionId?: string | null;
    providerSubscriptionId?: string | null;
    providerOrderId?: string | null;
    providerCaptureId?: string | null;
    providerEventId?: string | null;
    providerPayloadJson?: string | null;
    failureReason?: string | null;
  },
  dbOverride?: any,
): Promise<void> {
  const db = dbOverride || pool;
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (details.transactionId !== undefined) {
    clauses.push("transaction_id = ?");
    values.push(details.transactionId);
  }
  if (details.providerSubscriptionId !== undefined) {
    clauses.push("provider_subscription_id = ?");
    values.push(details.providerSubscriptionId);
  }
  if (details.providerOrderId !== undefined) {
    clauses.push("provider_order_id = ?");
    values.push(details.providerOrderId);
  }
  if (details.providerCaptureId !== undefined) {
    clauses.push("provider_capture_id = ?");
    values.push(details.providerCaptureId);
  }
  if (details.providerEventId !== undefined) {
    clauses.push("provider_event_id = ?");
    values.push(details.providerEventId);
  }
  if (details.providerPayloadJson !== undefined) {
    clauses.push("provider_payload_json = ?");
    values.push(details.providerPayloadJson);
  }
  if (details.failureReason !== undefined) {
    clauses.push("failure_reason = ?");
    values.push(details.failureReason);
  }

  if (!clauses.length) {
    return;
  }

  const [result] = await db.query(
    `UPDATE payments SET ${clauses.join(", ")} WHERE id = ?`,
    [...values, id],
  );

  if (!result || !(result as any).affectedRows) {
    throw new Error("Failed to update payment provider references");
  }
}

export async function markPaymentPaid(
  id: number,
  details?: {
    transactionId?: string | null;
    providerSubscriptionId?: string | null;
    providerOrderId?: string | null;
    providerCaptureId?: string | null;
    providerEventId?: string | null;
    providerPayloadJson?: string | null;
  },
  dbOverride?: any,
): Promise<void> {
  const db = dbOverride || pool;

  const clauses = ["status = 'paid'", "paid_at = NOW()"];
  const values: unknown[] = [];

  if (details?.transactionId !== undefined) {
    clauses.push("transaction_id = ?");
    values.push(details.transactionId);
  }
  if (details?.providerSubscriptionId !== undefined) {
    clauses.push("provider_subscription_id = ?");
    values.push(details.providerSubscriptionId);
  }
  if (details?.providerOrderId !== undefined) {
    clauses.push("provider_order_id = ?");
    values.push(details.providerOrderId);
  }
  if (details?.providerCaptureId !== undefined) {
    clauses.push("provider_capture_id = ?");
    values.push(details.providerCaptureId);
  }
  if (details?.providerEventId !== undefined) {
    clauses.push("provider_event_id = ?");
    values.push(details.providerEventId);
  }
  if (details?.providerPayloadJson !== undefined) {
    clauses.push("provider_payload_json = ?");
    values.push(details.providerPayloadJson);
  }

  const [result] = await db.query(
    `UPDATE payments SET ${clauses.join(", ")} WHERE id = ?`,
    [...values, id],
  );

  if (!result || !result.affectedRows) {
    throw new Error("Failed to mark payment as paid");
  }
}

export async function markPaymentFailed(
  id: number,
  details?: {
    providerEventId?: string | null;
    providerPayloadJson?: string | null;
    failureReason?: string | null;
  },
  dbOverride?: any,
): Promise<void> {
  const db = dbOverride || pool;
  const clauses = ["status = 'failed'"];
  const values: unknown[] = [];

  if (details?.providerEventId !== undefined) {
    clauses.push("provider_event_id = ?");
    values.push(details.providerEventId);
  }
  if (details?.providerPayloadJson !== undefined) {
    clauses.push("provider_payload_json = ?");
    values.push(details.providerPayloadJson);
  }
  if (details?.failureReason !== undefined) {
    clauses.push("failure_reason = ?");
    values.push(details.failureReason);
  }

  const [result] = await db.query(
    `UPDATE payments SET ${clauses.join(", ")} WHERE id = ?`,
    [...values, id],
  );

  if (!result || !result.affectedRows) {
    throw new Error("Failed to mark payment as failed");
  }
}

export type RegisteredWebhookEvent = {
  id: number;
  isDuplicate: boolean;
  processing_status: string;
  processed_at: Date | null;
};

export async function registerWebhookEvent(params: {
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  resourceId?: string | null;
  payloadJson: string;
}): Promise<RegisteredWebhookEvent> {
  const [insertResult] = await pool.query(
    "INSERT IGNORE INTO payment_webhook_events (provider, event_id, event_type, resource_id, payload_json) VALUES (?, ?, ?, ?, ?)",
    [
      params.provider,
      params.eventId,
      params.eventType,
      params.resourceId ?? null,
      params.payloadJson,
    ],
  );

  const [rows] = await pool.query(
    "SELECT id, processing_status, processed_at FROM payment_webhook_events WHERE provider = ? AND event_id = ? LIMIT 1",
    [params.provider, params.eventId],
  );

  const row = (rows as any[])[0];
  if (!row) {
    throw new Error("Failed to register webhook event");
  }

  return {
    id: Number(row.id),
    isDuplicate: Number((insertResult as any).affectedRows) === 0,
    processing_status: String(row.processing_status),
    processed_at: row.processed_at ?? null,
  };
}

export async function updateWebhookEventStatus(
  id: number,
  status: "processed" | "failed",
): Promise<void> {
  const [result] = await pool.query(
    "UPDATE payment_webhook_events SET processing_status = ?, processed_at = CASE WHEN ? = 'processed' THEN NOW() ELSE processed_at END WHERE id = ?",
    [status, status, id],
  );

  if (!result || !(result as any).affectedRows) {
    throw new Error("Failed to update webhook event status");
  }
}

export async function findMatchingProviderPlan(params: {
  provider: PaymentProvider;
  localPlanKey: string;
  billingPeriod: BillingPeriod;
  currency: string;
  amount: number;
}): Promise<ProviderPlanRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM payment_provider_plans WHERE provider = ? AND local_plan_key = ? AND billing_period = ? AND currency = ? AND amount = ? ORDER BY id DESC LIMIT 1",
    [
      params.provider,
      params.localPlanKey,
      params.billingPeriod,
      params.currency,
      params.amount,
    ],
  );

  const row = (rows as ProviderPlanRow[])[0];
  return row ? mapProviderPlanRow(row) : null;
}

export async function findLatestProviderPlanForLocalPlan(params: {
  provider: PaymentProvider;
  localPlanKey: string;
}): Promise<ProviderPlanRecord | null> {
  const [rows] = await pool.query(
    "SELECT * FROM payment_provider_plans WHERE provider = ? AND local_plan_key = ? ORDER BY id DESC LIMIT 1",
    [params.provider, params.localPlanKey],
  );

  const row = (rows as ProviderPlanRow[])[0];
  return row ? mapProviderPlanRow(row) : null;
}

export async function createProviderPlanRecord(params: {
  provider: PaymentProvider;
  localPlanKey: string;
  billingPeriod: BillingPeriod;
  currency: string;
  amount: number;
  providerProductId?: string | null;
  providerPlanId: string;
}): Promise<ProviderPlanRecord> {
  await pool.query(
    "INSERT IGNORE INTO payment_provider_plans (provider, local_plan_key, billing_period, currency, amount, provider_product_id, provider_plan_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      params.provider,
      params.localPlanKey,
      params.billingPeriod,
      params.currency,
      params.amount,
      params.providerProductId ?? null,
      params.providerPlanId,
    ],
  );

  const [rows] = await pool.query(
    "SELECT * FROM payment_provider_plans WHERE provider = ? AND provider_plan_id = ? LIMIT 1",
    [params.provider, params.providerPlanId],
  );

  const row = (rows as ProviderPlanRow[])[0];
  if (!row) {
    throw new Error("Failed to persist payment provider plan record");
  }

  return mapProviderPlanRow(row);
}

export type AdminPaymentRow = {
  id: number;
  full_name: string | null;
  email: string | null;
  plan: string;
  amount: number;
  status: string;
  created_at: Date;
};

export type ActiveProviderSubscription = {
  user_id: number;
  provider_subscription_id: string;
  subscription_renews_at: Date | null;
};

export async function listPaymentsWithUsers(): Promise<AdminPaymentRow[]> {
  const [rows] = await pool.query(
    "SELECT p.id, u.full_name, u.email, p.plan, p.amount, p.status, p.created_at FROM payments p INNER JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC",
  );

  return rows as AdminPaymentRow[];
}

export async function listActiveProviderSubscriptionsForPlanPeriod(params: {
  provider: Extract<PaymentProvider, "paypal">;
  planKey: string;
  billingPeriod: BillingPeriod;
}): Promise<ActiveProviderSubscription[]> {
  const [rows] = await pool.query(
    `SELECT DISTINCT
        u.id AS user_id,
        u.provider_subscription_id,
        u.subscription_renews_at
      FROM users u
      INNER JOIN payments p
        ON p.provider_subscription_id = u.provider_subscription_id
      WHERE u.subscription_status = 'active'
        AND u.subscription_provider = ?
        AND u.subscription_type = ?
        AND u.provider_subscription_id IS NOT NULL
        AND COALESCE(u.subscription_cancel_at_period_end, 0) = 0
        AND p.provider = ?
        AND p.plan = ?
        AND p.billing_period = ?`,
    [
      params.provider,
      params.planKey,
      params.provider,
      params.planKey,
      params.billingPeriod,
    ],
  );

  return Array.isArray(rows)
    ? (rows as any[])
        .map((row) => ({
          user_id: Number(row.user_id),
          provider_subscription_id: String(row.provider_subscription_id ?? ""),
          subscription_renews_at: row.subscription_renews_at ?? null,
        }))
        .filter((row) => row.user_id > 0 && row.provider_subscription_id)
    : [];
}
