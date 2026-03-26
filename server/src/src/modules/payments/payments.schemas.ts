import { z } from "zod";

const billingPeriodSchema = z.enum(["monthly", "yearly"]);
const paymentProviderSchema = z.enum(["mock", "paypal"]);

export const createPaymentSchema = z.object({
  plan: z.string().trim().min(1, "payments.planRequired"),
  billing_period: billingPeriodSchema.optional(),
  billingPeriod: billingPeriodSchema.optional(),
  provider: paymentProviderSchema.optional(),
  return_to: z.string().trim().optional(),
  returnTo: z.string().trim().optional(),
});

export const mockSuccessSchema = z.object({
  paymentId: z.coerce.number().int().positive("payments.paymentIdRequired"),
});

export const paypalActivateSchema = z.object({
  subscriptionId: z.string().trim().min(1).optional(),
  subscription_id: z.string().trim().min(1).optional(),
  ba_token: z.string().trim().optional(),
  token: z.string().trim().optional(),
});

export const paypalCancelSchema = z.object({
  subscriptionId: z.string().trim().min(1).optional(),
  reason: z.string().trim().max(128).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PayPalActivateInput = z.infer<typeof paypalActivateSchema>;
export type PayPalCancelInput = z.infer<typeof paypalCancelSchema>;
