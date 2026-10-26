import type { RequestHandler, Request } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import type { UserRole } from "../modules/auth/user.model.js";
import { Role, permissionsOf } from "../modules/roles/role.model.js";
import { moduleForPath, isBaselinePath } from "../modules/roles/permissionModules.js";

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  schoolId: string;
  /** Present only for a custom role — points at the Role document with its permissions. */
  customRoleKey?: string;
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
      customRoleKey: payload.customRoleKey ?? "",
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
function roleGate(roles: UserRole[], customViaFlag: boolean): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    // A custom role isn't in any fixed list — it's authorised by the permission
    // gate (customRolePermissionGate), which runs first on tenant routes and sets
    // this flag. Routes the gate doesn't cover (e.g. owner-only /api/schools)
    // leave it unset, so a custom role is correctly denied there. STRICT gates
    // (customViaFlag=false) never accept a custom role even with the flag — used
    // for narrowed, dangerous permissions (e.g. a super_admin-only hard delete)
    // that a custom role must not inherit from a module "edit" grant.
    if (req.user.role === "custom") {
      if (customViaFlag && req.customAccessGranted) next();
      else next(ApiError.forbidden("Your role doesn't have access to this action."));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`This action requires one of: ${roles.join(", ")}.`));
      return;
    }
    next();
  };
}

export function requireRole(...roles: UserRole[]): RequestHandler {
  return roleGate(roles, true);
}

/**
 * Like {@link requireRole}, but a custom role is NEVER accepted via the permission
 * gate's flag — it must literally be one of `roles`. Use for narrowed/dangerous
 * gates (e.g. a super_admin-only hard delete) a custom role must not inherit.
 */
export function requireRoleStrict(...roles: UserRole[]): RequestHandler {
  return roleGate(roles, false);
}

/**
 * Resolves a custom-role user's permission map (moduleKey -> level) from their
 * Role document. Built-in roles return {} (never consulted).
 */
export async function resolveCustomPermissions(req: Request): Promise<Record<string, string>> {
  const u = req.user;
  if (!u || u.role !== "custom" || !u.customRoleKey) return {};
  const role = await Role.findOne({ schoolId: u.schoolId, key: u.customRoleKey, isActive: true });
  return permissionsOf(role);
}

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Authorises a CUSTOM-role user on tenant routes: the request path is matched to a
 * module and checked against the role's level (GET => view, writes => edit). On
 * success it flags the request (`customAccessGranted`) so the downstream
 * requireRole / crudRouter gates let the user through. Custom roles are
 * deny-by-default — an unmapped path is forbidden. Built-in roles pass straight
 * through untouched.
 */
export const customRolePermissionGate: RequestHandler = (req, _res, next) => {
  const u = req.user;
  if (!u || u.role !== "custom") {
    next(); // built-in roles keep their existing gating
    return;
  }

  const path = (req.originalUrl || req.url).split("?")[0] ?? "";
  if (isBaselinePath(path)) {
    // Baseline (shared) paths are READ-ONLY for custom roles: grant reads only,
    // never writes. A write on a baseline path leaves the flag unset, so the
    // route's own requireRole then denies the custom user.
    if (!WRITE_METHODS.has(req.method)) req.customAccessGranted = true;
    next();
    return;
  }

  const mod = moduleForPath(path);
  if (!mod) {
    next(ApiError.forbidden("Your role doesn't have access to this section."));
    return;
  }

  resolveCustomPermissions(req)
    .then((perms) => {
      const level = perms[mod.key] ?? "none";
      if (level === "none") {
        next(ApiError.forbidden(`Your role has no access to ${mod.label}.`));
        return;
      }
      const isWrite = WRITE_METHODS.has(req.method) && !mod.writeAtView;
      if (isWrite && level !== "edit") {
        next(ApiError.forbidden(`Your role has view-only access to ${mod.label}.`));
        return;
      }
      req.customAccessGranted = true;
      next();
    })
    .catch(next);
};
