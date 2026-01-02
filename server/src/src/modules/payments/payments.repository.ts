import { pool } from "../../database/pool.js";
import { getSubscriptionSettings } from "../subscriptions/subscriptions.repository.js";

import type { BillingPeriod } from "../../services/subscriptionService.js";

export type PaymentRecord = {
  id: number;
  user_id: number;
  provider: string;
  transaction_id: string | null;
  plan: string;
  billing_period: BillingPeriod;
  amount: number;
  currency: string;
  status: string;
  created_at: Date;
  paid_at: Date | null;
};

export async function createMockPayment(
  userId: number,
  billingPeriod: BillingPeriod
): Promise<PaymentRecord> {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error("Invalid userId for createMockPayment");
  }

  const settings = await getSubscriptionSettings();

  const basePrice = Number(settings.price_ils);
  const amount = billingPeriod === "yearly" ? basePrice * 12 : basePrice;

  const transactionId = `mock_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;

  const [result] = await pool.query(
    "INSERT INTO payments (user_id, provider, transaction_id, plan, billing_period, amount, currency, status) VALUES (?, 'mock', ?, 'pro', ?, ?, 'ILS', 'pending')",
    [userId, transactionId, billingPeriod, amount]
  );

  const insertId = (result as any).insertId as number;

  const [rows] = await pool.query("SELECT * FROM payments WHERE id = ?", [
    insertId,
  ]);

  return (rows as any[])[0] as PaymentRecord;
}

export async function findPaymentById(
  id: number
): Promise<PaymentRecord | null> {
  const [rows] = await pool.query("SELECT * FROM payments WHERE id = ?", [id]);
  const payment = (rows as any[])[0];
  return (payment as PaymentRecord) || null;
}

export async function markPaymentPaid(
  id: number,
  dbOverride?: any
): Promise<void> {
  const db = dbOverride || pool;

  const [result] = await db.query(
    "UPDATE payments SET status = 'paid', paid_at = NOW() WHERE id = ?",
    [id]
  );

  if (!result || !result.affectedRows) {
    throw new Error("Failed to mark payment as paid");
  }
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

export async function listPaymentsWithUsers(): Promise<AdminPaymentRow[]> {
  const [rows] = await pool.query(
    "SELECT p.id, u.full_name, u.email, p.plan, p.amount, p.status, p.created_at FROM payments p INNER JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC"
  );

  return rows as AdminPaymentRow[];
}
