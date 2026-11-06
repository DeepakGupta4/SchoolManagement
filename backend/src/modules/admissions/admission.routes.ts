import { z } from "zod";
import type { HydratedDocument } from "mongoose";
import { Application, type ApplicationAttrs } from "./admission.model.js";
import { Student, type StudentDoc } from "../students/student.model.js";
import { notifySchool } from "../notifications/notification.model.js";
import { FeeAccount, CURRENT_SESSION } from "../fees/fee.model.js";
import {
  deriveGrossHeads,
  applyTransportHead,
  netHeadsFor,
  toAccountHeads,
  matchStructure,
  scholarshipConcessionFor,
} from "../fees/feeProvisioning.js";
import { BusRoute } from "../busRoutes/busRoute.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";

/** The admissions pipeline, in order — shared by the funnel analytics. */
const STAGE_ORDER = ["enquiry", "applied", "interview", "approved", "rejected"];

const admissionSchema = z.object({
  applicationNo: z.string().min(1),
  name: z.string().min(1),
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  dateOfBirth: z.string().default(""),
  gender: z.string().default(""),
  classApplied: z.string().default(""),
  bloodGroup: z.string().default(""),
  category: z.string().default(""),
  previousSchool: z.string().default(""),
  parent: z.string().default(""),
  relation: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  source: z.string().default(""),
  appliedOn: z.string().default(""),
  stage: z.string().default("enquiry"),
  score: z.coerce.number<number>().min(0).default(0),
  notes: z.string().default(""),
  nextFollowUpDate: z.string().default(""),
  followUps: z
    .array(z.object({ date: z.string().default(""), note: z.string().default(""), by: z.string().default("") }))
    .optional(),

  // Detailed admission-form fields (all optional) — mirror the student form and
  // carry into the enrolled student on approval.
  avatar: z.string().default(""),
  medicalNotes: z.string().default(""),
  fatherName: z.string().default(""),
  fatherOccupation: z.string().default(""),
  fatherPhone: z.string().default(""),
  fatherEmail: z.string().default(""),
  motherName: z.string().default(""),
  motherOccupation: z.string().default(""),
  motherPhone: z.string().default(""),
  motherEmail: z.string().default(""),
  nationality: z.string().default(""),
  religion: z.string().default(""),
  motherTongue: z.string().default(""),
  aadhaarNo: z.string().default(""),
  placeOfBirth: z.string().default(""),
  annualIncome: z.string().default(""),
  correspondenceAddress: z.string().default(""),
  emergencyContact: z.string().default(""),
  previousClass: z.string().default(""),
  previousBoard: z.string().default(""),
  tcNumber: z.string().default(""),
  previousResult: z.string().default(""),
  transportRequired: z.boolean().default(false),
  pickupPoint: z.string().default(""),
  transportRouteCode: z.string().default(""),

  // Optional fee concession (₹) to apply when the applicant is enrolled — a
  // staff-ward / sibling / merit discount agreed at admission. Billed off this
  // year's fees only (the account's arrears, if any, are never reduced).
  feeConcession: z.coerce.number<number>().min(0).default(0),
});

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

/**
 * Opens a fee account for a newly-enrolled student, billed from their class fee
 * structure (net of active scholarships and an optional admission concession) —
 * so an approved applicant starts with their dues already set, instead of the
 * office having to open the account by hand afterwards. Idempotent and
 * best-effort: if an account already exists it does nothing, and with no fee
 * structure for the class (nothing to bill) it leaves the student provisional
 * (billed live if a structure is added later), exactly like any accountless
 * student. The concession is applied to the current fees only.
 */
async function openFeeAccountForEnrolled(
  schoolId: string,
  student: StudentDoc,
  manualConcession: number
) {
  const existing = await FeeAccount.findOne({
    schoolId,
    studentId: student._id,
    session: CURRENT_SESSION,
  });
  if (existing) return;

  const structure = await matchStructure(schoolId, student.className);
  const route =
    student.transportRequired && student.transportRouteCode
      ? await BusRoute.findOne({ schoolId, code: student.transportRouteCode })
      : null;
  const gross = applyTransportHead(deriveGrossHeads(structure), {
    transportRequired: student.transportRequired,
    routeFee: route?.fee ?? null,
    monthsPerYear: structure?.monthsPerYear,
  });
  const scholarshipTotal = await scholarshipConcessionFor(schoolId, String(student._id));
  const manual = Math.max(0, Math.round(manualConcession));
  const net = netHeadsFor(gross, manual + scholarshipTotal);
  if (net.heads.length === 0) return; // no structure to bill from — stay provisional

  await FeeAccount.create({
    schoolId,
    studentId: student._id,
    admissionNo: student.admissionNo,
    name: `${student.firstName} ${student.lastName}`.trim(),
    className: student.className,
    section: student.section,
    rollNo: student.rollNo,
    guardian: student.guardian.name,
    guardianPhone: student.guardian.phone,
    session: CURRENT_SESSION,
    heads: toAccountHeads(net.heads),
    concession: net.concession,
    manualConcession: manual,
    lateFee: 0,
  });
}

/**
 * When an application reaches the "approved" stage, enrol the applicant as a
 * real student. Idempotent: if a student with the same admission number already
 * exists for the school, it does nothing (so re-saving an approved application
 * never creates duplicates). Best-effort — failures are logged, not thrown, so
 * the application update itself always succeeds.
 */
async function enrolIfApproved(doc: HydratedDocument<ApplicationAttrs>, schoolId: string) {
  try {
    if (doc.stage !== "approved") return;
    const admissionNo = doc.applicationNo;
    if (!admissionNo) return;

    const existing = await Student.findOne({ schoolId, admissionNo });
    if (existing) return;

    const parts = String(doc.name).trim().split(/\s+/);
    const firstName = (doc.firstName || "").trim() || parts[0] || "Student";
    const lastName = (doc.lastName || "").trim() || parts.slice(1).join(" ") || firstName;

    const gender = ["male", "female", "other"].includes(String(doc.gender).toLowerCase())
      ? (String(doc.gender).toLowerCase() as "male" | "female" | "other")
      : "other";

    const className = doc.classApplied || "";
    const section = "A";

    // Next roll number within the class + section.
    const inClass = await Student.find({ schoolId, className, section });
    const maxRoll = inClass.reduce((m, s) => {
      const n = parseInt(String(s.rollNo).replace(/\D/g, ""), 10);
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 0);

    const emailValid = /\S+@\S+\.\S+/.test(doc.email || "");
    const email = emailValid
      ? String(doc.email).toLowerCase()
      : `${firstName}.${lastName}.${Date.now()}@school.local`.toLowerCase().replace(/\s+/g, "");

    const bloodGroup = BLOOD_GROUPS.includes(doc.bloodGroup) ? doc.bloodGroup : null;

    const created = await Student.create({
      schoolId,
      admissionNo,
      rollNo: String(maxRoll + 1),
      firstName,
      lastName,
      email,
      phone: doc.phone || "",
      dateOfBirth: doc.dateOfBirth || "",
      gender,
      bloodGroup,
      className,
      section,
      status: "active",
      admissionDate: doc.appliedOn || new Date().toISOString().slice(0, 10),
      address: doc.address || "",
      guardian: {
        name: doc.parent || "Guardian",
        relation: doc.relation || "Guardian",
        phone: doc.phone || "",
        email: emailValid ? String(doc.email).toLowerCase() : "",
      },
      // Carry the detailed admission-form fields through to the student record.
      medicalNotes: doc.medicalNotes || "",
      avatar: doc.avatar || "",
      fatherName: doc.fatherName || "",
      fatherOccupation: doc.fatherOccupation || "",
      fatherPhone: doc.fatherPhone || "",
      fatherEmail: doc.fatherEmail || "",
      motherName: doc.motherName || "",
      motherOccupation: doc.motherOccupation || "",
      motherPhone: doc.motherPhone || "",
      motherEmail: doc.motherEmail || "",
      nationality: doc.nationality || "",
      religion: doc.religion || "",
      category: doc.category || "",
      motherTongue: doc.motherTongue || "",
      aadhaarNo: doc.aadhaarNo || "",
      placeOfBirth: doc.placeOfBirth || "",
      annualIncome: doc.annualIncome || "",
      correspondenceAddress: doc.correspondenceAddress || "",
      emergencyContact: doc.emergencyContact || "",
      previousSchool: doc.previousSchool || "",
      previousClass: doc.previousClass || "",
      previousBoard: doc.previousBoard || "",
      tcNumber: doc.tcNumber || "",
      previousResult: doc.previousResult || "",
      transportRequired: Boolean(doc.transportRequired),
      pickupPoint: doc.pickupPoint || "",
      transportRouteCode: doc.transportRouteCode || "",
    });

    // Open their fee account from the class structure (+ any admission concession)
    // so dues are set the moment they're enrolled. Best-effort — a failure here
    // must never undo the enrolment.
    try {
      await openFeeAccountForEnrolled(schoolId, created as StudentDoc, Number(doc.feeConcession) || 0);
    } catch (feeErr) {
      console.error("Fee account for enrolled student failed:", feeErr);
    }

    void notifySchool(schoolId, {
      type: "student",
      title: "Applicant enrolled as student",
      body: `${firstName} ${lastName} · ${className}-${section}`,
      link: "/students",
      className,
      roles: ["super_admin", "school_admin", "principal", "teacher"],
    });
  } catch (err) {
    console.error("Admission enrolment failed:", err);
  }
}

export default createCrudRouter({
  model: Application,
  createSchema: admissionSchema,
  searchFields: ["name", "applicationNo", "parent", "phone"],
  filterFields: ["stage", "classApplied", "source"],
  readRoles: ["super_admin", "school_admin", "principal"],
  afterCreate: (doc, req) => enrolIfApproved(doc, req.user!.schoolId),
  afterUpdate: (doc, req) => enrolIfApproved(doc, req.user!.schoolId),
  extend: (router) => {
    // Lead-funnel analytics: accurate server-side counts per stage, by source,
    // conversion rate and how many follow-ups are due — the CRM view.
    router.get(
      "/funnel",
      requireRole("super_admin", "school_admin", "principal"),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const today = new Date().toISOString().slice(0, 10);
          const apps = await Application.find({ schoolId })
            .select("stage source nextFollowUpDate")
            .lean();

          const byStage: Record<string, number> = {};
          const bySource: Record<string, number> = {};
          let dueFollowUps = 0;
          for (const a of apps) {
            const st = a.stage || "enquiry";
            byStage[st] = (byStage[st] ?? 0) + 1;
            const src = (a.source || "").trim() || "Unknown";
            bySource[src] = (bySource[src] ?? 0) + 1;
            if (
              a.nextFollowUpDate &&
              a.nextFollowUpDate <= today &&
              st !== "approved" &&
              st !== "rejected"
            ) {
              dueFollowUps++;
            }
          }
          const total = apps.length;
          const converted = byStage.approved ?? 0;
          res.json({
            data: {
              total,
              converted,
              rejected: byStage.rejected ?? 0,
              dueFollowUps,
              conversionRate: total ? Math.round((converted / total) * 100) : 0,
              byStage: STAGE_ORDER.map((stage) => ({ stage, count: byStage[stage] ?? 0 })),
              bySource: Object.entries(bySource)
                .map(([source, count]) => ({ source, count }))
                .sort((a, b) => b.count - a.count),
            },
          });
        } catch (err) {
          next(err);
        }
      }
    );
  },
});
