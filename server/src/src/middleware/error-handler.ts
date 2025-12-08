import { AppError } from "../core/errors.js";
import { logger } from "../core/logger.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    logger.warn("Handled application error", {
      status: err.statusCode,
      message: err.message,
      details: err.details,
    });
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  logger.error(err.message || "Internal server error", {
    stack: err.stack,
  });

  res.status(500).json({ error: "Internal server error" });
}

