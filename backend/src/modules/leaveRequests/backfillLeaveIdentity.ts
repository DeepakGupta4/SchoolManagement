import { LeaveRequest } from "./leaveRequest.model.js";
import { resolveLeaveIdentity } from "./identity.js";

/**
 * Repairs leave requests whose applicant `name` was stored as just an email /
 * blank / "Me" — rows filed before identity resolution existed (when a non-teacher
 * admin/principal self-filed, the old code fell back to their email). For each such
 * row it re-resolves name/role/department from the school's records (Teacher →
 * Staff → User) and saves only when it can improve the name.
 *
 * Idempotent and safe to run on every boot: once a row has a real name it no longer
 * matches, and an unresolvable row (applicant not in any collection) is left as-is.
 * Any failure is swallowed by the caller so it can never block startup.
 */
export async function backfillLeaveIdentity(): Promise<void> {
  // Only rows that actually have an email to resolve from; the rest can't be fixed.
  const rows = await LeaveRequest.find({ email: { $nin: ["", null] } });
  let fixed = 0;

  for (const r of rows) {
    const current = (r.name || "").trim();
    const email = (r.email || "").trim().toLowerCase();
    const looksBad = !current || current === "Me" || current.toLowerCase() === email;
    if (!looksBad) continue;

    const { name, role, dept } = await resolveLeaveIdentity(r.schoolId, email);
    // Only write when we genuinely improved it (avoid churn on still-unresolvable rows).
    if (name && name.toLowerCase() !== email && name !== "Me" && name !== current) {
      r.name = name;
      if (!(r.role || "").trim() && role) r.role = role;
      if (!(r.dept || "").trim() && dept) r.dept = dept;
      await r.save();
      fixed++;
    }
  }

  if (fixed > 0) console.log(`Backfilled identity on ${fixed} leave request(s).`);
}
