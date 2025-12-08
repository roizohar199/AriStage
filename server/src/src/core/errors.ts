export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const throwNotFound = (message = "Resource not found") => {
  throw new AppError(404, message);
};

export const throwUnauthorized = (message = "Unauthorized") => {
  throw new AppError(401, message);
};

export const throwForbidden = (message = "Forbidden") => {
  throw new AppError(403, message);
};

