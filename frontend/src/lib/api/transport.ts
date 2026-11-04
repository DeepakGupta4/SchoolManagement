import { apiRequest } from "./client";

/** A bus route's live position, from GET /api/transport/live. */
export interface LiveBus {
  id: string;
  code: string;
  name: string;
  bus: string;
  status: string;
  trackingOn: boolean;
  lat: number | null;
  lng: number | null;
  speed: number;
  heading: number;
  lastPingAt: string;
  stops: string[];
  students: number;
  departure: string;
  arrival: string;
}

/**
 * Every bus currently sharing its location. The backend scopes the result by role —
 * office/admin see all buses; a parent/student would see only their child's route.
 * A ping older than ~60s means the bus likely isn't moving right now.
 */
export function listLiveBuses(): Promise<LiveBus[]> {
  return apiRequest<LiveBus[]>("/api/transport/live");
}
