import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { AuditLog } from "../../utils/auditLog.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole("super_admin", "school_admin", "principal"));

const listQuery = z.object({
  search: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number<number>().min(1).default(1),
  limit: z.coerce.number<number>().min(1).max(100).default(50),
});

router.get("/", validate(listQuery, "query"), async (req, res, next) => {
  try {
    const { search, action, page, limit } = parsed<z.infer<typeof listQuery>>(req, "query");

    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    if (search?.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [{ performedBy: rx }, { action: rx }, { ip: rx }];
    }

    const [docs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      data: docs.map((d) => ({
        id: String(d._id),
        action: d.action,
        performedBy: d.performedBy,
        targetSchoolId: d.targetSchoolId ?? null,
        meta: d.meta ?? {},
        ip: d.ip ?? null,
        createdAt: d.createdAt,
      })),
      meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
