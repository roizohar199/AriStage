import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { resolveRequestLocale, tServer } from "../i18n/serverI18n";

/**
 * Rate Limiter Middleware for Security
 * Protects against brute-force attacks, DDoS, and API abuse
 */

const isProduction = process.env.NODE_ENV === "production";

// Global API rate limiter - applies to all routes
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: isProduction ? 200 : 2000,
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req: Request) => {
    const user = (req as any).user;
    return !!user;
  },

  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.global"),
      retryAfter: isProduction ? "1 minute" : "10 seconds",
    });
  },
});

// Auth rate limiter - relaxed in development
export const authLimiter = rateLimit({
  windowMs: isProduction ? 15 * 60 * 1000 : 1 * 60 * 1000,
  max: isProduction ? 5 : 100,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.auth"),
      retryAfter: isProduction ? "15 minutes" : "1 minute",
    });
  },
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: isProduction ? 60 * 60 * 1000 : 10 * 60 * 1000,
  max: isProduction ? 3 : 20,
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.passwordReset"),
      retryAfter: isProduction ? "1 hour" : "10 minutes",
    });
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req: Request) => {
    const user = (req as any).user;
    return user && user.role === "admin";
  },

  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.upload"),
      retryAfter: "1 hour",
    });
  },
});

// API endpoint rate limiter - for sensitive operations
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProduction ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.sensitiveOperation"),
      retryAfter: "1 hour",
    });
  },
});

// WebSocket connection rate limiter
export const createWebSocketRateLimiter = () => {
  const connections = new Map<string, { count: number; resetTime: number }>();

  return (ip: string): boolean => {
    const now = Date.now();
    const key = `ws-${ip}`;
    const limit = connections.get(key);

    if (!limit || now > limit.resetTime) {
      connections.set(key, {
        count: 1,
        resetTime: now + 60 * 1000,
      });
      return true;
    }

    const maxConnections = isProduction ? 30 : 300;

    if (limit.count < maxConnections) {
      limit.count++;
      return true;
    }

    return false;
  };
};
