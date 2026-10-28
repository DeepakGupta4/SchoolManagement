import { Router, type RequestHandler, type Request } from "express";
import type { Model, HydratedDocument } from "mongoose";
import { z, type ZodType } from "zod";
import { requireAuth, requireRole, requireRoleStrict } from "../middleware/auth.js";
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
  /**
   * Body schema for update. Defaults to `createSchema.partial()`. Pass this
   * explicitly when `createSchema` carries a `.refine()`/`.superRefine()` — zod v4
   * forbids `.partial()` on a refined object schema, so the default would throw at
   * router-build time (boot crash). Supply a pre-built partial (optionally re-refined).
   */
  updateSchema?: ZodType;
  /** Fields a `?search=` term is matched against, case-insensitively. */
  searchFields: (keyof T & string)[];
  /** Query params that filter on an exact field match, e.g. ["className", "status"]. */
  filterFields?: (keyof T & string)[];
  /** Overrides who may create/update/delete. */
  writeRoles?: UserRole[];
  /**
   * Overrides who may hard-DELETE specifically. Defaults to `writeRoles`. Set it
   * narrower (e.g. ["super_admin"]) for records whose deletion destroys historical
   * or financial data — for those, a status change is usually the right action.
   */
  deleteRoles?: UserRole[];
  /** When set, restricts who may READ (list + get). Default: any authenticated user. */
  readRoles?: UserRole[];
  /**
   * A mandatory extra read filter, merged into EVERY list and get-by-id query
   * AFTER schoolId and the client's own filters (so it always wins and can't be
   * widened via query params). Return null/undefined for no restriction. Used to
   * scope a role's reads — e.g. a teacher limited to their own class — without a
   * per-module custom route.
   */
  readScope?: (req: Request) => Promise<Record<string, unknown> | null | undefined>;
  /**
   * The write-side analogue of `readScope`. Returns fields that are FORCED onto the
   * body on create and update, and (on update) also constrain WHICH record may be
   * touched — so a role-scoped writer (e.g. a class teacher) can only create/edit
   * records inside their own slice and can't move one out of it. Return
   * null/undefined for no restriction (office/admin). May also sanitise req.body.
   */
  writeScope?: (req: Request) => Promise<Record<string, unknown> | null | undefined>;
  /** Mongoose projection applied to the LIST query only (e.g. "-fileDataUrl" to
   *  keep big inline blobs out of list responses; the detail route still returns
   *  the full record). */
  listSelect?: string;
  /** Default sort. Newest first unless a module wants otherwise. */
  sort?: Record<string, 1 | -1>;
  /** Extra routes mounted before the generic ones (so they can shadow `/:id`). */
  extend?: (router: Router) => void;
  /** Fires a school notification after a successful create, if provided. */
  notifyOnCreate?: (
    doc: HydratedDocument<T>
  ) => { type: string; title: string; body?: string; link?: string; className?: string; roles?: string[] };
  /**
   * Server-stamped fields at insert time (reference numbers, codes, gate
   * passes). Receives the current per-school record count as a sequence.
   * Anything the client sends still wins over generated values.
   */
  generate?: (seq: number) => Record<string, unknown>;
  /** Side effect after a successful create (e.g. downstream record creation). */
  afterCreate?: (doc: HydratedDocument<T>, req: Request) => void | Promise<void>;
  /** Side effect after a successful update. */
  afterUpdate?: (doc: HydratedDocument<T>, req: Request) => void | Promise<void>;
  /** Side effect after a successful delete (e.g. cascade cleanup). */
  afterDelete?: (doc: HydratedDocument<T>, req: Request) => void | Promise<void>;
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

/**
 * The partial (PATCH-style) form of a create schema. zod v4 throws when `.partial()`
 * is called on an object schema that carries a refinement, so fall back to the full
 * schema rather than crash at router-build time — a module that needs real partial
 * updates for a refined schema passes `updateSchema` instead.
 */
function partialOf(schema: ZodType): ZodType {
  try {
    return (schema as unknown as z.ZodObject).partial();
  } catch {
    return schema;
  }
}

export function createCrudRouter<T>(options: CrudOptions<T>): Router {
  const {
    model,
    createSchema,
    searchFields,
    filterFields = [],
    writeRoles = DEFAULT_WRITE_ROLES,
    deleteRoles,
    readRoles,
    readScope,
    writeScope,
    listSelect,
    sort = { createdAt: -1 },
    extend,
    notifyOnCreate,
    generate,
    afterCreate,
    afterUpdate,
    afterDelete,
  } = options;

  // Update validates a partial of the create shape; a module may override it (needed
  // when createSchema is refined — see partialOf / the updateSchema option).
  const updateSchema = options.updateSchema ?? partialOf(createSchema);

  // A stable `_id` tiebreaker appended to the sort so OFFSET pagination can't
  // reorder records that share the primary sort value (e.g. the same createdAt)
  // between separate page requests — which would otherwise duplicate or skip a
  // record sitting on a page boundary. Harmless for single-page queries.
  const pagedSort: Record<string, 1 | -1> = "_id" in sort ? sort : { ...sort, _id: -1 };

  const router = Router();
  const canWrite: RequestHandler = requireRole(...writeRoles);
  // Hard delete can be locked down tighter than create/update.
  // An explicit (narrowed) deleteRoles is a deliberate safeguard — e.g. only
  // super_admin may hard-delete a student (cascades fees/payments/docs). Use the
  // STRICT gate so a custom role can't inherit that delete from a module "edit"
  // grant; it must literally be one of the listed roles. Without an explicit
  // deleteRoles, delete follows write (a custom "edit" may delete ordinary rows).
  const canDelete: RequestHandler = deleteRoles ? requireRoleStrict(...deleteRoles) : canWrite;
  // Reads are open to any authenticated user unless the module restricts them
  // (e.g. teacher records carry salary/PII — office/HR roles only).
  const canRead: RequestHandler = readRoles ? requireRole(...readRoles) : (_req, _res, next) => next();

  // Everything below requires a valid token.
  router.use(requireAuth);

  extend?.(router);

  router.get("/", canRead, validate(listQuerySchema, "query"), async (req, res, next) => {
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

      // A role-based mandatory scope (e.g. a teacher limited to their own class),
      // applied LAST so it overrides any client-chosen filter and can't be widened.
      if (readScope) {
        const scope = await readScope(req);
        if (scope) Object.assign(filter, scope);
      }

      const listQuery = model
        .find(filter)
        .sort(pagedSort)
        .skip((page - 1) * limit)
        .limit(limit);
      if (listSelect) listQuery.select(listSelect);
      const [docs, total] = await Promise.all([listQuery, model.countDocuments(filter)]);

      res.json({
        data: docs.map((d) => toPublic(d as HydratedDocument<T>)),
        meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", canRead, async (req, res, next) => {
    try {
      // The same role scope guards detail reads, so a teacher can't fetch an
      // out-of-class record by guessing its id (it simply reads as not found).
      const scope = readScope ? await readScope(req) : null;
      const doc = await model.findOne({
        _id: req.params.id,
        schoolId: req.user!.schoolId,
        ...(scope ?? {}),
      });
      if (!doc) throw ApiError.notFound("Record not found.");
      res.json({ data: toPublic(doc as HydratedDocument<T>) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", canWrite, validate(createSchema), async (req, res, next) => {
    try {
      // A scoped writer (e.g. class teacher) has its slice fields forced onto the body.
      if (writeScope) {
        const s = await writeScope(req);
        if (s) Object.assign(req.body, s);
      }
      const generated = generate
        ? generate(await model.countDocuments({ schoolId: req.user!.schoolId }))
        : {};
      const doc = await model.create({ ...generated, ...req.body, schoolId: req.user!.schoolId });
      if (notifyOnCreate) {
        void notifySchool(req.user!.schoolId, notifyOnCreate(doc as HydratedDocument<T>));
      }
      if (afterCreate) await afterCreate(doc as HydratedDocument<T>, req);
      res.status(201).json({ data: toPublic(doc as HydratedDocument<T>) });
    } catch (err) {
      next(err);
    }
  });

  router.put(
    "/:id",
    canWrite,
    // Partial so a client can PATCH-style update a couple of fields.
    validate(updateSchema),
    async (req, res, next) => {
      try {
        // A scoped writer can only touch a record already inside its slice, and
        // can't move it out (slice fields are forced into both filter and body).
        const filter: Record<string, unknown> = { _id: req.params.id, schoolId: req.user!.schoolId };
        if (writeScope) {
          const s = await writeScope(req);
          if (s) {
            Object.assign(filter, s);
            Object.assign(req.body, s);
          }
        }
        const doc = await model.findOneAndUpdate(filter, req.body, {
          new: true,
          runValidators: true,
        });
        if (!doc) throw ApiError.notFound("Record not found.");
        if (afterUpdate) await afterUpdate(doc as HydratedDocument<T>, req);
        res.json({ data: toPublic(doc as HydratedDocument<T>) });
      } catch (err) {
        next(err);
      }
    }
  );

  router.delete("/:id", canDelete, async (req, res, next) => {
    try {
      const doc = await model.findOneAndDelete({
        _id: req.params.id,
        schoolId: req.user!.schoolId,
      });
      if (!doc) throw ApiError.notFound("Record not found.");
      if (afterDelete) await afterDelete(doc as HydratedDocument<T>, req);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
