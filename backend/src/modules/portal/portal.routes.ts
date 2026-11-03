import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { Student } from "../students/student.model.js";
import { Timetable } from "../timetable/timetable.model.js";
import { BusRoute } from "../busRoutes/busRoute.model.js";
import { StaffMember } from "../staff/staff.model.js";
import { StaffAttendance } from "../staffAttendance/staffAttendance.model.js";
import { User } from "../auth/user.model.js";
import { Mark } from "../marks/mark.model.js";
import { Exam } from "../exams/exam.model.js";
import { School } from "../schools/school.model.js";
import { gradeForPercent, effectiveScheme } from "../../utils/grading.js";

const router = Router();
router.use(requireAuth);

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The minimal student shape buildReportCard needs (satisfied by a lean Student). */
interface ReportStudent {
  _id: unknown;
  firstName?: string;
  lastName?: string;
  className?: string;
  section?: string;
  rollNo?: string;
  admissionNo?: string;
  avatar?: string;
  attendancePercent?: number;
}

/**
 * A full, print-ready report card for ONE student + exam — the same shape the
 * office/teacher report-card screen produces, but computed server-side so a
 * parent or student never fetches the whole class's marks. The class RANK is
 * derived from every classmate's percent, yet ONLY the rank number and class
 * size leave the server — never another student's marks. `examName` defaults to
 * the student's most recent exam (by the exam's date, then name). Returns a null
 * card when the student has no marks yet.
 */
async function buildReportCard(schoolId: string, s: ReportStudent, examNameParam?: string) {
  const studentId = String(s._id);
  const examNames = (await Mark.distinct("examName", { schoolId, studentId })).filter(Boolean) as string[];
  if (examNames.length === 0) return { exams: [], selected: "", reportCard: null };

  // Order the student's exams newest-first by the school's exam date, then name.
  const exams = await Exam.find({ schoolId, name: { $in: examNames } }, { name: 1, date: 1 }).lean();
  const dateByName = new Map(exams.map((e) => [e.name, e.date || ""]));
  const ordered = [...examNames].sort((a, b) => {
    const da = dateByName.get(a) || "";
    const db = dateByName.get(b) || "";
    if (da !== db) return db.localeCompare(da);
    return a.localeCompare(b);
  });
  const selected = examNameParam && ordered.includes(examNameParam) ? examNameParam : ordered[0];

  const school = await School.findOne({ schoolId }).lean();
  const scheme = effectiveScheme(school?.gradingScheme);

  const mine = await Mark.find({ schoolId, studentId, examName: selected }).lean();
  // Key the card off the class/section the MARKS were entered under — a per-row
  // snapshot taken at exam time — not the student's CURRENT record, which may have
  // moved on (a section change / promotion never re-keys old marks). This keeps the
  // card identical to the office card for that exam, keeps the student inside their
  // own rank cohort, and never double-counts a subject if the same exam was somehow
  // re-entered under a second section (we use the dominant one).
  const cohortCount = new Map<string, number>();
  for (const m of mine) cohortCount.set(`${m.className ?? ""}\u0000${m.section ?? ""}`, (cohortCount.get(`${m.className ?? ""}\u0000${m.section ?? ""}`) ?? 0) + 1);
  const dominant = [...cohortCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const [className, section] = dominant !== undefined ? dominant.split("\u0000") : [s.className ?? "", s.section ?? ""];
  const myRows = mine.filter((m) => (m.className ?? "") === className && (m.section ?? "") === section);

  const subjects = myRows
    .map((m) => {
      const pct = (m.maxMarks ?? 0) > 0 ? Math.round(((m.marks ?? 0) / (m.maxMarks ?? 0)) * 100) : 0;
      return { subject: m.subject || "—", marks: m.marks ?? 0, maxMarks: m.maxMarks ?? 0, grade: gradeForPercent(scheme, pct).grade };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
  const total = subjects.reduce((n, x) => n + x.marks, 0);
  const outOf = subjects.reduce((n, x) => n + x.maxMarks, 0);
  const percent = outOf > 0 ? Math.round((total / outOf) * 100) : 0;
  const band = gradeForPercent(scheme, percent);

  // Class rank among the same cohort (the marks' class/section). Each classmate's
  // percent is ROUNDED before sorting — matching the office/web card exactly — then
  // ties break on raw total. Only this student's place + the cohort size are kept.
  let rank: number | undefined;
  let classSize: number | undefined;
  if (className && section) {
    const classMarks = await Mark.find(
      { schoolId, examName: selected, className, section },
      { studentId: 1, marks: 1, maxMarks: 1 }
    ).lean();
    const agg = new Map<string, { total: number; outOf: number }>();
    for (const m of classMarks) {
      const cur = agg.get(m.studentId) ?? { total: 0, outOf: 0 };
      cur.total += m.marks ?? 0;
      cur.outOf += m.maxMarks ?? 0;
      agg.set(m.studentId, cur);
    }
    const ranked = [...agg.entries()]
      .map(([id, v]) => ({ id, total: v.total, percent: v.outOf > 0 ? Math.round((v.total / v.outOf) * 100) : 0 }))
      .sort((a, b) => b.percent - a.percent || b.total - a.total);
    classSize = ranked.length;
    const pos = ranked.findIndex((r) => r.id === studentId);
    if (pos >= 0) rank = pos + 1;
  }

  return {
    exams: ordered,
    selected,
    reportCard: {
      examName: selected,
      studentName: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
      className,
      section,
      rollNo: s.rollNo ?? "",
      admissionNo: s.admissionNo ?? "",
      avatar: s.avatar ?? "",
      attendancePercent: s.attendancePercent ?? 0,
      subjects,
      total,
      outOf,
      percent,
      grade: band.grade,
      gradePoint: band.gradePoint,
      remark: band.remark,
      rank,
      classSize,
    },
  };
}

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
    // Derive each subject's grade from the school's own scheme, so the parent
    // view matches the report card exactly.
    const school = await School.findOne({ schoolId }).lean();
    const scheme = effectiveScheme(school?.gradingScheme);
    const subjects = [...bySubject.entries()].map(([subject, v]) => {
      const percent = v.maxMarks > 0 ? Math.round((v.marks / v.maxMarks) * 100) : 0;
      const g = gradeForPercent(scheme, percent);
      return { subject, marks: v.marks, maxMarks: v.maxMarks, percent, grade: g.grade, gradePoint: g.gradePoint };
    });
    const graded = subjects.filter((x) => x.maxMarks > 0);
    const gpa = graded.length
      ? Math.round((graded.reduce((sum, x) => sum + x.gradePoint, 0) / graded.length) * 100) / 100
      : 0;
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
          gpa,
        },
        subjects,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ONE of the signed-in parent's children's full report card for an exam (newest
 * by default). Ownership-guarded exactly like children/:id; rank is computed
 * server-side so no classmate's marks ever reach the parent.
 */
router.get("/children/:id/report-card", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    const s = await Student.findOne({ _id: req.params.id, schoolId }).lean();
    const owns =
      !!s &&
      [s.guardian?.email, s.fatherEmail, s.motherEmail]
        .map((e) => String(e ?? "").trim().toLowerCase())
        .includes(email);
    if (!s || !owns) throw ApiError.notFound("Child not found.");
    const examName = typeof req.query.examName === "string" ? req.query.examName : undefined;
    res.json({ data: await buildReportCard(schoolId, s, examName) });
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
    // Timetable rows store a COMPOSITE className ("Class 6 - A"); match that, with
    // a bare fallback for any legacy rows saved without a section.
    const classKey = s.section ? `${s.className} - ${s.section}` : s.className;
    const periods = await Timetable.find({
      schoolId,
      className: { $in: [classKey, s.className] },
      day: today,
    })
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
 * The signed-in STUDENT's own report card — subject-wise marks + grade + GPA,
 * derived exactly like the parent's children/:id view. Scoped to the one student
 * (matched by login email); null if no record. Never exposes anyone else's marks.
 */
router.get("/me/report", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    const s = email ? await Student.findOne({ schoolId, email }).lean() : null;
    if (!s) {
      res.json({ data: null });
      return;
    }
    const marks = await Mark.find({ schoolId, studentId: String(s._id) }).lean();
    const bySubject = new Map<string, { marks: number; maxMarks: number }>();
    for (const m of marks) {
      const key = m.subject || "—";
      const cur = bySubject.get(key) ?? { marks: 0, maxMarks: 0 };
      cur.marks += m.marks ?? 0;
      cur.maxMarks += m.maxMarks ?? 0;
      bySubject.set(key, cur);
    }
    const school = await School.findOne({ schoolId }).lean();
    const scheme = effectiveScheme(school?.gradingScheme);
    const subjects = [...bySubject.entries()].map(([subject, v]) => {
      const percent = v.maxMarks > 0 ? Math.round((v.marks / v.maxMarks) * 100) : 0;
      const g = gradeForPercent(scheme, percent);
      return { subject, marks: v.marks, maxMarks: v.maxMarks, percent, grade: g.grade, gradePoint: g.gradePoint };
    });
    const graded = subjects.filter((x) => x.maxMarks > 0);
    const gpa = graded.length
      ? Math.round((graded.reduce((sum, x) => sum + x.gradePoint, 0) / graded.length) * 100) / 100
      : 0;
    res.json({ data: { profile: { name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(), className: s.className ?? "", section: s.section ?? "" }, subjects, gpa } });
  } catch (err) {
    next(err);
  }
});

/**
 * The signed-in STUDENT's own full report card for an exam (newest by default).
 * Matched by login email; same server-side rank as the parent view.
 */
router.get("/me/report-card", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    const s = email ? await Student.findOne({ schoolId, email }).lean() : null;
    if (!s) {
      res.json({ data: { exams: [], selected: "", reportCard: null } });
      return;
    }
    const examName = typeof req.query.examName === "string" ? req.query.examName : undefined;
    res.json({ data: await buildReportCard(schoolId, s, examName) });
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
    const email = (req.user!.email || "").trim().toLowerCase();
    // Prefer the hard link (route.driverEmail == the driver's login) and fall back
    // to a name match for routes whose driver was entered as free text.
    const or: Record<string, unknown>[] = [];
    if (email) or.push({ driverEmail: email });
    if (name) or.push({ driver: new RegExp(`^${escapeRx(name)}$`, "i") });
    const routes = or.length ? await BusRoute.find({ schoolId, $or: or }).lean() : [];
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

    // The staff member's OWN attendance (matched by their staff id / employee id).
    // Self-scoped — never another employee's record. Newest first, capped so one
    // call stays cheap (~6 months of school days).
    const match: Record<string, unknown>[] = [{ personId: String(s._id) }];
    if (s.employeeId) match.push({ employeeId: s.employeeId });
    const marks = await StaffAttendance.find({ schoolId, type: "staff", $or: match })
      .sort({ date: -1 })
      .limit(160)
      .lean();

    const tally = { present: 0, absent: 0, late: 0, "half-day": 0, leave: 0 } as Record<string, number>;
    for (const m of marks) tally[m.status] = (tally[m.status] ?? 0) + 1;
    const marked = marks.length;
    // "Present" credit counts late + half-day as showing up (half as a half day).
    const presentCredit = (tally.present ?? 0) + (tally.late ?? 0) + (tally["half-day"] ?? 0) * 0.5;
    const percent = marked > 0 ? Math.round((presentCredit / marked) * 100) : 0;

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
        attendance: {
          marked,
          percent,
          present: tally.present ?? 0,
          absent: tally.absent ?? 0,
          late: tally.late ?? 0,
          halfDay: tally["half-day"] ?? 0,
          leave: tally.leave ?? 0,
          recent: marks.slice(0, 21).map((m) => ({ date: m.date, status: m.status })),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
