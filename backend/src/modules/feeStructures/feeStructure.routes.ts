import { z } from "zod";
import { FeeStructure } from "./feeStructure.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const feeHead = z.object({
  name: z.string().min(1, "Head name is required"),
  amount: z.coerce.number<number>().min(0).default(0),
  frequency: z.enum(["monthly", "one-time", "per-exam"]).default("one-time"),
});

const feeStructureSchema = z
  .object({
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
  })
  .refine(
    (s) => {
      const names = s.heads.map((h) => h.name.trim().toLowerCase());
      return new Set(names).size === names.length;
    },
    { message: "Each fee head name must be unique within a structure.", path: ["heads"] }
  );

export default createCrudRouter({
  model: FeeStructure,
  createSchema: feeStructureSchema,
  searchFields: ["code", "class"],
  writeRoles: ["super_admin", "school_admin", "principal", "accountant"],
});
