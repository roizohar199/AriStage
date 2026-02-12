import type { NextFunction, Request, Response } from "express";

import { listFeatureFlags } from "../modules/featureFlags/featureFlags.repository";

type CachedFlags = {
  loadedAt: number;
  map: Record<string, { enabled: boolean; description: string | null }>;
};

const CACHE_TTL_MS = 10_000;
let cache: CachedFlags | null = null;
let inFlight: Promise<CachedFlags> | null = null;

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  return Boolean(v);
}

async function loadFlagsMap(): Promise<CachedFlags> {
  const rows = await listFeatureFlags();
  const map: CachedFlags["map"] = {};
  for (const r of rows as any[]) {
    const key = String(r?.key || "").trim();
    if (!key) continue;
    map[key] = {
      enabled: toBool(r.enabled),
      description: r.description ?? null,
    };
  }
  return { loadedAt: Date.now(), map };
}

async function getFlagsMap(): Promise<CachedFlags> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) return cache;
  if (inFlight) return inFlight;

  inFlight = loadFlagsMap()
    .then((c) => {
      cache = c;
      return c;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function clearFeatureFlagsCache() {
  cache = null;
}

export function requireFeatureFlagEnabled(
  key: string,
  options?: {
    defaultEnabled?: boolean;
    adminBypass?: boolean;
  },
) {
  const flagKey = String(key || "").trim();
  const defaultEnabled = options?.defaultEnabled ?? true;
  const adminBypass = options?.adminBypass ?? true;

  return async function featureFlagMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!flagKey) return next();

      if (adminBypass && (req as any).user?.role === "admin") {
        return next();
      }

      const flags = await getFlagsMap();
      const row = flags.map[flagKey];

      // Default behavior: if flag doesn't exist in DB, feature is enabled.
      const enabled = row ? !!row.enabled : defaultEnabled;
      if (enabled) return next();

      return res.status(403).json({
        code: "FEATURE_DISABLED",
        key: flagKey,
      });
    } catch (err) {
      return next(err);
    }
  };
}
