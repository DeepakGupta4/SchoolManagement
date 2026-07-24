import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import type { UserRole } from "../modules/auth/user.model.js";

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/** Rejects the request unless a valid bearer token is present. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized());
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as TokenPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId,
    };
    next();
  } catch {
    // Expired and tampered tokens are the same to the caller: sign in again.
    next(ApiError.unauthorized("Your session has expired. Please sign in again."));
  }
};

/**
 * Restricts a route to specific roles. Always used AFTER `requireAuth`, which
 * is what puts `req.user` in place.
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`This action requires one of: ${roles.join(", ")}.`));
      return;
    }
    next();
  };
}
