import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { requireRole } from "../../middleware/auth.js";
import { StoredDocument, toPublicDocument } from "./document.model.js";

/**
 * Documents API — files attached to a student or teacher.
 * Tenant-scoped via req.user.schoolId. Mounted behind the tenant guard.
 */
const router = Router();

const createSchema = z.object({
  ownerType: z.enum(["student", "teacher", "staff"]),
  ownerId: z.string().min(1),
  ownerName: z.string().default(""),
  title: z.string().min(1, "A document title is required"),
  docType: z.string().default(""),
  verified: z.boolean().default(false),
  fileName: z.string().default(""),
  mimeType: z.string().default(""),
  dataUrl: z.string().min(1, "File contents are required"),
  size: z.coerce.number<number>().min(0).default(0),
});

const patchSchema = z.object({ verified: z.boolean() });

/**
 * GET /api/documents/summary?ownerType=student — a LIGHT list (no file contents)
 * for the document-vault overview: which slots each owner has filled and whether
 * they're verified. Avoids shipping every base64 file just to render status dots.
 */
router.get("/summary", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const { ownerType } = req.query as { ownerType?: string };
    const filter: Record<string, unknown> = { schoolId };
    if (ownerType) filter.ownerType = ownerType;
    const docs = await StoredDocument.find(filter)
      .select("ownerId title docType verified createdAt")
      .sort({ createdAt: -1 });
    res.json({
      data: docs.map((d) => ({
        id: String(d._id),
        ownerId: d.ownerId,
        title: d.title,
        docType: d.docType,
        verified: d.verified,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/documents?ownerType=&ownerId= — list a person's documents (with files). */
router.get("/", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const { ownerType, ownerId } = req.query as { ownerType?: string; ownerId?: string };
    const filter: Record<string, unknown> = { schoolId };
    if (ownerType) filter.ownerType = ownerType;
    if (ownerId) filter.ownerId = ownerId;
    const docs = await StoredDocument.find(filter).sort({ createdAt: -1 });
    res.json({ data: docs.map(toPublicDocument) });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/documents/:id — verify / un-verify a document. */
router.patch(
  "/:id",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  validate(patchSchema),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const { verified } = req.body as z.infer<typeof patchSchema>;
      const doc = await StoredDocument.findOneAndUpdate(
        { _id: req.params.id, schoolId },
        { $set: { verified } },
        { new: true }
      );
      if (!doc) return res.status(404).json({ error: "Document not found" });
      res.json({ data: toPublicDocument(doc) });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/documents — upload a document (base64 data URL). */
router.post(
  "/",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  validate(createSchema),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const body = req.body as z.infer<typeof createSchema>;
      // The office (admin/principal) uploading a document IS the verification
      // authority, so their uploads are verified on arrival. Anyone else's (e.g. a
      // teacher's) stays pending for the office to confirm. The office can still
      // un-verify later from the vault.
      const OFFICE_ROLES = ["super_admin", "school_admin", "principal"];
      const verified = OFFICE_ROLES.includes(req.user!.role) ? true : body.verified;
      const doc = await StoredDocument.create({ ...body, verified, schoolId });
      res.status(201).json({ data: toPublicDocument(doc) });
    } catch (err) {
      next(err);
    }
  }
);

/** DELETE /api/documents/:id — remove a document. */
router.delete(
  "/:id",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const result = await StoredDocument.deleteOne({ _id: req.params.id, schoolId });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Document not found" });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
