import api from "@/modules/shared/lib/api.ts";

export type AdminUserDto = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string | null;
  subscription_status: "active" | "trial" | "expired" | string | null;
  subscription_expires_at: string | null;
};

export type UpdateAdminUserSubscriptionPayload = {
  subscription_status?: "active" | "trial" | "expired" | string | null;
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
  payload: UpdateAdminUserSubscriptionPayload
): Promise<{
  subscription_status: string | null;
  subscription_expires_at: string | null;
}> {
  const { data } = await api.put(
    `/admin/users/${userId}/subscription`,
    payload,
    {
      skipErrorToast: true,
    } as any
  );

  return {
    subscription_status: data?.subscription_status ?? null,
    subscription_expires_at: data?.subscription_expires_at ?? null,
  };
}
