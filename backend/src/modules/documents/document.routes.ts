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
  fileName: z.string().default(""),
  mimeType: z.string().default(""),
  dataUrl: z.string().min(1, "File contents are required"),
  size: z.coerce.number<number>().min(0).default(0),
});

/** GET /api/documents?ownerType=&ownerId= — list a person's documents. */
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

/** POST /api/documents — upload a document (base64 data URL). */
router.post(
  "/",
  requireRole("super_admin", "school_admin", "principal", "teacher"),
  validate(createSchema),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const body = req.body as z.infer<typeof createSchema>;
      const doc = await StoredDocument.create({ ...body, schoolId });
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
