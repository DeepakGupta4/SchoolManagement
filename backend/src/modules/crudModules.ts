import type { Router } from "express";
import classRoutes from "./classes/class.routes.js";

/**
 * Tenant CRUD modules mounted uniformly under the subscription guard. Each is a
 * `createCrudRouter` router. Adding a module is a single line here — app.ts
 * iterates and mounts them all with the same auth + subscription gating.
 */
export const crudModules: { path: string; router: Router }[] = [
  { path: "/api/classes", router: classRoutes },
];
