import mongoose from "mongoose";
import { Student } from "../modules/students/student.model.js";

/**
 * Attendance and marks are keyed by `studentId`, while the caller is authorized by
 * the client-supplied `className`. Without a membership check, a caller could tag a
 * student from ANOTHER class into a register for a class they do have access to —
 * overwriting that student's real record and their server-owned metrics
 * (attendance %, performance %). This resolves which of the supplied ids are ACTIVE
 * students of exactly {schoolId, className, section} — the same roster the marking
 * screen is built from — so callers save only those and skip the rest (a student
 * moved/deactivated mid-session is dropped, not a hard failure). Malformed ids just
 * resolve to non-members. Applies to every role (a data-integrity invariant, not
 * only teacher scoping).
 */
export async function activeClassSectionMembers(
  schoolId: string,
  className: string,
  section: string,
  studentIds: string[]
): Promise<Set<string>> {
  const unique = [...new Set(studentIds.map((id) => String(id)))].filter((id) =>
    mongoose.isValidObjectId(id)
  );
  if (unique.length === 0) return new Set();
  const members = await Student.find({
    schoolId,
    className,
    section,
    status: "active",
    _id: { $in: unique },
  })
    .select("_id")
    .lean();
  return new Set(members.map((m) => String(m._id)));
}
