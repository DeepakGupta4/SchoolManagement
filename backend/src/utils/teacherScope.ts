import type { Request } from "express";
import { Teacher } from "../modules/teachers/teacher.model.js";
import { ApiError } from "./ApiError.js";

/**
 * Teacher → class scoping.
 *
 * The JWT carries no class identity (only id/email/role/schoolId), so a teacher's
 * own class(es) are resolved from their Teacher record, matched by login email —
 * the same self-lookup `/api/teachers/me` uses. Two scopes exist, matching the
 * agreed policy:
 *   - the STUDENT ROSTER a teacher may browse = ONLY the class they are class
 *     teacher of (classTeacherOf + classTeacherSection);
 *   - the classes they may take attendance / enter marks for = every class they
 *     teach (classes[]) plus their class-teacher class.
 *
 * All scoping FAILS CLOSED: a teacher with no matching record or no assignment
 * sees nothing, never everything. Non-teacher roles are never restricted here
 * (the functions return null / are no-ops), so office/admin reads are unchanged.
 */

interface TeacherScope {
  isClassTeacher: boolean;
  classTeacherOf: string;
  classTeacherSection: string;
  classes: string[];
}

// Resolved once per request — several guards can run on a single request, and
// this avoids re-querying the Teacher collection each time.
const perRequest = new WeakMap<Request, TeacherScope>();

async function loadScope(req: Request): Promise<TeacherScope | null> {
  if (req.user?.role !== "teacher") return null;
  const cached = perRequest.get(req);
  if (cached) return cached;

  const doc = await Teacher.findOne({ schoolId: req.user.schoolId, email: req.user.email })
    .select("isClassTeacher classTeacherOf classTeacherSection classes")
    .lean();

  const rawClasses = Array.isArray(doc?.classes) ? doc.classes : [];
  const scope: TeacherScope = {
    isClassTeacher: !!doc?.isClassTeacher,
    classTeacherOf: (doc?.classTeacherOf ?? "").trim(),
    classTeacherSection: (doc?.classTeacherSection ?? "").trim(),
    classes: rawClasses.filter((c): c is string => typeof c === "string" && c.length > 0),
  };
  perRequest.set(req, scope);
  return scope;
}

/** Every class a teacher may act on for attendance/marks: taught classes ∪ their class-teacher class. */
function actionableClasses(scope: TeacherScope): string[] {
  const set = new Set<string>(scope.classes);
  if (scope.classTeacherOf) set.add(scope.classTeacherOf);
  return [...set];
}

/**
 * readScope for the Students list/detail. A teacher sees ONLY the students of the
 * class they are class teacher of; a teacher who isn't a class teacher (or whose
 * record is missing) sees none. Returns null for non-teachers (no restriction).
 */
export async function studentRosterScope(req: Request): Promise<Record<string, unknown> | null> {
  const scope = await loadScope(req);
  if (!scope) return null;
  if (scope.isClassTeacher && scope.classTeacherOf) {
    const filter: Record<string, unknown> = { className: scope.classTeacherOf };
    if (scope.classTeacherSection) filter.section = scope.classTeacherSection;
    return filter;
  }
  // Fail closed: match nothing rather than the whole school.
  return { _id: { $in: [] } };
}

/**
 * Guards a class-keyed endpoint (attendance/marks): throws 403 if the caller is a
 * teacher and `className` isn't one they teach or are class teacher of. No-op for
 * office/admin roles, so their access is unchanged.
 */
export async function assertTeacherMayAccessClass(req: Request, className: string): Promise<void> {
  const scope = await loadScope(req);
  if (!scope) return;
  if (!className || !actionableClasses(scope).includes(className)) {
    throw ApiError.forbidden("You can only access the classes you teach.");
  }
}
