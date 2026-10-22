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
 *
 * `studentRosterScope` limits student reads to the classes a teacher teaches
 * (classes[] plus their class-teacher class), honouring a specific class they
 * asked for when it is one of theirs. The Students page passes the teacher's
 * class-teacher class so it shows only that; the attendance/marks screens pass
 * whichever class is being worked on — both stay within the teacher's own set.
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

/** Every class a teacher may act on: taught classes ∪ their class-teacher class (only when actually a class teacher). */
function actionableClasses(scope: TeacherScope): string[] {
  const set = new Set<string>(scope.classes);
  // Guard on the flag too, so a stale classTeacherOf without isClassTeacher
  // can't grant access the roster scope would deny (keeps the two consistent).
  if (scope.isClassTeacher && scope.classTeacherOf) set.add(scope.classTeacherOf);
  return [...set];
}

/**
 * readScope for the Students list/detail. A teacher only ever sees students of a
 * class they teach (classes[] ∪ their class-teacher class). If they ask for a
 * specific class that is one of theirs, it's honoured (so the Students page can
 * lock to their class-teacher class and the attendance/marks rosters can load any
 * class they teach); any other request is narrowed to their whole set. A teacher
 * with no classes sees none. Returns null for non-teachers (no restriction).
 */
export async function studentRosterScope(req: Request): Promise<Record<string, unknown> | null> {
  const scope = await loadScope(req);
  if (!scope) return null;
  const allowed = actionableClasses(scope);
  // Fail closed: match nothing rather than the whole school.
  if (allowed.length === 0) return { _id: { $in: [] } };

  const requested = typeof req.query.className === "string" ? req.query.className.trim() : "";
  if (requested && allowed.includes(requested)) {
    const filter: Record<string, unknown> = { className: requested };
    const section = typeof req.query.section === "string" ? req.query.section.trim() : "";
    if (section) filter.section = section;
    return filter;
  }
  return { className: { $in: allowed } };
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

/**
 * The class names a teacher may see (taught ∪ their class-teacher class). Returns
 * [] for a non-teacher or a teacher with no classes. Used to scope their
 * notification feed to class-relevant events.
 */
export async function teacherClassesFor(req: Request): Promise<string[]> {
  const scope = await loadScope(req);
  return scope ? actionableClasses(scope) : [];
}
