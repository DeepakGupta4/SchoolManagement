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
      };
      /** Validated `query` / `params`, populated by the `validate` middleware. */
      parsed?: Record<string, unknown>;
    }
  }
}

export {};
