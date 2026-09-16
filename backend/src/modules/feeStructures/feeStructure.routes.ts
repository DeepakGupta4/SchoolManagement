import { z } from "zod";
import { FeeStructure } from "./feeStructure.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const feeStructureSchema = z.object({
  code: z.string().min(1),
  class: z.string().min(1),
  tuition: z.coerce.number<number>().min(0).default(0),
  transport: z.coerce.number<number>().min(0).default(0),
  lab: z.coerce.number<number>().min(0).default(0),
  library: z.coerce.number<number>().min(0).default(0),
  sports: z.coerce.number<number>().min(0).default(0),
  misc: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: FeeStructure,
  createSchema: feeStructureSchema,
  searchFields: ["code", "class"],
});
