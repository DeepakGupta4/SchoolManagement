import { z } from "zod";
import type { HydratedDocument } from "mongoose";
import { TransferRequest, type TransferRequestAttrs } from "./transfer.model.js";
import { Student } from "../students/student.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const transferSchema = z.object({
  tcNo: z.string().default("—"),
  name: z.string().min(1),
  studentId: z.string().default(""),
  className: z.string().default(""),
  type: z.string().default(""),
  reason: z.string().default(""),
  requestedOn: z.string().default(""),
  issuedOn: z.string().default("—"),
  status: z.string().default("pending"),
  dues: z.coerce.number<number>().min(0).default(0),
});

/**
 * When a request reaches "issued", finalize it so the transfer is actually in
 * effect, not just a standalone record:
 *  - auto-assign a TC number and issue date if the operator left them blank, and
 *  - reflect the exit on the real student record (transfer -> transferred,
 *    withdrawal -> inactive), so the student leaves active rosters, promotions,
 *    attendance and fee runs.
 * Best-effort and idempotent: re-saving an already-issued request is a no-op, and
 * a failure to touch the student is logged, never thrown (the request still saves).
 */
async function applyOnIssue(doc: HydratedDocument<TransferRequestAttrs>, schoolId: string) {
  try {
    if (doc.status !== "issued") return;

    let changed = false;
    if (!doc.tcNo || doc.tcNo === "—") {
      const issued = await TransferRequest.countDocuments({ schoolId, tcNo: { $nin: ["", "—"] } });
      doc.tcNo = `TC-${new Date().getFullYear()}-${String(issued + 1).padStart(4, "0")}`;
      changed = true;
    }
    if (!doc.issuedOn || doc.issuedOn === "—") {
      doc.issuedOn = new Date().toISOString().slice(0, 10);
      changed = true;
    }
    if (changed) await doc.save();

    // Link is by admission number (the form stores the student's admissionNo in
    // studentId). A free-typed id that matches no student simply updates nothing.
    if (doc.studentId) {
      const status = doc.type === "withdrawal" ? "inactive" : "transferred";
      await Student.updateOne(
        { schoolId, admissionNo: doc.studentId, status: "active" },
        { $set: { status } }
      ).catch(() => {});
    }
  } catch (err) {
    console.error("Transfer issue side-effects failed:", err);
  }
}

export default createCrudRouter({
  model: TransferRequest,
  createSchema: transferSchema,
  searchFields: ["name", "studentId", "tcNo", "reason"],
  filterFields: ["status", "type"],
  afterCreate: (doc, req) => applyOnIssue(doc, req.user!.schoolId),
  afterUpdate: (doc, req) => applyOnIssue(doc, req.user!.schoolId),
});
