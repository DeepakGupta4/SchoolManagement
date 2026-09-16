import { z } from "zod";
import { BusRoute } from "./busRoute.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const busRouteSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  stops: z.array(z.string()).default([]),
  students: z.coerce.number<number>().min(0).default(0),
  driver: z.string().default(""),
  bus: z.string().default(""),
  capacity: z.coerce.number<number>().min(0).default(40),
  departure: z.string().default(""),
  arrival: z.string().default(""),
  status: z.string().default("active"),
  distance: z.string().default(""),
});

export default createCrudRouter({
  model: BusRoute,
  createSchema: busRouteSchema,
  searchFields: ["name", "code", "driver", "bus"],
  filterFields: ["status"],
});
