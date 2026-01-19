import { Router } from "express";
import { requireAuth, requireRoles } from "../../src/middleware/auth";
import { pool } from "../../src/database/pool.js";
import { AppError } from "../../src/core/errors.js";
import fs from "fs/promises";
import path from "path";
import { getUploadsRoot } from "../../src/utils/uploadsRoot.js";

const router = Router();
router.use(requireAuth, requireRoles(["admin", "manager"]));

function toForwardSlashes(p: string): string {
  return p.replace(/\\/g, "/");
}

function safeResolveUnderUploads(relativePath: string): string {
  const uploadsRoot = path.resolve(getUploadsRoot());

  const normalized = toForwardSlashes(String(relativePath || "")).trim();
  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) {
    throw new AppError(400, "Invalid path");
  }

  const diskPath = path.resolve(uploadsRoot, normalized);
  if (
    !diskPath.startsWith(uploadsRoot + path.sep) &&
    diskPath !== uploadsRoot
  ) {
    throw new AppError(400, "Invalid path");
  }

  return diskPath;
}

function inferUserIdFromUploadsPath(rel: string): number | null {
  const normalized = toForwardSlashes(rel);
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  // Known patterns in this repo:
  // uploads/charts/<userId>/...
  // uploads/users/<userId>/...
  const folder = parts[0];
  const maybeId = Number(parts[1]);
  if ((folder === "charts" || folder === "users") && Number.isFinite(maybeId)) {
    return maybeId;
  }

  return null;
}

async function walkUploads(
  dirAbs: string,
  dirRel: string,
  opts: {
    q?: string;
    userId?: number;
    max: number;
    offset: number;
  },
  out: any[],
) {
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });

  for (const entry of entries) {
    const abs = path.join(dirAbs, entry.name);
    const rel = dirRel ? `${dirRel}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      await walkUploads(abs, toForwardSlashes(rel), opts, out);
      if (out.length >= opts.max + opts.offset) return;
      continue;
    }

    if (!entry.isFile()) continue;

    const relForward = toForwardSlashes(rel);

    if (opts.q) {
      const hay = relForward.toLowerCase();
      if (!hay.includes(opts.q)) continue;
    }

    const inferredUserId = inferUserIdFromUploadsPath(relForward);
    if (opts.userId && inferredUserId !== opts.userId) continue;

    let stat: any;
    try {
      stat = await fs.stat(abs);
    } catch {
      continue;
    }

    out.push({
      source: "uploads",
      storage_path: relForward,
      file_name: path.basename(relForward),
      file_url: `/uploads/${relForward}`,
      size_bytes: stat.size,
      modified_at: stat.mtime?.toISOString?.() || null,
      user_id: inferredUserId,
    });

    if (out.length >= opts.max + opts.offset) return;
  }
}

async function listUploadsStorage(req: any, res: any, next: any) {
  try {
    const uploadsRoot = path.resolve(getUploadsRoot());
    const rawQ = typeof req.query?.q === "string" ? req.query.q.trim() : "";
    const q = rawQ ? rawQ.toLowerCase() : undefined;

    const rawUserId =
      typeof req.query?.userId === "string" ? req.query.userId : "";
    const userId =
      rawUserId && rawUserId.trim() ? Number(rawUserId) : undefined;

    const max = Math.min(2000, Math.max(1, Number(req.query?.limit) || 500));
    const offset = Math.max(0, Number(req.query?.offset) || 0);

    const list: any[] = [];
    await walkUploads(uploadsRoot, "", { q, userId, max, offset }, list);

    const sliced = list.slice(offset, offset + max);

    // Enrich owner info for inferred user IDs
    const ids = Array.from(
      new Set(
        sliced
          .map((r) => r.user_id)
          .filter((v) => typeof v === "number" && Number.isFinite(v)),
      ),
    ) as number[];

    let ownersById: Record<
      number,
      { owner_name: string | null; owner_email: string }
    > = {};
    if (ids.length) {
      const placeholders = ids.map(() => "?").join(",");
      const [rows] = await pool.query(
        `SELECT id, full_name, email FROM users WHERE id IN (${placeholders})`,
        ids,
      );
      const arr = Array.isArray(rows) ? (rows as any[]) : [];
      ownersById = arr.reduce((acc, u) => {
        acc[Number(u.id)] = {
          owner_name: u.full_name ?? null,
          owner_email: u.email,
        };
        return acc;
      }, {} as any);
    }

    const enriched = sliced.map((r) => {
      const owner =
        typeof r.user_id === "number"
          ? ownersById[Number(r.user_id)]
          : undefined;
      return {
        ...r,
        owner_name: owner?.owner_name,
        owner_email: owner?.owner_email,
      };
    });

    res.json({
      items: enriched,
      meta: {
        limit: max,
        offset,
        returned: enriched.length,
        scanned: list.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUploadsStorage(req: any, res: any, next: any) {
  try {
    const raw = typeof req.query?.path === "string" ? req.query.path : "";
    const rel = String(raw || "").trim();
    if (!rel) throw new AppError(400, "Missing path");

    const diskPath = safeResolveUnderUploads(rel);

    try {
      await fs.unlink(diskPath);
    } catch (err: any) {
      if (err?.code !== "ENOENT") throw err;
    }

    res.json({ message: "✅ הקובץ נמחק מהשרת" });
  } catch (err) {
    next(err);
  }
}

// Single endpoint: /api/admin/files (uploads storage)
router.get("/", listUploadsStorage);
router.delete("/", deleteUploadsStorage);

// Backwards compatible aliases
router.get("/storage", listUploadsStorage);
router.delete("/storage", deleteUploadsStorage);

export default router;
