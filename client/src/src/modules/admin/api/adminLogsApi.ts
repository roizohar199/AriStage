import api from "@/modules/shared/lib/api.ts";

export type AdminLogRow = {
  id: number;
  level?: string | null;
  action?: string | null;
  message?: string | null;
  context?: any;
  userId?: number | null;
  createdAt?: string | null;
  actorLabel?: string | null;
  explanation?: string | null;

  // legacy-compatible
  created_at?: string | null;
  user?: string | null;
  entity?: string | null;
};

export type AdminLogsResponse = {
  rows: AdminLogRow[];
  total: number;
};

export async function getAdminLogs(params?: {
  q?: string;
  level?: "info" | "warn" | "error" | "";
  action?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminLogsResponse> {
  const { data } = await api.get("/admin/logs", {
    params,
    skipErrorToast: true,
  } as any);

  return {
    rows: Array.isArray(data?.rows) ? (data.rows as AdminLogRow[]) : [],
    total: typeof data?.total === "number" ? data.total : 0,
  };
}
