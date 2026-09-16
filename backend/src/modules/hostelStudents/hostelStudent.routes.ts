import { z } from "zod";
import { HostelStudent } from "./hostelStudent.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const hostelStudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  class: z.string().default(""),
  hostel: z.string().default(""),
  room: z.string().default(""),
  type: z.string().default(""),
  fees: z.string().default("Pending"),
  joinDate: z.string().default(""),
  contact: z.string().default(""),
});

export default createCrudRouter({
  model: HostelStudent,
  createSchema: hostelStudentSchema,
  searchFields: ["name", "studentId", "room"],
  filterFields: ["type", "hostel", "fees"],
});
