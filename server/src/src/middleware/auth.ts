import { verifyToken } from "../modules/auth/token.service.js";
import { AppError } from "../core/errors.js";
import { env } from "../config/env.js";
import { isKnownRole } from "../types/roles.js";
import { touchUserLastSeen } from "../modules/users/users.repository.js";

import type { NextFunction, Request, Response } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log("[TEMP][AUTH] requireAuth", req.method, req.path, req.body);
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      throw new AppError(
        401,
        "Unauthorized - Missing or invalid Authorization header"
      );
    }

    const token = header.split(" ")[1];
    if (!token) {
      throw new AppError(401, "Unauthorized - Missing token");
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
    };

    // Non-blocking: admin "Last Seen" tracking.
    void touchUserLastSeen(req.user.id).catch(() => undefined);

    next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return next(new AppError(401, "Token expired"));
    }
    if (err?.name === "JsonWebTokenError") {
      return next(new AppError(401, "Invalid token"));
    }
    next(err);
  }
}

export function requireRoles(roles: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(
      "[TEMP][AUTH] requireRoles",
      req.method,
      req.path,
      req.body,
      "roles:",
      roles,
      "user:",
      req.user
    );
    if (!roles.length) return next();

    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden - Role not allowed"));
    }

    next();
  };
}
