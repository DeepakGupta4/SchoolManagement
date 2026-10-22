import { z } from "zod";
import { FeeStructure } from "./feeStructure.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const feeHead = z.object({
  name: z.string().min(1, "Head name is required"),
  amount: z.coerce.number<number>().min(0).default(0),
  frequency: z.enum(["monthly", "one-time", "per-exam"]).default("one-time"),
});

// Base object WITHOUT the refinement, so the update route can be a `.partial()` of
// it. zod v4 forbids `.partial()` on a refined schema (it throws at router-build
// time — a boot crash), so the refinement is layered on separately below.
const feeStructureBase = z.object({
  code: z.string().min(1),
  class: z.string().min(1),
  heads: z.array(feeHead).default([]),
  monthsPerYear: z.coerce.number<number>().min(1).max(12).default(12),
  examsPerYear: z.coerce.number<number>().min(0).max(20).default(3),
  // Legacy fixed columns stay optional so old edit payloads don't break.
  tuition: z.coerce.number<number>().min(0).optional(),
  transport: z.coerce.number<number>().min(0).optional(),
  lab: z.coerce.number<number>().min(0).optional(),
  library: z.coerce.number<number>().min(0).optional(),
  sports: z.coerce.number<number>().min(0).optional(),
  misc: z.coerce.number<number>().min(0).optional(),
});

/** Head names must be unique within a structure (case-insensitive). */
function headsAreUnique(heads: { name: string }[] | undefined): boolean {
  const names = (heads ?? []).map((h) => h.name.trim().toLowerCase());
  return new Set(names).size === names.length;
}
const UNIQUE_HEADS = {
  message: "Each fee head name must be unique within a structure.",
  path: ["heads"] as (string | number)[],
};

// Create validates the full shape; update validates a partial of it. Both re-check
// head-name uniqueness. The update schema is built here explicitly (not via the
// router's default `.partial()`) precisely because a refined schema can't be partialed.
const feeStructureSchema = feeStructureBase.refine((s) => headsAreUnique(s.heads), UNIQUE_HEADS);
const feeStructureUpdateSchema = feeStructureBase
  .partial()
  .refine((s) => headsAreUnique(s.heads), UNIQUE_HEADS);

export default createCrudRouter({
  model: FeeStructure,
  createSchema: feeStructureSchema,
  updateSchema: feeStructureUpdateSchema,
  searchFields: ["code", "class"],
  writeRoles: ["super_admin", "school_admin", "principal", "accountant"],
});
