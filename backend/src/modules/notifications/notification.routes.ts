import { Router, type Request } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { Notification, toPublicNotification } from "./notification.model.js";
import { teacherClassesFor } from "../../utils/teacherScope.js";
import { Student } from "../students/student.model.js";

const router = Router();

router.use(requireAuth);

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The class keys a parent or student may see class-tagged events (e.g. new
 * homework) for: a parent's children's classes, or a student's own class — in
 * both the bare ("Class 6") and composite ("Class 6 - A") forms a notification's
 * className might use. Matched exactly but whitespace- and case-tolerantly on
 * every email field, mirroring the parent↔child linkage the portal uses: the
 * portal trims + lowercases before comparing, and father/mother emails are not
 * normalised in the DB (nor are legacy guardian/student emails), so a plain
 * equality query would miss a child the portal finds. (This per-request lookup
 * is a schoolId-scoped student scan — fine for an on-focus/45s refresh; revisit
 * with a cache or normalised, indexed email fields if a school grows very large.)
 */
async function consumerClassKeys(schoolId: string, email: string, role: string): Promise<string[]> {
  const e = email.trim();
  if (!e) return [];
  const rx = new RegExp(`^\\s*${escapeRx(e)}\\s*$`, "i");
  const query =
    role === "student"
      ? { schoolId, email: rx }
      : { schoolId, $or: [{ "guardian.email": rx }, { fatherEmail: rx }, { motherEmail: rx }] };
  const rows = await Student.find(query, { className: 1, section: 1 }).lean();
  const keys = new Set<string>();
  for (const s of rows) {
    if (!s.className) continue;
    keys.add(s.className);
    if (s.section) keys.add(`${s.className} - ${s.section}`);
  }
  return [...keys];
}

/**
 * The filter that selects the caller's own notifications. A school user sees the
 * school-wide feed plus anything addressed to them personally. A TEACHER's feed is
 * scoped further: a school-wide row must be role-visible to teachers AND either
 * non-class-specific (a broadcast) or for a class they teach — so they don't get
 * every other class's admissions, "new staff added", fees or billing notices.
 *
 * A PARENT or STUDENT is scoped TIGHTEST of all: they see only what's addressed to
 * them personally (their child's alerts, a message from the school), a genuine
 * school-wide broadcast, or an event explicitly tagged for their role (e.g. new
 * homework). They never see an UNTAGGED school event — so office/admin chatter like
 * "new admission", "new staff" or fee/billing notices can't leak into a guardian's
 * feed even if a future event ships without a roles tag.
 *
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

  // Office roles see the whole school feed.
  if (user.role === "school_admin" || user.role === "principal") {
    return {
      schoolId: user.schoolId,
      $or: [{ audience: "school" }, { audience: "user", recipientEmail: email }],
    };
  }

  // Parents and students get the tightest feed: only what's addressed to them
  // personally, a genuine school-wide broadcast, or an event explicitly tagged for
  // their role AND their own class (e.g. their child's new homework — never another
  // class's). An UNTAGGED school event never reaches them, so office/admin chatter
  // ("new admission", fees, billing) stays out of their feed entirely.
  if (user.role === "parent" || user.role === "student") {
    const classKeys = await consumerClassKeys(user.schoolId, email, user.role);
    return {
      schoolId: user.schoolId,
      $or: [
        { audience: "user", recipientEmail: email },
        { audience: "school", type: "broadcast" },
        {
          audience: "school",
          roles: user.role,
          // Own class only: one of the viewer's own classes, or a legacy row saved
          // before notifications carried a class. A role-tagged event with an
          // EXPLICIT empty class is NOT treated as school-wide (that's what a
          // type:"broadcast" message is for), so a class-less homework can't blast
          // every family in the school.
          $or: [{ className: { $exists: false } }, { className: { $in: classKeys } }],
        },
      ],
    };
  }

  // Every other role (staff, accountant, driver, librarian, custom, …) sees a
  // school event if it's a genuine all-roles broadcast (no roles tag) or one
  // explicitly addressed to their role — never the office/admin feed.
  return {
    schoolId: user.schoolId,
    $or: [
      { audience: "user", recipientEmail: email },
      {
        audience: "school",
        $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }, { roles: user.role }],
      },
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
