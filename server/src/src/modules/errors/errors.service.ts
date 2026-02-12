import { logger } from "../../core/logger";
import {
  insertSystemError,
  listSystemErrors,
  setSystemErrorResolved,
} from "./errors.repository";

export async function getSystemErrors(params: { limit?: any }) {
  const limit = params?.limit != null ? Number(params.limit) : 50;
  return listSystemErrors(limit);
}

export async function resolveSystemError(id: number, resolved: boolean) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) return false;
  return setSystemErrorResolved(numericId, Boolean(resolved));
}

export async function recordSystemErrorBestEffort(input: {
  message: string;
  route?: string | null;
  user?: string | null;
  status?: number | null;
  stack?: string | null;
}) {
  try {
    await insertSystemError(input);
  } catch (err: any) {
    // Never break the response path if error persistence fails.
    logger.warn("Failed to persist system error", {
      message: err?.message,
      code: err?.code,
    });
  }
}
