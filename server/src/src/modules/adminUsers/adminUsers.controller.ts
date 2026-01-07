import { asyncHandler } from "../../core/asyncHandler.js";
import { AppError } from "../../core/errors.js";
import { logSystemEvent } from "../../utils/systemLogger.js";
import {
  adminUsersRepository,
  type AdminUserListRow,
  type AdminUserSubscriptionRow,
} from "./adminUsers.repository.js";

import type { Request, Response } from "express";

type AdminUsersListQuery = {
  limit?: string;
  offset?: string;
};

type AdminUserIdParams = {
  id: string;
};

type UpdateSubscriptionBody = {
  // preferred
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  // backwards/alternate client naming
  status?: string | null;
  expiresAt?: string | null;
};

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseNullableIsoDate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new AppError(
      400,
      "subscription_expires_at must be a valid date",
      undefined
    );
  }
  // Store as MySQL DATETIME compatible string
  return toMysqlDateTime(date);
}

function parseUserIdParam(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new AppError(400, "Invalid user id", undefined);
  }
  return n;
}

function parseOptionalLimitOffset(query: AdminUsersListQuery): {
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

const ALLOWED_SUBSCRIPTION_STATUSES = new Set(["active", "trial", "expired"]);

function normalizeStatus(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const s = String(value).trim().toLowerCase();
  if (!ALLOWED_SUBSCRIPTION_STATUSES.has(s)) {
    throw new AppError(
      400,
      `subscription_status must be one of: ${Array.from(
        ALLOWED_SUBSCRIPTION_STATUSES
      ).join(", ")}`,
      undefined
    );
  }
  return s;
}

function mapListRowToDto(row: AdminUserListRow) {
  return {
    id: Number(row.id),
    full_name: row.full_name ?? "",
    email: row.email,
    role: row.role,
    subscription_type: row.subscription_type ?? null,
    subscription_status: row.subscription_status ?? null,
    subscription_started_at: toIsoOrNull(row.subscription_started_at),
    subscription_expires_at: toIsoOrNull(row.subscription_expires_at),
    last_seen_at: toIsoOrNull(row.last_seen_at),
    created_at: toIsoOrNull(row.created_at),
  };
}

function mapSubscriptionRowToDto(row: AdminUserSubscriptionRow) {
  return {
    subscription_status: row.subscription_status ?? null,
    subscription_expires_at: toIsoOrNull(row.subscription_expires_at),
  };
}

export const adminUsersController = {
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const { limit, offset } = parseOptionalLimitOffset(
      req.query as unknown as AdminUsersListQuery
    );
    const rows = await adminUsersRepository.listUsers(limit, offset);
    const payload = Array.isArray(rows) ? rows.map(mapListRowToDto) : [];
    res.json(payload);
  }),

  getSubscription: asyncHandler(async (req: Request, res: Response) => {
    const params = req.params as unknown as AdminUserIdParams;
    const userId = parseUserIdParam(params.id);
    const row = await adminUsersRepository.getUserSubscription(userId);
    if (!row) throw new AppError(404, "User not found", undefined);
    res.json(mapSubscriptionRowToDto(row));
  }),

  updateSubscription: asyncHandler(async (req: Request, res: Response) => {
    const params = req.params as unknown as AdminUserIdParams;
    const body = (req.body || {}) as UpdateSubscriptionBody;
    console.log("[ADMIN SUB UPDATE] params:", params);
    console.log("[ADMIN SUB UPDATE] body:", body);

    const targetUserId = parseUserIdParam(params.id);

    const adminUserIdRaw = (req as any).user?.id;
    const adminUserId = Number(adminUserIdRaw);
    if (!Number.isFinite(adminUserId) || adminUserId <= 0) {
      throw new AppError(401, "Unauthorized", undefined);
    }

    const existing = await adminUsersRepository.getUserSubscription(
      targetUserId
    );
    if (!existing) throw new AppError(404, "User not found", undefined);

    const incomingStatus =
      body.subscription_status !== undefined
        ? normalizeStatus(body.subscription_status)
        : body.status !== undefined
        ? normalizeStatus(body.status)
        : undefined;

    const incomingExpires =
      body.subscription_expires_at !== undefined
        ? parseNullableIsoDate(body.subscription_expires_at)
        : body.expiresAt !== undefined
        ? parseNullableIsoDate(body.expiresAt)
        : undefined;

    if (incomingStatus === undefined && incomingExpires === undefined) {
      throw new AppError(400, "No subscription fields provided", undefined);
    }

    // Minimal validation: if status is being set to active/trial, require a valid future expiry.
    if (incomingStatus === "active" || incomingStatus === "trial") {
      if (incomingExpires === undefined) {
        throw new AppError(
          400,
          "subscription_expires_at is required when subscription_status is active or trial",
          undefined
        );
      }
      if (incomingExpires === null) {
        throw new AppError(
          400,
          "subscription_expires_at must be a future date when subscription_status is active or trial",
          undefined
        );
      }
      const expiresMs = new Date(incomingExpires.replace(" ", "T")).getTime();
      if (!Number.isFinite(expiresMs) || expiresMs <= Date.now()) {
        throw new AppError(
          400,
          "subscription_expires_at must be a future date when subscription_status is active or trial",
          undefined
        );
      }
    }

    const payload = {
      ...(body.subscription_type !== undefined
        ? { subscription_type: body.subscription_type }
        : {}),
      ...(incomingStatus !== undefined
        ? { subscription_status: incomingStatus }
        : {}),
      ...(incomingExpires !== undefined
        ? { subscription_expires_at: incomingExpires }
        : {}),
    };
    console.log("[ADMIN SUB PASS TO REPO]", payload);
    const affected = await adminUsersRepository.updateUserSubscription(
      targetUserId,
      payload
    );

    if (!affected) {
      throw new AppError(400, "No subscription fields provided", undefined);
    }

    const updated = await adminUsersRepository.getUserSubscription(
      targetUserId
    );
    if (!updated) throw new AppError(404, "User not found", undefined);

    const updatedDto = mapSubscriptionRowToDto(updated);

    void logSystemEvent(
      "info",
      "admin_update_subscription",
      "Admin updated user subscription",
      {
        targetUserId,
        newStatus: updatedDto.subscription_status,
        newExpiresAt: updatedDto.subscription_expires_at,
      },
      adminUserId
    );

    res.json(updatedDto);
  }),
};
