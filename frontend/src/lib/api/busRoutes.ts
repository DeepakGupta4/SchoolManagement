import { createResource, textMatch } from "./createResource";

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

const seed: BusRoute[] = [
  {
    id: "rte_001", code: "RT001", name: "Route A — Dwarka",
    stops: ["Dwarka Mor", "Dwarka Sector 12", "Palam Vihar", "Janakpuri West", "Uttam Nagar", "Rajouri Garden", "Karol Bagh", "Preet Vihar"],
    students: 42, driver: "Ramesh Kumar", bus: "DL-01-AB-1234", capacity: 50, departure: "7:00 AM", arrival: "8:15 AM", status: "active", distance: "18 km",
  },
  {
    id: "rte_002", code: "RT002", name: "Route B — Rohini",
    stops: ["Rohini Sector 7", "Netaji Subhash Place", "Pitampura Metro", "Karol Bagh", "Rajouri Garden", "Janakpuri West"],
    students: 38, driver: "Suresh Yadav", bus: "DL-02-CD-5678", capacity: 45, departure: "7:10 AM", arrival: "8:20 AM", status: "active", distance: "22 km",
  },
  {
    id: "rte_003", code: "RT003", name: "Route C — Janakpuri",
    stops: ["Janakpuri West", "Uttam Nagar", "Dwarka Mor", "Palam Vihar", "Rajouri Garden"],
    students: 30, driver: "Mohan Singh", bus: "DL-03-EF-9012", capacity: 40, departure: "7:05 AM", arrival: "8:10 AM", status: "active", distance: "14 km",
  },
  {
    id: "rte_004", code: "RT004", name: "Route D — Pitampura",
    stops: ["Pitampura Metro", "Netaji Subhash Place", "Rohini Sector 7", "Karol Bagh", "Rajouri Garden", "Preet Vihar", "Laxmi Nagar Metro"],
    students: 44, driver: "Vijay Sharma", bus: "DL-04-GH-3456", capacity: 50, departure: "7:15 AM", arrival: "8:30 AM", status: "active", distance: "25 km",
  },
  {
    id: "rte_005", code: "RT005", name: "Route E — Laxmi Nagar",
    stops: ["Laxmi Nagar Metro", "Preet Vihar", "Mayur Vihar Phase 1", "Noida Sector 18", "Karol Bagh", "Rajouri Garden", "Janakpuri West", "Uttam Nagar", "Dwarka Mor"],
    students: 35, driver: "Anil Gupta", bus: "DL-05-IJ-7890", capacity: 45, departure: "7:00 AM", arrival: "8:25 AM", status: "delayed", distance: "20 km",
  },
  {
    id: "rte_006", code: "RT006", name: "Route F — Noida Sec 62",
    stops: ["Noida Sector 62", "Noida Sector 18", "Mayur Vihar Phase 1", "Preet Vihar", "Laxmi Nagar Metro", "Karol Bagh", "Rajouri Garden", "Janakpuri West", "Uttam Nagar", "Dwarka Mor"],
    students: 48, driver: "Deepak Verma", bus: "DL-06-KL-2345", capacity: 55, departure: "6:50 AM", arrival: "8:20 AM", status: "active", distance: "30 km",
  },
  {
    id: "rte_007", code: "RT007", name: "Route G — Gurgaon",
    stops: ["Gurgaon Cyber Hub", "Gurgaon MG Road", "Sohna Road", "Palam Vihar", "Dwarka Sector 12", "Dwarka Mor", "Janakpuri West", "Uttam Nagar", "Rajouri Garden", "Karol Bagh", "Preet Vihar", "Laxmi Nagar Metro"],
    students: 52, driver: "Rajesh Tiwari", bus: "DL-07-MN-6789", capacity: 55, departure: "6:45 AM", arrival: "8:30 AM", status: "active", distance: "35 km",
  },
  {
    id: "rte_008", code: "RT008", name: "Route H — Faridabad",
    stops: ["Ballabgarh Bus Stand", "Faridabad NIT", "Sohna Road", "Gurgaon MG Road", "Mayur Vihar Phase 1", "Preet Vihar", "Laxmi Nagar Metro", "Karol Bagh"],
    students: 28, driver: "Sanjay Mishra", bus: "DL-08-OP-0123", capacity: 40, departure: "6:40 AM", arrival: "8:15 AM", status: "inactive", distance: "28 km",
  },
];

const isAll = (value?: string) => !value || value === "All";

export const busRoutesApi = createResource<BusRoute, BusRouteFilters>({
  idPrefix: "rte",
  seed,
  uniqueBy: { field: "code", label: "Route code" },
  defaults: { status: "active", students: 0, capacity: 40 },
  matches: (row, { search, status }) => {
    if (!isAll(status) && row.status !== status) return false;
    return textMatch(search, row.name, row.code, row.driver, row.bus, row.stops.join(" "));
  },
});
