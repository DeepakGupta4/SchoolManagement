import { Teacher } from "../teachers/teacher.model.js";
import { StaffMember } from "../staff/staff.model.js";
import { User, type UserRole } from "../auth/user.model.js";

/** Friendly label for a login role, used when the person isn't a teacher/staff record. */
const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  school_admin: "Admin",
  principal: "Principal",
  teacher: "Teacher",
  accountant: "Accountant",
  librarian: "Librarian",
  parent: "Parent",
  student: "Student",
  driver: "Driver",
  staff: "Staff",
};

export interface LeaveIdentity {
  name: string;
  role: string;
  dept: string;
}

/**
 * Resolves a person's display name / role / department for a leave request from
 * their email alone, trying the richest source first: their Teacher record, then
 * their non-teaching Staff record, then their login account for a real name +
 * a friendly role label. This is why an admin/principal (who has no Teacher row)
 * files leave under their real name instead of just their email.
 *
 * Identity is derived from the school's own records — never trusted from a client.
 * Shared by the self-service `POST /mine` route and the boot-time backfill that
 * repairs old rows filed before this resolution existed.
 */
export async function resolveLeaveIdentity(schoolId: string, email: string): Promise<LeaveIdentity> {
  const e = (email || "").trim().toLowerCase();

  // 1) Teaching staff — richest record (first/last name + department).
  const teacher = e ? await Teacher.findOne({ schoolId, email: e }) : null;
  if (teacher) {
    const name = `${teacher.firstName} ${teacher.lastName}`.trim();
    return { name: name || e || "Me", role: "Teacher", dept: teacher.department ?? "" };
  }

  // 2) Non-teaching staff (accountant, librarian, admin assistant, …).
  const staff = e ? await StaffMember.findOne({ schoolId, email: e }) : null;
  if (staff) {
    return { name: staff.name || e || "Me", role: staff.role || "Staff", dept: staff.dept ?? "" };
  }

  // 3) Fall back to the login account for a real name + a friendly role label
  //    (covers admins/principals who aren't in the Teacher or Staff collection).
  const account = e ? await User.findOne({ schoolId, email: e }) : null;
  if (account) {
    return { name: account.name || e || "Me", role: ROLE_LABELS[account.role] ?? "", dept: "" };
  }

  return { name: e || "Me", role: "", dept: "" };
}
