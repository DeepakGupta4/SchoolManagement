import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";
import { School, evaluateAccess } from "../modules/schools/school.model.js";

/**
 * The trial/subscription gate. This is the SOLE authority on whether a school
 * may use protected features — the decision is made here, against the server
 * clock and the database, never anything the client sends.
 *
 * Must run AFTER `requireAuth` (it reads `req.user`). Mounted on tenant data
 * routes; auth, the subscription-status endpoint and logout stay open so an
 * expired school can still sign in, see the lock screen and pay.
 */
export const checkSubscription: RequestHandler = async (req, _res, next) => {
  try {
    const user = req.user;
    if (!user) {
      next(ApiError.unauthorized());
      return;
    }

    // The platform owner is not a tenant and is never gated.
    if (user.role === "super_admin") {
      next();
      return;
    }

    const school = await School.findOne({ schoolId: user.schoolId });

    // Tenants that predate the subscription system (e.g. the original demo
    // school) have no School document. Fail open for them rather than locking
    // out a working deployment — every school created through onboarding has a
    // record and is enforced normally.
    if (!school) {
      next();
      return;
    }

    const access = evaluateAccess(school);
    if (access.allowed) {
      next();
      return;
    }

    // 402 Payment Required: the request is well-formed and authenticated, but
    // the school's plan doesn't permit it. The frontend keys off this status.
    next(
      new ApiError(402, subscriptionMessage(access.status), {
        code: access.status === "suspended" ? "ACCOUNT_SUSPENDED" : "SUBSCRIPTION_INACTIVE",
        subscriptionStatus: access.status,
      })
    );
  } catch (err) {
    next(err);
  }
};

function subscriptionMessage(status: string): string {
  if (status === "suspended") return "This account has been suspended. Please contact support.";
  if (status === "expired") return "Your free trial or subscription has expired.";
  return "Your subscription is not active.";
}
