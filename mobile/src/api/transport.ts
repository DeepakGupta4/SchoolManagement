import { api } from "./client";

/** The driver's route + its latest shared position. */
export interface DriverRoute {
  id: string;
  code: string;
  name: string;
  stops: string[];
  students: number;
  bus: string;
  departure: string;
  arrival: string;
  status: string;
  trackingOn: boolean;
  lat: number | null;
  lng: number | null;
  speed: number;
  heading: number;
  lastPingAt: string;
}

/** The signed-in driver's route + live state (null when no route is linked to them). */
export const getMyRoute = () => api<DriverRoute | null>("/api/transport/me");

/** Push one GPS ping — the server updates only the caller's own route. */
export const sendLocation = (body: { lat: number; lng: number; speed?: number; heading?: number }) =>
  api<{ ok: boolean }>("/api/transport/location", { method: "POST", body });

/** Flip the route's "sharing" flag on/off. */
export const setTracking = (on: boolean) =>
  api<{ ok: boolean; trackingOn: boolean }>("/api/transport/tracking", { method: "POST", body: { on } });
