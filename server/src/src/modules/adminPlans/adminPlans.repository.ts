import { pool } from "../../database/pool";
import type { Plan, PlanRow } from "./adminPlans.types";

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

export async function listPlans(): Promise<Plan[]> {
  const [rows] = await pool.query("SELECT * FROM plans");
  return (rows as PlanRow[]).map(mapRowToPlan);
}

export type CreatePlanInput = {
  key: string;
  name: string;
  description?: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled?: boolean;
  monthly_enabled?: boolean;
  yearly_enabled?: boolean;
};

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const enabledValue = input.enabled === false ? 0 : 1;
  const monthlyEnabledValue = input.monthly_enabled === false ? 0 : 1;
  const yearlyEnabledValue = input.yearly_enabled === false ? 0 : 1;

  const [result] = await pool.query(
    "INSERT INTO plans (`key`, `name`, `description`, `currency`, `monthly_price`, `yearly_price`, `enabled`, `monthly_enabled`, `yearly_enabled`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      input.key,
      input.name,
      input.description ?? null,
      input.currency,
      input.monthly_price,
      input.yearly_price,
      enabledValue,
      monthlyEnabledValue,
      yearlyEnabledValue,
    ],
  );

  const insertedId = Number((result as any).insertId);
  const plan = await getPlanById(insertedId);
  if (!plan) {
    // Should not happen, but keep repo predictable.
    throw new Error("Failed to read plan after insert");
  }
  return plan;
}

export type UpdatePlanInput = {
  key: string;
  name: string;
  description?: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: boolean;
  monthly_enabled: boolean;
  yearly_enabled: boolean;
};

export async function updatePlan(
  id: number,
  input: UpdatePlanInput,
): Promise<Plan | null> {
  const enabledValue = input.enabled ? 1 : 0;
  const monthlyEnabledValue = input.monthly_enabled ? 1 : 0;
  const yearlyEnabledValue = input.yearly_enabled ? 1 : 0;

  const [result] = await pool.query(
    "UPDATE plans SET `key` = ?, `name` = ?, `description` = ?, `currency` = ?, `monthly_price` = ?, `yearly_price` = ?, `enabled` = ?, `monthly_enabled` = ?, `yearly_enabled` = ? WHERE id = ?",
    [
      input.key,
      input.name,
      input.description ?? null,
      input.currency,
      input.monthly_price,
      input.yearly_price,
      enabledValue,
      monthlyEnabledValue,
      yearlyEnabledValue,
      id,
    ],
  );

  if ((result as any).affectedRows === 0) return null;
  return await getPlanById(id);
}

export async function setPlanEnabled(
  id: number,
  enabled: boolean,
): Promise<Plan | null> {
  const enabledValue = enabled ? 1 : 0;

  const [result] = await pool.query(
    "UPDATE plans SET enabled = ? WHERE id = ?",
    [enabledValue, id],
  );

  if ((result as any).affectedRows === 0) return null;
  return await getPlanById(id);
}

export async function deletePlan(id: number): Promise<boolean> {
  const [result] = await pool.query("DELETE FROM plans WHERE id = ?", [id]);
  return (result as any).affectedRows > 0;
}

export async function getPlanById(id: number): Promise<Plan | null> {
  const [rows] = await pool.query("SELECT * FROM plans WHERE id = ? LIMIT 1", [
    id,
  ]);
  const row = (rows as PlanRow[])[0];
  return row ? mapRowToPlan(row) : null;
}
