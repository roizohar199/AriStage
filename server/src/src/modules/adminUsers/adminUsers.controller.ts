import { asyncHandler } from "../../core/asyncHandler";
import { AppError } from "../../core/errors";
import { logSystemEvent } from "../../utils/systemLogger";
import {
  adminUsersRepository,
  type AdminUserListRow,
  type AdminUserSubscriptionRow,
} from "./adminUsers.repository";
import { resolveRequestLocale, tServer } from "../../i18n/serverI18n";
import { logger } from "../../core/logger";

import type { Request, Response } from "express";

type AdminUsersListQuery = {
  limit?: string;
  offset?: string;
};

type AdminUserIdParams = {
  id: string;
};

type UpdateSubscriptionBody = {
  subscription_type?: string | null;
  // preferred
  subscription_status?: string | null;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  // backwards/alternate client naming
  status?: string | null;
  startedAt?: string | null;
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

function toMysqlDateTimeOrNull(value: unknown): string | null {
  const iso = toIsoOrNull(value);
  if (!iso) return null;
  return toMysqlDateTime(new Date(iso));
}

function parseNullableIsoDate(
  value: unknown,
  locale: "he-IL" | "en-US",
  fieldName: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new AppError(
      400,
      tServer(locale, "admin.subscriptionDateValid", { field: fieldName }),
      undefined,
    );
  }
  // Store as MySQL DATETIME compatible string
  return toMysqlDateTime(date);
}

function parseUserIdParam(raw: string, locale: "he-IL" | "en-US"): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new AppError(400, tServer(locale, "admin.invalidUserId"), undefined);
  }
  return n;
}

function parseOptionalLimitOffset(
  query: AdminUsersListQuery,
  locale: "he-IL" | "en-US",
): {
  limit?: number;
  offset?: number;
} {
  const rawLimit = query.limit;
  const rawOffset = query.offset;

  if (rawLimit === undefined && rawOffset === undefined) return {};

  const limitNum = rawLimit !== undefined ? Number(rawLimit) : NaN;
  const offsetNum = rawOffset !== undefined ? Number(rawOffset) : 0;

  if (!Number.isFinite(limitNum) || limitNum <= 0) {
    throw new AppError(400, tServer(locale, "admin.limitPositive"), undefined);
  }

  if (!Number.isFinite(offsetNum) || offsetNum < 0) {
    throw new AppError(
      400,
      tServer(locale, "admin.offsetNonNegative"),
      undefined,
    );
  }

  const limitCapped = Math.min(Math.floor(limitNum), 200);
  const offsetFloored = Math.floor(offsetNum);

  return { limit: limitCapped, offset: offsetFloored };
}

const ALLOWED_SUBSCRIPTION_STATUSES = new Set(["active", "trial", "expired"]);

function normalizeStatus(
  value: unknown,
  locale: "he-IL" | "en-US",
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const s = String(value).trim().toLowerCase();
  if (!ALLOWED_SUBSCRIPTION_STATUSES.has(s)) {
    throw new AppError(
      400,
      tServer(locale, "admin.subscriptionStatusInvalid", {
        values: Array.from(ALLOWED_SUBSCRIPTION_STATUSES).join(", "),
      }),
      undefined,
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
    subscription_type: row.subscription_type ?? null,
    subscription_status: row.subscription_status ?? null,
    subscription_started_at: toIsoOrNull(row.subscription_started_at),
    subscription_expires_at: toIsoOrNull(row.subscription_expires_at),
  };
}

export const adminUsersController = {
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const { limit, offset } = parseOptionalLimitOffset(
      req.query as unknown as AdminUsersListQuery,
      locale,
    );
    const rows = await adminUsersRepository.listUsers(limit, offset);
    const payload = Array.isArray(rows) ? rows.map(mapListRowToDto) : [];
    res.json(payload);
  }),

  getSubscription: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const params = req.params as unknown as AdminUserIdParams;
    const userId = parseUserIdParam(params.id, locale);
    const row = await adminUsersRepository.getUserSubscription(userId);
    if (!row)
      throw new AppError(404, tServer(locale, "auth.userNotFound"), undefined);
    res.json(mapSubscriptionRowToDto(row));
  }),

  updateSubscription: asyncHandler(async (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    const params = req.params as unknown as AdminUserIdParams;
    const body = (req.body || {}) as UpdateSubscriptionBody;

    const targetUserId = parseUserIdParam(params.id, locale);

    const adminUserIdRaw = (req as any).user?.id;
    const adminUserId = Number(adminUserIdRaw);
    if (!Number.isFinite(adminUserId) || adminUserId <= 0) {
      throw new AppError(401, tServer(locale, "admin.unauthorized"), undefined);
    }

    const existing =
      await adminUsersRepository.getUserSubscription(targetUserId);
    if (!existing)
      throw new AppError(404, tServer(locale, "auth.userNotFound"), undefined);

    const incomingStatus =
      body.subscription_status !== undefined
        ? normalizeStatus(body.subscription_status, locale)
        : body.status !== undefined
          ? normalizeStatus(body.status, locale)
          : undefined;

    const incomingExpires =
      body.subscription_expires_at !== undefined
        ? parseNullableIsoDate(
            body.subscription_expires_at,
            locale,
            "subscription_expires_at",
          )
        : body.expiresAt !== undefined
          ? parseNullableIsoDate(
              body.expiresAt,
              locale,
              "subscription_expires_at",
            )
          : undefined;

    const incomingStarted =
      body.subscription_started_at !== undefined
        ? parseNullableIsoDate(
            body.subscription_started_at,
            locale,
            "subscription_started_at",
          )
        : body.startedAt !== undefined
          ? parseNullableIsoDate(
              body.startedAt,
              locale,
              "subscription_started_at",
            )
          : undefined;

    const normalizedSubscriptionType =
      body.subscription_type === undefined
        ? undefined
        : body.subscription_type === null
          ? null
          : String(body.subscription_type).trim().toLowerCase() || null;

    if (
      incomingStatus === undefined &&
      incomingStarted === undefined &&
      incomingExpires === undefined &&
      normalizedSubscriptionType === undefined
    ) {
      throw new AppError(
        400,
        tServer(locale, "admin.noSubscriptionFields"),
        undefined,
      );
    }

    // Minimal validation: if status is being set to active/trial, require a valid future expiry.
    if (incomingStatus === "active" || incomingStatus === "trial") {
      if (incomingExpires === undefined) {
        throw new AppError(
          400,
          tServer(locale, "admin.subscriptionExpiresRequired"),
          undefined,
        );
      }
      if (incomingExpires === null) {
        throw new AppError(
          400,
          tServer(locale, "admin.subscriptionExpiresFuture"),
          undefined,
        );
      }
      const expiresMs = new Date(incomingExpires.replace(" ", "T")).getTime();
      if (!Number.isFinite(expiresMs) || expiresMs <= Date.now()) {
        throw new AppError(
          400,
          tServer(locale, "admin.subscriptionExpiresFuture"),
          undefined,
        );
      }
    }

    const nextStartedRaw =
      incomingStarted !== undefined
        ? incomingStarted
        : toMysqlDateTimeOrNull(existing.subscription_started_at);
    const nextExpiresRaw =
      incomingExpires !== undefined
        ? incomingExpires
        : toMysqlDateTimeOrNull(existing.subscription_expires_at);

    if (nextStartedRaw !== null && nextExpiresRaw !== null) {
      const startedMs = new Date(nextStartedRaw.replace(" ", "T")).getTime();
      const expiresMs = new Date(nextExpiresRaw.replace(" ", "T")).getTime();
      if (
        Number.isFinite(startedMs) &&
        Number.isFinite(expiresMs) &&
        startedMs > expiresMs
      ) {
        throw new AppError(
          400,
          tServer(locale, "admin.subscriptionDateOrderInvalid"),
          undefined,
        );
      }
    }

    const payload = {
      ...(normalizedSubscriptionType !== undefined
        ? { subscription_type: normalizedSubscriptionType }
        : {}),
      ...(incomingStatus !== undefined
        ? { subscription_status: incomingStatus }
        : {}),
      ...(incomingStarted !== undefined
        ? { subscription_started_at: incomingStarted }
        : {}),
      ...(incomingExpires !== undefined
        ? { subscription_expires_at: incomingExpires }
        : {}),
    };
    logger.info("Admin subscription update requested", {
      adminUserId,
      targetUserId,
    });
    const affected = await adminUsersRepository.updateUserSubscription(
      targetUserId,
      payload,
    );

    if (!affected) {
      throw new AppError(
        400,
        tServer(locale, "admin.noSubscriptionFields"),
        undefined,
      );
    }

    const updated =
      await adminUsersRepository.getUserSubscription(targetUserId);
    if (!updated)
      throw new AppError(404, tServer(locale, "auth.userNotFound"), undefined);

    const updatedDto = mapSubscriptionRowToDto(updated);

    void logSystemEvent(
      "info",
      "admin_update_subscription",
      "Admin updated user subscription",
      {
        targetUserId,
        newType: updatedDto.subscription_type,
        newStatus: updatedDto.subscription_status,
        newStartedAt: updatedDto.subscription_started_at,
        newExpiresAt: updatedDto.subscription_expires_at,
      },
      adminUserId,
    );

    res.json(updatedDto);
  }),
};
