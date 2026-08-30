import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { School, evaluateAccess } from "./school.model.js";

const router = Router();

router.use(requireAuth);

/**
 * The signed-in user's own school subscription state. Deliberately NOT behind
 * `checkSubscription` — an expired school must still be able to read this to
 * render its lock screen and trial countdown. Legacy tenants and the platform
 * owner report as unrestricted.
 */
router.get("/me", async (req, res, next) => {
  try {
    const user = req.user!;

    if (user.role === "super_admin") {
      res.json({
        data: { hasSubscription: false, allowed: true, status: "active", plan: null, daysRemaining: null, trialEndDate: null, paidEndDate: null, schoolName: null },
      });
      return;
    }

    const school = await School.findOne({ schoolId: user.schoolId });
    if (!school) {
      // Predates onboarding — unrestricted, no banner or lock shown.
      res.json({
        data: { hasSubscription: false, allowed: true, status: "active", plan: null, daysRemaining: null, trialEndDate: null, paidEndDate: null, schoolName: null },
      });
      return;
    }

    const access = evaluateAccess(school);
    res.json({
      data: {
        hasSubscription: true,
        allowed: access.allowed,
        status: access.status,
        plan: school.subscription.plan,
        daysRemaining: access.daysRemaining,
        trialEndDate: access.trialEndDate,
        paidEndDate: access.paidEndDate,
        schoolName: school.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
