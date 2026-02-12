import { asyncHandler } from "../../core/asyncHandler";
import { AppError } from "../../core/errors";
import {
  adminSubscriptionsRepository,
  type AdminSubscriptionListRow,
} from "./adminSubscriptions.repository";

import type { Request, Response } from "express";

type AdminSubscriptionsListQuery = {
  limit?: string;
  offset?: string;
};

function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseOptionalLimitOffset(query: AdminSubscriptionsListQuery): {
  limit?: number;
  offset?: number;
} {
  const rawLimit = query.limit;
  const rawOffset = query.offset;

  if (rawLimit === undefined && rawOffset === undefined) return {};

  const limitNum = rawLimit !== undefined ? Number(rawLimit) : NaN;
  const offsetNum = rawOffset !== undefined ? Number(rawOffset) : 0;

  if (!Number.isFinite(limitNum) || limitNum <= 0) {
    throw new AppError(400, "limit must be a positive number", undefined);
  }

  if (!Number.isFinite(offsetNum) || offsetNum < 0) {
    throw new AppError(400, "offset must be a non-negative number", undefined);
  }

  const limitCapped = Math.min(Math.floor(limitNum), 200);
  const offsetFloored = Math.floor(offsetNum);

  return { limit: limitCapped, offset: offsetFloored };
}

function mapRowToDto(row: AdminSubscriptionListRow) {
  return {
    userId: Number(row.userId),
    email: row.email,
    subscription_status: row.subscription_status ?? null,
    subscription_expires_at: toIsoOrNull(row.subscription_expires_at),
  };
}

export const adminSubscriptionsController = {
  listSubscriptions: asyncHandler(async (req: Request, res: Response) => {
    // Keep consistent with adminUsers: optional limit/offset, cap limit at 200
    const { limit, offset } = parseOptionalLimitOffset(
      req.query as unknown as AdminSubscriptionsListQuery,
    );

    const rows = await adminSubscriptionsRepository.listSubscriptions(
      limit,
      offset,
    );
    const payload = Array.isArray(rows) ? rows.map(mapRowToDto) : [];
    res.json(payload);
  }),
};
