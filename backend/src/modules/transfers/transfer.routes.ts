import { z } from "zod";
import { TransferRequest } from "./transfer.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const transferSchema = z.object({
  tcNo: z.string().default("—"),
  name: z.string().min(1),
  studentId: z.string().default(""),
  className: z.string().default(""),
  type: z.string().default(""),
  reason: z.string().default(""),
  requestedOn: z.string().default(""),
  issuedOn: z.string().default("—"),
  status: z.string().default("pending"),
  dues: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: TransferRequest,
  createSchema: transferSchema,
  searchFields: ["name", "studentId", "tcNo", "reason"],
  filterFields: ["status", "type"],
});
