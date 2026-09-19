import { z } from "zod";
import type { HydratedDocument } from "mongoose";
import { Application, type ApplicationAttrs } from "./admission.model.js";
import { Student } from "../students/student.model.js";
import { notifySchool } from "../notifications/notification.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const admissionSchema = z.object({
  applicationNo: z.string().min(1),
  name: z.string().min(1),
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
});

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

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
    const firstName = parts[0] || "Student";
    const lastName = parts.slice(1).join(" ") || firstName;

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

    await Student.create({
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
    });

    void notifySchool(schoolId, {
      type: "student",
      title: "Applicant enrolled as student",
      body: `${firstName} ${lastName} · ${className}-${section}`,
      link: "/students",
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
  afterCreate: (doc, req) => enrolIfApproved(doc, req.user!.schoolId),
  afterUpdate: (doc, req) => enrolIfApproved(doc, req.user!.schoolId),
});
