import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown | Promise<unknown>;

export const asyncHandler = (handler: AsyncHandlerFn): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
