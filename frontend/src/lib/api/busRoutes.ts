import { createApiResource } from "./createApiResource";

export interface BusRoute {
  id: string;
  /** Human-facing route code, e.g. "RT001". Must stay unique. */
  code: string;
  name: string;
  /** Named pickup points along the route, in order. */
  stops: string[];
  students: number;
  driver: string;
  /** Optional login email linking this route to a driver's account. */
  driverEmail?: string;
  bus: string;
  capacity: number;
  departure: string;
  arrival: string;
  status: string;
  distance: string;
  /** Monthly transport fee for this route — billed to students assigned to it. */
  fee: number;
}

export interface BusRouteFilters {
  search?: string;
  status?: string;
}

export const ROUTE_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Delayed", value: "delayed" },
  { label: "Inactive", value: "inactive" },
];

// Stops and drivers are NOT hardcoded: a school enters its own stops per route
// (reusing ones from its other routes), and drivers come from real "driver" user
// accounts — see BusRouteFormModal.

export const busRoutesApi = createApiResource<BusRoute, BusRouteFilters>("/api/bus-routes");
