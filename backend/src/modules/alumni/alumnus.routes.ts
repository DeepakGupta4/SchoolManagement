import { z } from "zod";
import { Alumnus } from "./alumnus.model.js";
import { Student } from "../students/student.model.js";
import { requireRole } from "../../middleware/auth.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const PHONE = /^\d{10}$/;

const alumnusSchema = z.object({
  studentId: z.string().default(""),
  name: z.string().min(1),
  batch: z.string().default(""),
  stream: z.string().default(""),
  occupation: z.string().default(""),
  employer: z.string().default(""),
  city: z.string().default(""),
  // Email/phone are optional but must be well-formed when present (parity with
  // the frontend, which requires them on the form).
  email: z.union([z.email(), z.literal("")]).default(""),
  phone: z.string().default("").refine((v) => !v || PHONE.test(v), "Enter a valid 10-digit number"),
  mentor: z.boolean().default(false),
  interests: z.array(z.string()).default([]),
});

export default createCrudRouter({
  model: Alumnus,
  createSchema: alumnusSchema,
  searchFields: ["name", "occupation", "employer", "email"],
  filterFields: ["batch", "stream", "city"],
  // Bring graduated students (Student.status === "alumni") into the directory, so
  // the alumni list isn't a manual-only island disconnected from real leavers.
  extend: (router) => {
    router.post(
      "/import-graduates",
      requireRole("super_admin", "school_admin", "principal"),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const grads = await Student.find({ schoolId, status: "alumni" }).select(
            "firstName lastName email phone admissionNo lastPromotedSession"
          );

          // Dedupe against the directory by linked student id AND by email, so a
          // re-run (or a manually-added match) never creates duplicates.
          const existing = await Alumnus.find({ schoolId }).select("studentId email");
          const seenIds = new Set(existing.map((a) => a.studentId).filter(Boolean));
          const seenEmails = new Set(
            existing.map((a) => String(a.email || "").toLowerCase()).filter(Boolean)
          );

          const thisYear = String(new Date().getFullYear());
          const docs: Record<string, unknown>[] = [];
          for (const s of grads) {
            const adm = String(s.admissionNo || "");
            const email = String(s.email || "").toLowerCase();
            if ((adm && seenIds.has(adm)) || (email && seenEmails.has(email))) continue;
            if (adm) seenIds.add(adm);
            if (email) seenEmails.add(email);
            // Batch = the passing-out year, from the promotion session if known.
            const batch = s.lastPromotedSession ? String(s.lastPromotedSession).slice(0, 4) : thisYear;
            docs.push({
              schoolId,
              studentId: adm,
              name: `${s.firstName} ${s.lastName}`.trim(),
              batch,
              stream: "",
              occupation: "",
              employer: "",
              city: "",
              email,
              phone: s.phone || "",
              mentor: false,
              interests: [],
            });
          }

          if (docs.length > 0) {
            // ordered:false so one odd row can't abort the rest; the unique email
            // index still guards against a racing duplicate.
            await Alumnus.insertMany(docs, { ordered: false }).catch(() => {});
          }

          res.json({ data: { imported: docs.length, skipped: grads.length - docs.length } });
        } catch (err) {
          next(err);
        }
      }
    );
  },
});
