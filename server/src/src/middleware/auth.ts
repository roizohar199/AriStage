import { verifyToken } from "../modules/auth/token.service";
import { AppError } from "../core/errors";
import { env } from "../config/env";
import { isKnownRole } from "../types/roles";
import { touchUserLastSeen } from "../modules/users/users.repository";
import { tRequest } from "../i18n/serverI18n";
import { logger } from "../core/logger";

import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  logger.debug("Auth middleware invoked", {
    method: req.method,
    path: req.path,
  });
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      throw new AppError(401, tRequest(req, "auth.missingAuthorizationHeader"));
    }

    const token = header.split(" ")[1];
    if (!token) {
      throw new AppError(401, tRequest(req, "auth.missingToken"));
    }

    const decoded: any = verifyToken(token);

    // Dev-only safety net: warn if JWT contains an unknown role.
    if (env.nodeEnv !== "production" && !isKnownRole(decoded.role)) {
      console.warn("[Auth] Unknown role in JWT payload:", decoded.role);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name || "",
      preferred_locale: decoded.preferred_locale || null,
    };

    // Non-blocking: admin "Last Seen" tracking.
    void touchUserLastSeen(req.user.id).catch(() => undefined);

    next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return next(new AppError(401, tRequest(req, "auth.tokenExpired")));
    }
    if (err?.name === "JsonWebTokenError") {
      return next(new AppError(401, tRequest(req, "auth.invalidToken")));
    }
    next(err);
  }
}

export function requireRoles(roles: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug("Role check middleware invoked", {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      requiredRoles: roles,
    });
    if (!roles.length) return next();

    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, tRequest(req, "auth.forbiddenRole")));
    }

    next();
  };
}
