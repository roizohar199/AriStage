import type { NextFunction, Request, Response } from "express";

const NO_CACHE_CONTROL =
  "no-store, no-cache, must-revalidate, proxy-revalidate";

function setNoCacheHeaders(res: Response) {
  res.setHeader("Cache-Control", NO_CACHE_CONTROL);
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Ensure conditional requests never hit a 304 path for these endpoints.
  // Express will not override an already-set ETag.
  res.setHeader("ETag", `W/\"${Date.now()}-${Math.random()}\"`);
}

export function adminNoCache(req: Request, res: Response, next: NextFunction) {
  // Strip conditional headers so we always return 200 for admin observability.
  // (Best effort - safe even if header isn't present.)
  delete (req.headers as any)["if-none-match"];
  delete (req.headers as any)["if-modified-since"];

  setNoCacheHeaders(res);
  next();
}

export function adminNoCacheIfAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if ((req as any).user?.role === "admin") {
    return adminNoCache(req, res, next);
  }
  return next();
}
