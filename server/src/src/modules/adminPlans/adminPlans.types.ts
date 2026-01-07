export type Plan = {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: boolean;
};

export type PlanRow = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  currency: string;
  monthly_price: number;
  yearly_price: number;
  enabled: number; // tinyint(1)
  created_at?: string;
  updated_at?: string | null;
};
