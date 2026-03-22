import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { resolveRequestLocale, tServer } from "../i18n/serverI18n";

/**
 * Rate Limiter Middleware for Security
 * Protects against brute-force attacks, DDoS, and API abuse
 */

// Global API rate limiter - applies to all routes
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (shorter window for more flexibility)
  max: 200, // Limit each IP to 200 requests per minute (very permissive for development)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers

  // Skip rate limiting for authenticated users (only block anonymous abuse)
  skip: (req: Request) => {
    const user = (req as any).user;
    return !!user; // Skip for any authenticated user
  },

  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.global"),
      retryAfter: "15 minutes",
    });
  },
});

// Strict auth rate limiter - for login, registration, password reset
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.auth"),
      retryAfter: "15 minutes",
    });
  },
});

// Password reset rate limiter - stricter to prevent email spam
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  skipSuccessfulRequests: false, // Count all requests
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: Request, res: Response) => {
    const locale = resolveRequestLocale(req);
    res.status(429).json({
      error: tServer(locale, "rateLimit.passwordReset"),
      retryAfter: "1 hour",
    });
  },
});

// File upload rate limiter - prevent storage abuse
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each user to 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,

  // Skip for admins
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
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit to 10 sensitive operations per hour
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

    // Reset if window has passed
    if (!limit || now > limit.resetTime) {
      connections.set(key, {
        count: 1,
        resetTime: now + 60 * 1000, // 1 minute window
      });
      return true;
    }

    // Check if under limit (30 connections per minute - increased for development)
    if (limit.count < 30) {
      limit.count++;
      return true;
    }

    return false; // Rate limit exceeded
  };
};
