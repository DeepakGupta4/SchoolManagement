import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { Attendance, ATTENDANCE_STATUSES } from "./attendance.model.js";
import { Student } from "../students/student.model.js";

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

/** Per-status count accumulators reused by both report aggregations. */
const STATUS_COUNTS = {
  present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
  absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
  late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
  total: { $sum: 1 },
} as const;

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

    const counts = new Map<string, { present: number; absent: number; late: number; total: number }>(
      byStudent.map((c) => [String(c._id), c])
    );

    const students = roster
      .map((s) => {
        const c = counts.get(String(s._id));
        const present = c?.present ?? 0;
        const absent = c?.absent ?? 0;
        const late = c?.late ?? 0;
        const total = c?.total ?? 0;
        return {
          studentId: String(s._id),
          studentName: `${s.firstName} ${s.lastName}`.trim(),
          roll: Number(s.rollNo) || 0,
          present,
          absent,
          late,
          total,
          percent: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
        };
      })
      .sort((a, b) => a.roll - b.roll || a.studentName.localeCompare(b.studentName));

    const daily = byDay.map((d) => ({
      date: String(d._id),
      present: d.present ?? 0,
      absent: d.absent ?? 0,
      late: d.late ?? 0,
      total: d.total ?? 0,
      presentPercent: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
    }));

    res.json({ data: { students, daily } });
  } catch (err) {
    next(err);
  }
});

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
 * attendance records (attended = present + late; percent = round(attended/total
 * * 100)) and bulk-updates the Student docs, so the profile/dashboard/risk views
 * reflect real attendance. Best-effort — callers must ignore any rejection.
 */
async function recomputeAttendancePercent(schoolId: string, studentIds: string[]): Promise<void> {
  const ids = [...new Set(studentIds)].filter((id) => mongoose.isValidObjectId(id));
  if (ids.length === 0) return;

  const agg = await Attendance.aggregate([
    { $match: { schoolId, studentId: { $in: ids } } },
    {
      $group: {
        _id: "$studentId",
        attended: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);
  if (agg.length === 0) return;

  await Student.bulkWrite(
    agg.map((a) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(String(a._id)), schoolId },
        update: {
          $set: { attendancePercent: a.total > 0 ? Math.round((a.attended / a.total) * 100) : 100 },
        },
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

export default router;
