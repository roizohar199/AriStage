import api from "@/modules/shared/lib/api.ts";

export type AdminSubscriptionDto = {
  userId: number;
  email: string;
  subscription_status: "active" | "trial" | "expired" | string | null;
  subscription_expires_at: string | null;
};

export async function listAdminSubscriptions(params?: {
  limit?: number;
  offset?: number;
}): Promise<AdminSubscriptionDto[]> {
  const { data } = await api.get("/admin/subscriptions", {
    params,
    skipErrorToast: true,
  } as any);

  return Array.isArray(data) ? (data as AdminSubscriptionDto[]) : [];
}
