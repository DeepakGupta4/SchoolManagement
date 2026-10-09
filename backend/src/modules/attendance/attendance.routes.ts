import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { Attendance, ATTENDANCE_STATUSES } from "./attendance.model.js";
import { Student } from "../students/student.model.js";
import { sendEmail, isEmailConfigured } from "../../utils/email.js";
import { notifySchool } from "../notifications/notification.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";

const router = Router();
router.use(requireAuth);

const listQuery = z.object({
  className: z.string().min(1),
  section: z.string().min(1),
  date: z.string().min(1),
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const summaryQuery = z.object({
  className: z.string().min(1),
  section: z.string().min(1),
  from: z.string().regex(ISO_DATE, "from must be YYYY-MM-DD"),
  to: z.string().regex(ISO_DATE, "to must be YYYY-MM-DD"),
});

/** Per-status count accumulators reused by every report aggregation. */
const STATUS_COUNTS = {
  present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
  absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
  late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
  halfDay: { $sum: { $cond: [{ $eq: ["$status", "half-day"] }, 1, 0] } },
  leave: { $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] } },
  total: { $sum: 1 },
} as const;

/**
 * Fair attendance %: present and late count as attended, a half-day counts for
 * half, and LEAVE is excused — excluded from BOTH the numerator and denominator.
 * Returns 0 when there are no gradeable days (denominator 0). Single source of
 * truth for the per-student percent (summary + stored attendancePercent).
 */
function attendancePercent(c: {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
}): number {
  const attended = c.present + c.late + 0.5 * c.halfDay;
  const denom = c.present + c.absent + c.late + c.halfDay;
  return denom > 0 ? Math.round((attended / denom) * 100) : 0;
}

/**
 * Attendance register for a class + section over a date range. Returns every
 * currently-active student (left-joined with their records in the range, so a
 * student with no marks still appears with zeros) plus a per-day roll-up for
 * charts. Scoped to the caller's school.
 */
router.get("/summary", validate(summaryQuery, "query"), async (req, res, next) => {
  try {
    const { className, section, from, to } = parsed<z.infer<typeof summaryQuery>>(req, "query");
    const schoolId = req.user!.schoolId;
    const match = { schoolId, className, section, date: { $gte: from, $lte: to } };

    // One roster read + two aggregations (grouped by student and by date) — no
    // per-student query, so this stays O(1) round-trips regardless of class size.
    const [roster, byStudent, byDay] = await Promise.all([
      Student.find({ schoolId, className, section, status: "active" })
        .select("firstName lastName rollNo")
        .lean(),
      Attendance.aggregate([{ $match: match }, { $group: { _id: "$studentId", ...STATUS_COUNTS } }]),
      Attendance.aggregate([
        { $match: match },
        { $group: { _id: "$date", ...STATUS_COUNTS } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const counts = new Map<
      string,
      { present: number; absent: number; late: number; halfDay: number; leave: number; total: number }
    >(byStudent.map((c) => [String(c._id), c]));

    const students = roster
      .map((s) => {
        const c = counts.get(String(s._id));
        const present = c?.present ?? 0;
        const absent = c?.absent ?? 0;
        const late = c?.late ?? 0;
        const halfDay = c?.halfDay ?? 0;
        const leave = c?.leave ?? 0;
        const total = c?.total ?? 0;
        return {
          studentId: String(s._id),
          studentName: `${s.firstName} ${s.lastName}`.trim(),
          roll: Number(s.rollNo) || 0,
          present,
          absent,
          late,
          halfDay,
          leave,
          total,
          percent: attendancePercent({ present, absent, late, halfDay }),
        };
      })
      .sort((a, b) => a.roll - b.roll || a.studentName.localeCompare(b.studentName));

    const daily = byDay.map((d) => ({
      date: String(d._id),
      present: d.present ?? 0,
      absent: d.absent ?? 0,
      late: d.late ?? 0,
      halfDay: d.halfDay ?? 0,
      leave: d.leave ?? 0,
      total: d.total ?? 0,
      presentPercent: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
    }));

    res.json({ data: { students, daily } });
  } catch (err) {
    next(err);
  }
});

const studentHistoryQuery = z.object({
  from: z.string().regex(ISO_DATE, "from must be YYYY-MM-DD").optional(),
  to: z.string().regex(ISO_DATE, "to must be YYYY-MM-DD").optional(),
});

/**
 * One student's own attendance history — the record behind the "View attendance"
 * action on the students list. Returns the student's identity, an all-status tally
 * with the fair percent, and every mark (newest first) within the optional
 * [from, to] window. Scoped to the caller's school; staff-only (parents/students
 * see their own child's figure through the portal, not this endpoint).
 */
router.get(
  "/student/:id",
  requireRole("super_admin", "school_admin", "principal", "teacher", "accountant"),
  validate(studentHistoryQuery, "query"),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const id = String(req.params.id);
      if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest("Invalid student id.");

      const { from, to } = parsed<z.infer<typeof studentHistoryQuery>>(req, "query");
      const dateRange: Record<string, string> = {};
      if (from) dateRange.$gte = from;
      if (to) dateRange.$lte = to;
      const match = { schoolId, studentId: id, ...(from || to ? { date: dateRange } : {}) };

      const [student, rows] = await Promise.all([
        Student.findOne({ schoolId, _id: id }).select("firstName lastName className section rollNo").lean(),
        Attendance.find(match).select("date status").sort({ date: -1 }).lean(),
      ]);
      if (!student) throw ApiError.notFound("Student not found.");

      const counts = { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, total: 0 };
      for (const r of rows) {
        counts.total++;
        if (r.status === "present") counts.present++;
        else if (r.status === "absent") counts.absent++;
        else if (r.status === "late") counts.late++;
        else if (r.status === "half-day") counts.halfDay++;
        else if (r.status === "leave") counts.leave++;
      }

      res.json({
        data: {
          student: {
            id: String(student._id),
            name: `${student.firstName} ${student.lastName}`.trim(),
            className: student.className,
            section: student.section,
            rollNo: student.rollNo,
          },
          summary: { ...counts, percent: attendancePercent(counts) },
          records: rows.map((r) => ({ date: r.date, status: r.status })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/** Saved roll-call for one class + section on one date. */
router.get("/", validate(listQuery, "query"), async (req, res, next) => {
  try {
    const { className, section, date } = parsed<z.infer<typeof listQuery>>(req, "query");
    const rows = await Attendance.find({
      schoolId: req.user!.schoolId,
      className,
      section,
      date,
    });
    res.json({
      data: rows.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        roll: r.roll,
        status: r.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const saveBody = z.object({
  className: z.string().min(1),
  section: z.string().min(1),
  date: z.string().min(1),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        studentName: z.string().default(""),
        roll: z.coerce.number<number>().default(0),
        status: z.enum(ATTENDANCE_STATUSES),
      })
    )
    .min(1, "Nothing to save"),
});

/**
 * Recomputes each given student's stored `attendancePercent` from ALL their
 * attendance records using the fair `attendancePercent` formula (present + late
 * + 0.5*half-day over present + absent + late + half-day; leave excused) and
 * bulk-updates the Student docs, so the profile/dashboard/risk views reflect
 * real attendance. Best-effort — callers must ignore any rejection.
 */
async function recomputeAttendancePercent(schoolId: string, studentIds: string[]): Promise<void> {
  const ids = [...new Set(studentIds)].filter((id) => mongoose.isValidObjectId(id));
  if (ids.length === 0) return;

  const agg = await Attendance.aggregate([
    { $match: { schoolId, studentId: { $in: ids } } },
    { $group: { _id: "$studentId", ...STATUS_COUNTS } },
  ]);
  if (agg.length === 0) return;

  await Student.bulkWrite(
    agg.map((a) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(String(a._id)), schoolId },
        update: { $set: { attendancePercent: attendancePercent(a) } },
      },
    }))
  );
}

/** Upserts the whole roll-call for a class-day. Teachers and up may mark. */
router.post(
  "/",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  validate(saveBody),
  async (req, res, next) => {
    try {
      const { className, section, date, records } = req.body as z.infer<typeof saveBody>;
      const schoolId = req.user!.schoolId;

      await Attendance.bulkWrite(
        records.map((r) => ({
          updateOne: {
            filter: { schoolId, className, section, date, studentId: r.studentId },
            update: { $set: { ...r, schoolId, className, section, date } },
            upsert: true,
          },
        }))
      );

      // Keep each saved student's stored attendance % in step with reality.
      // Best-effort: a failure here must never fail the save response.
      try {
        await recomputeAttendancePercent(
          schoolId,
          records.map((r) => r.studentId)
        );
      } catch (err) {
        console.error("Attendance %, recompute failed:", err);
      }

      res.json({ data: { saved: records.length } });
    } catch (err) {
      next(err);
    }
  }
);

const notifyBody = z.object({
  className: z.string().min(1),
  section: z.string().min(1),
  date: z.string().regex(ISO_DATE, "date must be YYYY-MM-DD"),
});

/**
 * Explicitly alert the parents/guardians of every student saved as ABSENT on a
 * class-day. Best-effort and HONEST: it emails whoever has an address on file
 * (guardian.email → fatherEmail → motherEmail → student email), records one
 * in-app notification summarising the run, and reports exactly how many were
 * emailed vs. had no contact. Never auto-triggered on save — only this endpoint
 * sends, and a mail failure never fails the request.
 */
router.post(
  "/notify-absentees",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  validate(notifyBody),
  async (req, res, next) => {
    try {
      const { className, section, date } = req.body as z.infer<typeof notifyBody>;
      const schoolId = req.user!.schoolId;

      const absentees = await Attendance.find({
        schoolId,
        className,
        section,
        date,
        status: "absent",
      }).lean();

      const emailConfigured = isEmailConfigured();
      const total = absentees.length;
      let emailed = 0;
      let noContact = 0;

      // One roster read for contact details — no per-student query.
      const ids = absentees.map((a) => String(a.studentId)).filter((id) => mongoose.isValidObjectId(id));
      const students = ids.length ? await Student.find({ schoolId, _id: { $in: ids } }).lean() : [];
      const byId = new Map(students.map((s) => [String(s._id), s]));

      for (const rec of absentees) {
        const s = byId.get(String(rec.studentId));
        const to = (s?.guardian?.email || s?.fatherEmail || s?.motherEmail || s?.email || "").trim();
        if (!to) {
          noContact++;
          continue;
        }
        // No mailer configured: we already counted contactability, so don't
        // attempt (and console-log) a send we know can't be delivered.
        if (!emailConfigured) continue;

        const name = rec.studentName || (s ? `${s.firstName} ${s.lastName}`.trim() : "your child");
        const result = await sendEmail({
          to,
          subject: `${env.SOFTWARE_NAME}: ${name} was marked absent on ${date}`,
          text:
            `Dear Parent/Guardian,\n\n` +
            `This is to inform you that ${name} (Class ${className} ${section}) was marked ABSENT on ${date}.\n\n` +
            `If you have already informed the school, or believe this is a mistake, please contact the school office.\n\n` +
            `Regards,\n${env.SOFTWARE_NAME}`,
          html:
            `<p>Dear Parent/Guardian,</p>` +
            `<p>This is to inform you that <strong>${name}</strong> (Class ${className} ${section}) was marked ` +
            `<strong>ABSENT</strong> on <strong>${date}</strong>.</p>` +
            `<p>If you have already informed the school, or believe this is a mistake, please contact the school office.</p>` +
            `<p>Regards,<br/>${env.SOFTWARE_NAME}</p>`,
        });
        if (result.delivered) emailed++;
      }

      // One in-app summary of the alert run (best-effort; never throws).
      await notifySchool(schoolId, {
        type: "attendance.absentees",
        title: `Absence alerts — ${className} ${section} · ${date}`,
        body: emailConfigured
          ? `${total} absentee(s): ${emailed} parent(s) emailed` +
            (noContact > 0 ? `, ${noContact} without an email on file.` : ".")
          : `${total} absentee(s). Email is not configured on the server, so no messages were sent.`,
        link: "/attendance",
      });

      res.json({ data: { total, emailed, noContact, emailConfigured } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
