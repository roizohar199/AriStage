import { AppError } from "../core/errors";
import { logger } from "../core/logger";
import { recordSystemErrorBestEffort } from "../modules/errors/errors.service";
import { tRequest } from "../i18n/serverI18n";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const shouldPersist = statusCode >= 500;
  if (shouldPersist) {
    const userLabel = req?.user?.id ? String(req.user.id) : null;

    void recordSystemErrorBestEffort({
      message: String(err?.message || tRequest(req, "errors.internal")),
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

  logger.error(err.message || tRequest(req, "errors.internal"), {
    stack: err.stack,
  });

  res.status(500).json({ error: tRequest(req, "errors.internal") });
}
