import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { verifyAccessToken, AccessTokenPayload } from "../lib/jwt";
import { ApiError } from "../lib/ApiError";

// Extend Express Request to carry the decoded JWT payload
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Attaches the decoded payload to `req.user`.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing or malformed Authorization header"));
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

/**
 * Role-based access guard — must be used AFTER `authenticate`.
 *
 * @example
 * router.get("/admin", authenticate, requireRoles("ADMIN"), handler);
 */
export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }
    next();
  };
}