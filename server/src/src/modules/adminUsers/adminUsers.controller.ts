import { asyncHandler } from "../../core/asyncHandler.js";
import { AppError } from "../../core/errors.js";
import { logSystemEvent } from "../../utils/systemLogger.js";
import {
  getUserSubscriptionFields,
  listUsers,
  updateUserSubscription,
} from "./adminUsers.repository.js";

function toMysqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function parseNullableIsoDate(value: any): string | null | undefined {
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

function parseExistingMysqlDateTime(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return toMysqlDateTime(value);
  const s = String(value).trim();
  if (!s) return null;
  // already mysql datetime
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(s)) return s;
  // iso
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return toMysqlDateTime(d);
}

function isFutureMysqlDateTime(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const ms = new Date(normalized).getTime();
  if (Number.isNaN(ms)) return false;
  return ms > Date.now();
}

function addDaysMysqlDateTime(days: number): string {
  const ms = Date.now() + days * 24 * 60 * 60 * 1000;
  return toMysqlDateTime(new Date(ms));
}

export const adminUsersController = {
  listUsers: asyncHandler(async (_req: any, res: any) => {
    const rows = await listUsers();
    res.json(Array.isArray(rows) ? rows : []);
  }),

  getSubscription: asyncHandler(async (req: any, res: any) => {
    const userId = Number(req.params.id);
    if (!userId) {
      throw new AppError(400, "Invalid user id", undefined);
    }

    const row = await getUserSubscriptionFields(userId);
    if (!row) {
      throw new AppError(404, "User not found", undefined);
    }

    res.json(row);
  }),

  updateSubscription: asyncHandler(async (req: any, res: any) => {
    const userId = Number(req.params.id);
    if (!userId) {
      throw new AppError(400, "Invalid user id", undefined);
    }

    const current = await getUserSubscriptionFields(userId);
    if (!current) {
      throw new AppError(404, "User not found", undefined);
    }

    const body = req.body || {};

    const incomingTypeRaw =
      body.subscription_type !== undefined
        ? String(body.subscription_type)
        : undefined;
    const incomingStatusRaw =
      body.subscription_status !== undefined
        ? String(body.subscription_status)
        : undefined;
    const incomingExpiresRaw = parseNullableIsoDate(
      body.subscription_expires_at
    );

    const nextType =
      incomingTypeRaw !== undefined
        ? incomingTypeRaw
        : current.subscription_type ?? null;
    const nextTypeLower = nextType ? String(nextType).toLowerCase() : "";

    const nextStatus =
      incomingStatusRaw !== undefined
        ? incomingStatusRaw
        : current.subscription_status ?? null;

    const currentExpires = parseExistingMysqlDateTime(
      current.subscription_expires_at
    );
    const nextExpires =
      incomingExpiresRaw !== undefined ? incomingExpiresRaw : currentExpires;

    if (nextTypeLower && nextTypeLower !== "trial" && nextTypeLower !== "pro") {
      throw new AppError(400, `Invalid subscription_type: ${nextTypeLower}`);
    }
    const isPaidTier = nextTypeLower === "pro";

    const payload: any = {};

    // Always apply explicit incoming fields
    if (incomingTypeRaw !== undefined)
      payload.subscription_type = nextTypeLower;
    if (incomingStatusRaw !== undefined)
      payload.subscription_status = nextStatus;
    if (incomingExpiresRaw !== undefined)
      payload.subscription_expires_at = nextExpires;

    // Enforce consistency: paid tier cannot be trial/expired; must be active with future expiry
    if (isPaidTier) {
      payload.subscription_type = nextTypeLower;
      payload.subscription_status = "active";

      if (!isFutureMysqlDateTime(nextExpires)) {
        // If admin explicitly provided expires and it's invalid/past, fail loudly
        if (incomingExpiresRaw !== undefined) {
          throw new AppError(
            400,
            "subscription_expires_at must be a future date for paid subscriptions",
            undefined
          );
        }
        // Otherwise, default to +30 days
        payload.subscription_expires_at = addDaysMysqlDateTime(30);
      } else {
        payload.subscription_expires_at = nextExpires;
      }
    }

    // If status is being set to active explicitly, require future expiry
    if (!isPaidTier && incomingStatusRaw === "active") {
      if (!isFutureMysqlDateTime(nextExpires)) {
        throw new AppError(
          400,
          "subscription_expires_at must be a future date when subscription_status is active",
          undefined
        );
      }
    }

    if (!Object.keys(payload).length) {
      throw new AppError(400, "No subscription fields provided", undefined);
    }

    const affected = await updateUserSubscription(userId, payload);
    if (!affected) {
      // No updates requested is treated as 400 to surface client issues
      throw new AppError(400, "No subscription fields provided", undefined);
    }

    const updated = await getUserSubscriptionFields(userId);
    if (!updated) {
      throw new AppError(404, "User not found", undefined);
    }

    void logSystemEvent(
      "info",
      "ADMIN_SUBSCRIPTION_UPDATE",
      "Admin updated user subscription",
      {
        userId,
        newStatus: updated.subscription_status ?? null,
        expiresAt: updated.subscription_expires_at ?? null,
      },
      (req as any).user?.id
    );

    res.json(updated);
  }),
};
