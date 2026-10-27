import type { RequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";
import { School, evaluateAccess, type SchoolDoc } from "../modules/schools/school.model.js";
import { moduleForPath } from "../modules/roles/permissionModules.js";
import { TIERS, tierAllowsModule, tierDef, type Tier } from "../modules/schools/tiers.js";

/**
 * Core API prefixes every plan can always reach, regardless of feature tier —
 * the home dashboard (served to every role), the school's own identity/settings,
 * and the notification bell. The TIERS gate only locks OPTIONAL modules; it must
 * never take away the app's basic shell. Note `/api/dashboard` is the `analytics`
 * module's prefix, so without this exemption a Starter school would lose its home
 * dashboard — the Analytics *page* is hidden in the nav instead (frontend gate).
 */
const TIER_EXEMPT_PREFIXES = ["/api/dashboard", "/api/schools", "/api/notifications", "/api/profile"];

/**
 * For a PAID school, decides whether the requested path is inside its tier.
 * Returns a 402 upgrade error if the module is locked, else null. Trial and
 * complimentary (freeAccess) access are always full, so they are never gated here.
 */
function tierDenial(school: SchoolDoc, rawUrl: string): ApiError | null {
  const sub = school.subscription;
  const paid = (sub.plan === "monthly" || sub.plan === "yearly") && !sub.freeAccess;
  if (!paid) return null;

  const path = (rawUrl || "").split("?")[0] ?? "";
  if (TIER_EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) return null;

  const mod = moduleForPath(path);
  if (!mod) return null; // not a tier-gated module (portal, audit, documents, …)
  if (tierAllowsModule((sub.tier ?? "premium") as Tier, mod.key)) return null;

  const currentName = tierDef(sub.tier)?.name ?? "current";
  const needed = TIERS.find((t) => t.modules.includes(mod.key));
  return new ApiError(402, `${mod.label} isn't included in your ${currentName} plan. Upgrade to unlock it.`, {
    code: "TIER_UPGRADE_REQUIRED",
    module: mod.key,
    moduleLabel: mod.label,
    requiredTier: needed?.id ?? "premium",
    requiredTierName: needed?.name ?? "Premium",
  });
}

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
      // The plan is active — now check the request is inside the school's feature tier.
      const denial = tierDenial(school, req.originalUrl || req.url);
      if (denial) {
        next(denial);
        return;
      }
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
