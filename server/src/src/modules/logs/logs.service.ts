import { listSystemLogs } from "./logs.repository";

export async function getSystemLogs(params?: { limit?: any }) {
  const limit = params?.limit != null ? Number(params.limit) : 100;
  return listSystemLogs(limit);
}
