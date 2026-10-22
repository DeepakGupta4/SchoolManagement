import { Router, type Request } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { Notification, toPublicNotification } from "./notification.model.js";
import { teacherClassesFor } from "../../utils/teacherScope.js";

const router = Router();

router.use(requireAuth);

/**
 * The filter that selects the caller's own notifications. A school user sees the
 * school-wide feed plus anything addressed to them personally. A TEACHER's feed is
 * scoped further: a school-wide row must be role-visible to teachers AND either
 * non-class-specific (a broadcast) or for a class they teach — so they don't get
 * every other class's admissions, "new staff added", fees or billing notices.
 * Office/admin and super_admin are unchanged (they see everything in scope).
 * ($exists checks keep notifications created before these fields existed visible.)
 */
async function scopeFor(req: Request): Promise<Record<string, unknown>> {
  const user = req.user!;
  if (user.role === "super_admin") return { audience: "super_admin" };
  const email = (user.email || "").toLowerCase();

  if (user.role === "teacher") {
    const classes = await teacherClassesFor(req);
    return {
      schoolId: user.schoolId,
      $or: [
        { audience: "user", recipientEmail: email },
        {
          audience: "school",
          $and: [
            // Role gate: visible to all roles ([]/unset) or explicitly to teachers.
            { $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }, { roles: "teacher" }] },
            // Class gate: school-wide (""/unset) or one of the teacher's classes.
            { $or: [{ className: { $exists: false } }, { className: "" }, { className: { $in: classes } }] },
          ],
        },
      ],
    };
  }

  return {
    schoolId: user.schoolId,
    $or: [
      { audience: "school" },
      { audience: "user", recipientEmail: email },
    ],
  };
}

/** Latest notifications for the caller, with the unread count. */
router.get("/", async (req, res, next) => {
  try {
    const filter = await scopeFor(req);
    const [docs, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(30),
      Notification.countDocuments({ ...filter, read: false }),
    ]);
    res.json({ data: docs.map(toPublicNotification), meta: { unread } });
  } catch (err) {
    next(err);
  }
});

router.post("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany({ ...(await scopeFor(req)), read: false }, { $set: { read: true } });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/read", async (req, res, next) => {
  try {
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...(await scopeFor(req)) },
      { $set: { read: true } },
      { new: true }
    );
    if (!doc) throw ApiError.notFound("Notification not found.");
    res.json({ data: toPublicNotification(doc) });
  } catch (err) {
    next(err);
  }
});

export default router;
