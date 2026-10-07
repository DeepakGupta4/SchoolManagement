import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { Student } from "../students/student.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Teacher } from "../teachers/teacher.model.js";
import { Application } from "../admissions/admission.model.js";
import { Exam } from "../exams/exam.model.js";
import { Holiday } from "../holidays/holiday.model.js";
import { SchoolClass } from "../classes/class.model.js";
import { Subject } from "../subjects/subject.model.js";
import { Timetable } from "../timetable/timetable.model.js";

/**
 * Admin dashboard insights — one call, computed entirely server-side.
 *
 * Every figure the Principal's "Overview" board shows is an aggregate over the
 * whole school, not a truncated page. Doing it here (counts + aggregations)
 * instead of shipping every student/account to the browser is what keeps the
 * numbers CORRECT at any school size and the payload tiny. The frontend adds
 * only the fee summary (its own endpoint) and the school profile.
 *
 * The caller passes its LOCAL `today` (yyyy-mm-dd). Everything date-relative —
 * upcoming exams, birthdays-this-month, the open/closed check — is evaluated
 * against the client's calendar day, so an IST user is never a day off the way
 * a server-UTC "today" would be.
 */
const router = Router();
router.use(requireAuth);
// School-wide aggregates are staff-only — a parent/student must never pull them.
router.use(requireRole("super_admin", "school_admin", "principal", "accountant", "teacher"));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const insightsQuery = z.object({
  today: z.string().regex(ISO_DATE, "today must be YYYY-MM-DD").optional(),
});

/**
 * Per-student risk score, mirroring the frontend `assessStudent` formula
 * (lib/insights.ts) so the top-of-list candidates selected here match what the
 * client ranks. Performance only counts once a student actually HAS marks
 * (performancePercent > 0), so a brand-new student is never "failing at 0%".
 * The client re-scores the returned candidates to render the exact reason, so a
 * generous limit (20) guarantees the true top 5 are always in the set.
 */
const riskScoreStage = {
  $addFields: {
    _risk: {
      $min: [
        100,
        {
          $add: [
            {
              $switch: {
                branches: [
                  { case: { $lt: ["$attendancePercent", 60] }, then: 45 },
                  { case: { $lt: ["$attendancePercent", 75] }, then: 28 },
                  { case: { $lt: ["$attendancePercent", 85] }, then: 12 },
                ],
                default: 0,
              },
            },
            {
              $switch: {
                branches: [
                  { case: { $and: [{ $gt: ["$performancePercent", 0] }, { $lt: ["$performancePercent", 40] }] }, then: 35 },
                  { case: { $and: [{ $gte: ["$performancePercent", 40] }, { $lt: ["$performancePercent", 55] }] }, then: 20 },
                  { case: { $and: [{ $gte: ["$performancePercent", 55] }, { $lt: ["$performancePercent", 65] }] }, then: 8 },
                ],
                default: 0,
              },
            },
            {
              $switch: {
                branches: [
                  { case: { $gt: ["$feeDue", 8000] }, then: 20 },
                  { case: { $gt: ["$feeDue", 0] }, then: 8 },
                ],
                default: 0,
              },
            },
          ],
        },
      ],
    },
  },
};

router.get("/insights", validate(insightsQuery, "query"), async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const { today: todayParam } = parsed<z.infer<typeof insightsQuery>>(req, "query");
    // The client's local day; fall back to the server day only if omitted.
    const today = todayParam ?? new Date().toISOString().slice(0, 10);
    const mm = today.slice(5, 7);

    const [
      students,
      teachers,
      classes,
      subjects,
      timetableEntries,
      teachersOnLeave,
      admissionsWaiting,
      birthdaysThisMonth,
      upcomingExams,
      nextExamDoc,
      bandAgg,
      attentionAgg,
      holidayToday,
      attendanceTaken,
    ] = await Promise.all([
      Student.countDocuments({ schoolId }),
      Teacher.countDocuments({ schoolId }),
      SchoolClass.countDocuments({ schoolId }),
      Subject.countDocuments({ schoolId }),
      Timetable.countDocuments({ schoolId }),
      Teacher.countDocuments({ schoolId, status: "on-leave" }),
      Application.countDocuments({ schoolId, stage: { $nin: ["approved", "rejected"] } }),
      Student.countDocuments({
        schoolId,
        status: "active",
        dateOfBirth: new RegExp(`^\\d{4}-${mm}-\\d{2}$`),
      }),
      Exam.countDocuments({ schoolId, status: { $ne: "cancelled" }, date: { $gt: today } }),
      Exam.findOne({ schoolId, status: { $ne: "cancelled" }, date: { $gt: today } })
        .sort({ date: 1 })
        .select("name date")
        .lean(),
      Student.aggregate([
        { $match: { schoolId, status: "active" } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            b1: { $sum: { $cond: [{ $lt: ["$attendancePercent", 75] }, 1, 0] } },
            b2: { $sum: { $cond: [{ $and: [{ $gte: ["$attendancePercent", 75] }, { $lt: ["$attendancePercent", 85] }] }, 1, 0] } },
            b3: { $sum: { $cond: [{ $and: [{ $gte: ["$attendancePercent", 85] }, { $lt: ["$attendancePercent", 95] }] }, 1, 0] } },
            b4: { $sum: { $cond: [{ $gte: ["$attendancePercent", 95] }, 1, 0] } },
          },
        },
      ]),
      Student.aggregate([
        { $match: { schoolId, status: "active" } },
        riskScoreStage,
        { $match: { _risk: { $gte: 30 } } },
        { $sort: { _risk: -1, _id: 1 } },
        { $limit: 20 },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            className: 1,
            section: 1,
            attendancePercent: 1,
            performancePercent: 1,
            feeDue: 1,
          },
        },
      ]),
      Holiday.findOne({ schoolId, date: today }).select("name").lean(),
      // Has attendance EVER been marked? Student.attendancePercent defaults to
      // 100, so without this every brand-new student would sit in the "95%+"
      // band and the chart would imply perfect attendance was measured.
      Attendance.countDocuments({ schoolId }).then((n) => n > 0),
    ]);

    const b = (bandAgg[0] ?? { total: 0, b1: 0, b2: 0, b3: 0, b4: 0 }) as {
      total: number;
      b1: number;
      b2: number;
      b3: number;
      b4: number;
    };

    // Open unless it's a Sunday or a holiday is recorded for this calendar day.
    // getUTCDay on a Z-anchored midnight gives the weekday of the date string
    // itself, independent of the server's own timezone.
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    const isSunday = weekday === 0;
    const open = !isSunday && !holidayToday;
    const closedReason = isSunday ? "Sunday" : holidayToday ? (holidayToday as { name: string }).name : null;

    res.json({
      data: {
        counts: {
          students,
          teachers,
          classes,
          subjects,
          timetableEntries,
          activeStudents: b.total,
        },
        teachersOnLeave,
        admissionsWaiting,
        birthdaysThisMonth,
        lowAttendance: b.b1,
        upcomingExams,
        nextExam: nextExamDoc
          ? { name: (nextExamDoc as { name: string }).name, date: (nextExamDoc as { date: string }).date }
          : null,
        // Empty until attendance is actually marked — an empty set renders the
        // chart's "no data yet" state instead of a misleading all-95%+ bar.
        attendanceBands: attendanceTaken
          ? [
              { band: "<75%", students: b.b1 },
              { band: "75–85%", students: b.b2 },
              { band: "85–95%", students: b.b3 },
              { band: "95%+", students: b.b4 },
            ]
          : [],
        attention: (attentionAgg as Array<{ _id: unknown; [k: string]: unknown }>).map((s) => ({
          id: String(s._id),
          firstName: s.firstName ?? "",
          lastName: s.lastName ?? "",
          className: s.className ?? "",
          section: s.section ?? "",
          attendancePercent: Number(s.attendancePercent) || 0,
          performancePercent: Number(s.performancePercent) || 0,
          feeDue: Number(s.feeDue) || 0,
        })),
        schoolOpen: { open, reason: closedReason },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
