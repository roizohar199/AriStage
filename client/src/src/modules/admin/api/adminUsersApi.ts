import api from "@/modules/shared/lib/api.ts";

export type AdminUserDto = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string | null;
  subscription_type: string | null;
  subscription_status: "active" | "trial" | "expired" | string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
};

export type UpdateAdminUserSubscriptionPayload = {
  subscription_type?: string | null;
  subscription_status?: "active" | "trial" | "expired" | string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
};

export async function listAdminUsers(params?: {
  limit?: number;
  offset?: number;
}): Promise<AdminUserDto[]> {
  const { data } = await api.get("/admin/users", {
    params,
    skipErrorToast: true,
  } as any);

  return Array.isArray(data) ? (data as AdminUserDto[]) : [];
}

export async function updateAdminUserSubscription(
  userId: number,
  payload: UpdateAdminUserSubscriptionPayload,
): Promise<{
  subscription_type: string | null;
  subscription_status: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;
}> {
  const { data } = await api.put(
    `/admin/users/${userId}/subscription`,
    payload,
    {
      skipErrorToast: true,
    } as any,
  );

  return {
    subscription_type: data?.subscription_type ?? null,
    subscription_status: data?.subscription_status ?? null,
    subscription_started_at: data?.subscription_started_at ?? null,
    subscription_expires_at: data?.subscription_expires_at ?? null,
  };
}
