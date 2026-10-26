import type { UserRole } from "../modules/auth/user.model.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` once the bearer token is verified. */
      user?: {
        id: string;
        email: string;
        role: UserRole;
        schoolId: string;
        /** Key of the custom Role (only when role === "custom"). */
        customRoleKey?: string;
      };
      /** Validated `query` / `params`, populated by the `validate` middleware. */
      parsed?: Record<string, unknown>;
      /** Set by `customRolePermissionGate` once a custom role is authorised for the
       *  requested module — lets downstream requireRole gates pass the user. */
      customAccessGranted?: boolean;
    }
  }
}

export {};
