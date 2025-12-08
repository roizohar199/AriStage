import { verifyToken } from "../modules/auth/token.service.js";
import { AppError } from "../core/errors.js";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      throw new AppError(401, "Unauthorized - Missing or invalid Authorization header");
    }

    const token = header.split(" ")[1];
    if (!token) {
      throw new AppError(401, "Unauthorized - Missing token");
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name || "",
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError(401, "Token expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError(401, "Invalid token"));
    }
    next(err);
  }
}

export function requireRoles(roles = []) {
  return (req, res, next) => {
    if (!roles.length) return next();

    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, "Forbidden - Role not allowed"));
    }

    next();
  };
}

