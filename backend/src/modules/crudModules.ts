import type { Router } from "express";
import classRoutes from "./classes/class.routes.js";
import examRoutes from "./exams/exam.routes.js";
import examScheduleRoutes from "./examSchedule/examSchedule.routes.js";
import assignmentRoutes from "./assignments/assignment.routes.js";
import onlineClassRoutes from "./onlineClasses/onlineClass.routes.js";
import studyMaterialRoutes from "./studyMaterial/studyMaterial.routes.js";

/**
 * Tenant CRUD modules mounted uniformly under the subscription guard. Each is a
 * `createCrudRouter` router. Adding a module is a single line here — app.ts
 * iterates and mounts them all with the same auth + subscription gating.
 */
export const crudModules: { path: string; router: Router }[] = [
  { path: "/api/classes", router: classRoutes },
  { path: "/api/exams", router: examRoutes },
  { path: "/api/exam-schedule", router: examScheduleRoutes },
  { path: "/api/assignments", router: assignmentRoutes },
  { path: "/api/online-classes", router: onlineClassRoutes },
  { path: "/api/study-material", router: studyMaterialRoutes },
];
