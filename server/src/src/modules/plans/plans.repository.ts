import type { BillingPeriod } from "../../services/subscriptionService";
import { pool } from "../../database/pool";

export type Plan = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: boolean;
  monthly_enabled: boolean;
  yearly_enabled: boolean;
};

type PlanRow = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: number;
  monthly_enabled: number;
  yearly_enabled: number;
};

function mapRowToPlan(row: PlanRow): Plan {
  return {
    id: Number(row.id),
    key: String(row.key),
    name: String(row.name),
    description: row.description ?? null,
    currency: String(row.currency),
    monthly_price: Number(row.monthly_price),
    yearly_price: Number(row.yearly_price),
    enabled: Number(row.enabled) === 1,
    monthly_enabled: Number(row.monthly_enabled) === 1,
    yearly_enabled: Number(row.yearly_enabled) === 1,
  };
}

export function isPlanBillingPeriodEnabled(
  plan: Pick<Plan, "enabled" | "monthly_enabled" | "yearly_enabled">,
  billingPeriod: BillingPeriod,
): boolean {
  if (!plan.enabled) {
    return false;
  }

  return billingPeriod === "yearly"
    ? plan.yearly_enabled
    : plan.monthly_enabled;
}

export async function getPlanByKey(key: string): Promise<Plan | null> {
  const normalized = String(key ?? "").trim();
  if (!normalized) return null;

  const [rows] = await pool.query(
    "SELECT * FROM plans WHERE `key` = ? LIMIT 1",
    [normalized],
  );

  const row = (rows as PlanRow[])[0];
  return row ? mapRowToPlan(row) : null;
}

export async function listEnabledPlans(): Promise<Plan[]> {
  const [rows] = await pool.query(
    "SELECT * FROM plans WHERE enabled = 1 AND (monthly_enabled = 1 OR yearly_enabled = 1) ORDER BY monthly_price ASC, yearly_price ASC",
  );
  return (rows as PlanRow[]).map(mapRowToPlan);
}
