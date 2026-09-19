import { Attendance } from "./attendance.model.js";
import { Student } from "../students/student.model.js";
import { Holiday } from "../holidays/holiday.model.js";

/** Local YYYY-MM-DD for a date (server clock, not UTC). */
function localIso(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The hour after which unmarked students are considered absent for the day. */
const CUTOFF_HOUR = 11;

/**
 * Marks the day's absentees for every school. For each school, once the
 * server's local time reaches the cutoff (11:00) and today is not a holiday,
 * any ACTIVE student who has no attendance record for today is recorded as
 * "absent". Existing records (present/late/absent) are never touched, so this
 * is idempotent and safe to run repeatedly. Best-effort: a failure for one
 * school is logged and does not stop the others.
 */
export async function runAutoAbsentForAllSchools(now: Date = new Date()): Promise<{
  schools: number;
  marked: number;
}> {
  const result = { schools: 0, marked: 0 };

  // Before the cutoff there is nothing to do — students still have time to be
  // marked present/late by a teacher.
  if (now.getHours() < CUTOFF_HOUR) return result;

  const today = localIso(now);

  let schoolIds: string[] = [];
  try {
    schoolIds = (await Student.distinct("schoolId")) as string[];
  } catch (err) {
    console.error("Auto-absent: could not list schools:", err);
    return result;
  }

  for (const schoolId of schoolIds) {
    try {
      // A closed day is never marked absent.
      const holiday = await Holiday.findOne({ schoolId, date: today });
      if (holiday) continue;

      const students = await Student.find({ schoolId, status: "active" });
      if (students.length === 0) continue;

      // Students who already have a mark today keep it (present/late/absent).
      const existing = await Attendance.find({ schoolId, date: today }).select("studentId");
      const marked = new Set(existing.map((a) => a.studentId));

      const toInsert = students
        .filter((s) => !marked.has(String(s._id)))
        .map((s) => ({
          schoolId,
          className: s.className,
          section: s.section,
          date: today,
          studentId: String(s._id),
          studentName: `${s.firstName} ${s.lastName}`.trim(),
          roll: Number(s.rollNo) || 0,
          status: "absent" as const,
        }));

      if (toInsert.length === 0) continue;

      // Idempotent bulk upsert — the unique index guards against duplicates if
      // a record slipped in between the read and the write.
      await Attendance.bulkWrite(
        toInsert.map((rec) => ({
          updateOne: {
            filter: {
              schoolId: rec.schoolId,
              className: rec.className,
              section: rec.section,
              date: rec.date,
              studentId: rec.studentId,
            },
            update: { $setOnInsert: rec },
            upsert: true,
          },
        }))
      );

      result.schools++;
      result.marked += toInsert.length;
    } catch (err) {
      console.error(`Auto-absent failed for school ${schoolId}:`, err);
    }
  }

  return result;
}
