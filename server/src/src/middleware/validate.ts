import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../core/errors";

/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */

/**
 * Validate request body against a Zod schema
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request query parameters against a Zod schema
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          error: "Invalid query parameters",
          details: errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request params against a Zod schema
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          error: "Invalid URL parameters",
          details: errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate all request data (body, query, params) against schemas
 */
export const validate = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as any;
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          type: err.code,
        }));

        return res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Validate uploaded file
 */
export const validateFile = (
  options: {
    required?: boolean;
    maxSize?: number; // in bytes
    allowedMimeTypes?: string[];
  } = {},
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;

    // Check if file is required
    if (options.required && !file) {
      return res.status(400).json({
        error: "File is required",
      });
    }

    if (!file) {
      return next();
    }

    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      return res.status(400).json({
        error: `File size must not exceed ${options.maxSize / 1024 / 1024}MB`,
      });
    }

    // Check MIME type
    if (
      options.allowedMimeTypes &&
      !options.allowedMimeTypes.includes(file.mimetype)
    ) {
      return res.status(400).json({
        error: `Invalid file type. Allowed types: ${options.allowedMimeTypes.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Sanitize request data - remove potentially harmful fields
 */
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Remove potentially dangerous fields from body
  const dangerousFields = ["__proto__", "constructor", "prototype"];

  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (dangerousFields.includes(key)) {
        continue;
      }
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  next();
};
