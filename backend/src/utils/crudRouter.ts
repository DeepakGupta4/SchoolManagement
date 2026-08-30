import { Router, type RequestHandler } from "express";
import type { Model, HydratedDocument } from "mongoose";
import { z, type ZodType } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate, parsed } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import type { UserRole } from "../modules/auth/user.model.js";
import { notifySchool } from "../modules/notifications/notification.model.js";

/**
 * Builds the standard list/get/create/update/delete routes for a resource.
 *
 * Every module needs the same things — tenant scoping, pagination, a safe
 * search, role checks, `_id` → `id` mapping — and getting any of them subtly
 * wrong per module is how data leaks between schools. Centralising it means
 * each module only declares what is genuinely specific to it.
 */

/** Roles allowed to modify data. Read access is granted to any signed-in user. */
const DEFAULT_WRITE_ROLES: UserRole[] = ["super_admin", "school_admin", "principal"];

export interface CrudOptions<T> {
  model: Model<T>;
  /** Body schema for create. Update uses `.partial()` of the same shape. */
  createSchema: ZodType;
  /** Fields a `?search=` term is matched against, case-insensitively. */
  searchFields: (keyof T & string)[];
  /** Query params that filter on an exact field match, e.g. ["className", "status"]. */
  filterFields?: (keyof T & string)[];
  /** Overrides who may create/update/delete. */
  writeRoles?: UserRole[];
  /** Default sort. Newest first unless a module wants otherwise. */
  sort?: Record<string, 1 | -1>;
  /** Extra routes mounted before the generic ones (so they can shadow `/:id`). */
  extend?: (router: Router) => void;
  /** Fires a school notification after a successful create, if provided. */
  notifyOnCreate?: (doc: HydratedDocument<T>) => { type: string; title: string; body?: string; link?: string };
}

/** Strips internals and exposes `id` — the shape every client expects. */
export function toPublic<T>(doc: HydratedDocument<T>) {
  const { _id, schoolId, createdAt, updatedAt, __v, ...rest } = doc.toObject() as Record<
    string,
    unknown
  >;
  void schoolId;
  void createdAt;
  void updatedAt;
  void __v;
  return { ...rest, id: String(_id) };
}

const listQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number<number>().min(1).default(1),
  limit: z.coerce.number<number>().min(1).max(500).default(200),
});

export function createCrudRouter<T>(options: CrudOptions<T>): Router {
  const {
    model,
    createSchema,
    searchFields,
    filterFields = [],
    writeRoles = DEFAULT_WRITE_ROLES,
    sort = { createdAt: -1 },
    extend,
    notifyOnCreate,
  } = options;

  const router = Router();
  const canWrite: RequestHandler = requireRole(...writeRoles);

  // Everything below requires a valid token.
  router.use(requireAuth);

  extend?.(router);

  router.get("/", validate(listQuerySchema, "query"), async (req, res, next) => {
    try {
      const { search, page, limit } = parsed<z.infer<typeof listQuerySchema>>(req, "query");

      // Every query is scoped to the caller's school — this is what stops one
      // tenant from ever reading another's records.
      const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };

      for (const field of filterFields) {
        const value = req.query[field];
        if (typeof value === "string" && value !== "" && value !== "All") {
          filter[field] = value;
        }
      }

      if (search?.trim() && searchFields.length > 0) {
        // Escaped so a user typing "(" can't produce an invalid-regex 500.
        const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(safe, "i");
        filter.$or = searchFields.map((field) => ({ [field]: rx }));
      }

      const [docs, total] = await Promise.all([
        model
          .find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit),
        model.countDocuments(filter),
      ]);

      res.json({
        data: docs.map((d) => toPublic(d as HydratedDocument<T>)),
        meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const doc = await model.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
      if (!doc) throw ApiError.notFound("Record not found.");
      res.json({ data: toPublic(doc as HydratedDocument<T>) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", canWrite, validate(createSchema), async (req, res, next) => {
    try {
      const doc = await model.create({ ...req.body, schoolId: req.user!.schoolId });
      if (notifyOnCreate) {
        void notifySchool(req.user!.schoolId, notifyOnCreate(doc as HydratedDocument<T>));
      }
      res.status(201).json({ data: toPublic(doc as HydratedDocument<T>) });
    } catch (err) {
      next(err);
    }
  });

  router.put(
    "/:id",
    canWrite,
    // Partial so a client can PATCH-style update a couple of fields.
    validate((createSchema as unknown as z.ZodObject).partial()),
    async (req, res, next) => {
      try {
        const doc = await model.findOneAndUpdate(
          { _id: req.params.id, schoolId: req.user!.schoolId },
          req.body,
          { new: true, runValidators: true }
        );
        if (!doc) throw ApiError.notFound("Record not found.");
        res.json({ data: toPublic(doc as HydratedDocument<T>) });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete("/:id", canWrite, async (req, res, next) => {
    try {
      const doc = await model.findOneAndDelete({
        _id: req.params.id,
        schoolId: req.user!.schoolId,
      });
      if (!doc) throw ApiError.notFound("Record not found.");
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
