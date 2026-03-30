import { Request, Response, NextFunction } from "express";
import { ApiError } from "../lib/ApiError";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Unhandled / unexpected errors
  console.error("[Unhandled Error]", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}