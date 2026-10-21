import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { Student } from "../students/student.model.js";
import { Timetable } from "../timetable/timetable.model.js";
import { BusRoute } from "../busRoutes/busRoute.model.js";
import { StaffMember } from "../staff/staff.model.js";
import { User } from "../auth/user.model.js";
import { Mark } from "../marks/mark.model.js";

const router = Router();
router.use(requireAuth);

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The signed-in user's own children — students in their school whose guardian,
 * father or mother email matches the caller's login email (case-insensitive).
 * Powers the parent portal; returns only the child's own summary, never
 * school-wide data, so a parent can't see anything beyond their children.
 */
router.get("/children", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    if (!email) {
      res.json({ data: [] });
      return;
    }
    const all = await Student.find({ schoolId }).lean();
    const mine = all.filter((s) => {
      const emails = [s.guardian?.email, s.fatherEmail, s.motherEmail].map((e) =>
        String(e ?? "").trim().toLowerCase()
      );
      return emails.includes(email);
    });
    res.json({
      data: mine.map((s) => ({
        id: String(s._id),
        name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
        className: s.className ?? "",
        section: s.section ?? "",
        rollNo: s.rollNo ?? "",
        admissionNo: s.admissionNo ?? "",
        avatar: s.avatar ?? "",
        status: s.status ?? "active",
        attendancePercent: s.attendancePercent ?? 0,
        performancePercent: s.performancePercent ?? 0,
        feeDue: s.feeDue ?? 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ONE of the signed-in parent's children in detail — subject-wise marks plus the
 * live metrics. Guarded: the child must belong to this parent (guardian/father/
 * mother email == login email), else it reads as not-found. Never exposes any
 * other student's academics.
 */
router.get("/children/:id", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    const s = await Student.findOne({ _id: req.params.id, schoolId }).lean();
    const owns =
      !!s &&
      [s.guardian?.email, s.fatherEmail, s.motherEmail]
        .map((e) => String(e ?? "").trim().toLowerCase())
        .includes(email);
    if (!s || !owns) {
      // Don't reveal whether the id exists for someone else's child.
      throw ApiError.notFound("Child not found.");
    }
    const marks = await Mark.find({ schoolId, studentId: String(s._id) }).lean();
    // Aggregate marks per subject across every exam (weighted by max marks).
    const bySubject = new Map<string, { marks: number; maxMarks: number }>();
    for (const m of marks) {
      const key = m.subject || "—";
      const cur = bySubject.get(key) ?? { marks: 0, maxMarks: 0 };
      cur.marks += m.marks ?? 0;
      cur.maxMarks += m.maxMarks ?? 0;
      bySubject.set(key, cur);
    }
    const subjects = [...bySubject.entries()].map(([subject, v]) => ({
      subject,
      marks: v.marks,
      maxMarks: v.maxMarks,
      percent: v.maxMarks > 0 ? Math.round((v.marks / v.maxMarks) * 100) : 0,
    }));
    res.json({
      data: {
        profile: {
          name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
          className: s.className ?? "",
          section: s.section ?? "",
          rollNo: s.rollNo ?? "",
        },
        stats: {
          attendancePercent: s.attendancePercent ?? 0,
          performancePercent: s.performancePercent ?? 0,
          feeDue: s.feeDue ?? 0,
        },
        subjects,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * The signed-in STUDENT's own snapshot — matched to a Student record by login
 * email. Returns their profile, live metrics (attendance/performance/fee) and
 * today's timetable. Scoped to the one student, never school-wide data.
 */
router.get("/me/student", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    if (!email) {
      res.json({ data: null });
      return;
    }
    const s = await Student.findOne({ schoolId, email }).lean();
    if (!s) {
      res.json({ data: null });
      return;
    }
    const today = WEEKDAY[new Date().getDay()];
    const periods = await Timetable.find({ schoolId, className: s.className, day: today })
      .sort({ period: 1 })
      .lean();
    res.json({
      data: {
        profile: {
          name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
          className: s.className ?? "",
          section: s.section ?? "",
          rollNo: s.rollNo ?? "",
          admissionNo: s.admissionNo ?? "",
          avatar: s.avatar ?? "",
          status: s.status ?? "active",
        },
        stats: {
          attendancePercent: s.attendancePercent ?? 0,
          performancePercent: s.performancePercent ?? 0,
          feeDue: s.feeDue ?? 0,
        },
        todaysPeriods: periods.map((p) => ({
          period: p.period,
          time: p.time ?? "",
          subject: p.subject ?? "",
          teacher: p.teacher ?? "",
          room: p.room ?? "",
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * The signed-in DRIVER's assigned route(s). BusRoute.driver is a free-text name,
 * so routes are matched by the driver's own name (case-insensitive). Best-effort
 * until routes are linked to driver accounts by id.
 */
router.get("/me/driver", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const me = await User.findOne({ schoolId, email: req.user!.email }).lean();
    const name = (me?.name || "").trim();
    const routes = name
      ? await BusRoute.find({ schoolId, driver: new RegExp(`^${escapeRx(name)}$`, "i") }).lean()
      : [];
    res.json({
      data: {
        driverName: name,
        routes: routes.map((r) => ({
          id: String(r._id),
          code: r.code,
          name: r.name,
          stops: r.stops ?? [],
          students: r.students ?? 0,
          bus: r.bus ?? "",
          departure: r.departure ?? "",
          arrival: r.arrival ?? "",
          status: r.status ?? "active",
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * The signed-in STAFF member's own record (matched by login email) — for a
 * non-teaching-staff self-service home. Never exposes other employees' data.
 */
router.get("/me/staff", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    if (!email) {
      res.json({ data: null });
      return;
    }
    const s = await StaffMember.findOne({ schoolId, email }).lean();
    if (!s) {
      res.json({ data: null });
      return;
    }
    res.json({
      data: {
        profile: {
          name: s.name ?? "",
          role: s.role ?? "",
          dept: s.dept ?? "",
          employeeId: s.employeeId ?? "",
          status: s.status ?? "active",
          avatar: s.avatar ?? "",
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
