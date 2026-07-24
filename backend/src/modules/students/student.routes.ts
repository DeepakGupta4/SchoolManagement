import { Router } from "express";
import { z } from "zod";
import { Student, toPublicStudent } from "./student.model.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();

const PHONE = /^[6-9]\d{9}$/;

const guardianSchema = z.object({
  name: z.string().min(2, "Guardian name is required"),
  relation: z.string().min(1, "Relation is required"),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  email: z.union([z.email(), z.literal("")]).optional(),
  occupation: z.string().optional(),
});

const studentBody = z.object({
  admissionNo: z.string().min(1),
  rollNo: z.string().min(1),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).nullable().optional(),
  className: z.string().min(1),
  section: z.string().min(1),
  status: z.enum(["active", "inactive", "alumni", "transferred"]).default("active"),
  admissionDate: z.string().min(1),
  address: z.string().min(5),
  guardian: guardianSchema,
  avatar: z.string().optional(),
  medicalNotes: z.string().optional(),
});

const listQuery = z.object({
  search: z.string().optional(),
  className: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number<number>().min(1).default(1),
  limit: z.coerce.number<number>().min(1).max(200).default(50),
});

/** Everyone signed in may read; only these roles may change records. */
const canWrite = requireRole("super_admin", "school_admin", "principal");

router.use(requireAuth);

router.get("/", validate(listQuery, "query"), async (req, res, next) => {
  try {
    const { search, className, status, page, limit } = parsed<z.infer<typeof listQuery>>(req, "query");

    const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };
    if (className) filter.className = className;
    if (status) filter.status = status;

    if (search?.trim()) {
      // Escaped so a user typing "(" can't throw an invalid-regex error.
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [
        { firstName: rx },
        { lastName: rx },
        { admissionNo: rx },
        { email: rx },
        { rollNo: rx },
      ];
    }

    const [docs, total] = await Promise.all([
      Student.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Student.countDocuments(filter),
    ]);

    res.json({
      data: docs.map(toPublicStudent),
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const doc = await Student.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!doc) throw ApiError.notFound("Student not found.");
    res.json({ data: toPublicStudent(doc) });
  } catch (err) {
    next(err);
  }
});

router.post("/", canWrite, validate(studentBody), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof studentBody>;
    const doc = await Student.create({ ...body, schoolId: req.user!.schoolId });
    res.status(201).json({ data: toPublicStudent(doc) });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", canWrite, validate(studentBody.partial()), async (req, res, next) => {
  try {
    const doc = await Student.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) throw ApiError.notFound("Student not found.");
    res.json({ data: toPublicStudent(doc) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", canWrite, async (req, res, next) => {
  try {
    const doc = await Student.findOneAndDelete({
      _id: req.params.id,
      schoolId: req.user!.schoolId,
    });
    if (!doc) throw ApiError.notFound("Student not found.");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
