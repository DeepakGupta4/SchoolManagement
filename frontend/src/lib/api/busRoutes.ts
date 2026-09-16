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
  bus: string;
  capacity: number;
  departure: string;
  arrival: string;
  status: string;
  distance: string;
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

/** Shared stop network — every route picks its pickup points from this list. */
export const ROUTE_STOP_OPTIONS = [
  "Dwarka Mor",
  "Dwarka Sector 12",
  "Palam Vihar",
  "Janakpuri West",
  "Uttam Nagar",
  "Rajouri Garden",
  "Rohini Sector 7",
  "Netaji Subhash Place",
  "Pitampura Metro",
  "Karol Bagh",
  "Laxmi Nagar Metro",
  "Preet Vihar",
  "Mayur Vihar Phase 1",
  "Noida Sector 18",
  "Noida Sector 62",
  "Gurgaon MG Road",
  "Gurgaon Cyber Hub",
  "Sohna Road",
  "Faridabad NIT",
  "Ballabgarh Bus Stand",
];

export const ROUTE_DRIVER_OPTIONS = [
  "Ramesh Kumar",
  "Suresh Yadav",
  "Mohan Singh",
  "Vijay Sharma",
  "Anil Gupta",
  "Deepak Verma",
  "Rajesh Tiwari",
  "Sanjay Mishra",
];

export const busRoutesApi = createApiResource<BusRoute, BusRouteFilters>("/api/bus-routes");
