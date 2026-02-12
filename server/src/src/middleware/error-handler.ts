import { AppError } from "../core/errors";
import { logger } from "../core/logger";
import { recordSystemErrorBestEffort } from "../modules/errors/errors.service";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const shouldPersist = statusCode >= 500;
  if (shouldPersist) {
    const userLabel = req?.user
      ? `${req.user.id || ""} ${req.user.email || ""}`.trim()
      : null;

    void recordSystemErrorBestEffort({
      message: String(err?.message || "Internal server error"),
      route: `${req?.method || ""} ${req?.originalUrl || ""}`.trim(),
      user: userLabel,
      status: statusCode,
      stack: err?.stack ? String(err.stack) : null,
    });
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
