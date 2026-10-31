import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { BusRoute, type BusRouteAttrs } from "../busRoutes/busRoute.model.js";
import { Student } from "../students/student.model.js";
import { User } from "../auth/user.model.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Live bus tracking. The DRIVER's phone is the GPS source: while sharing is on it
 * posts its location here, which updates the one BusRoute linked to the driver's
 * login (by `driverEmail`). Parents / students / office read the latest position.
 *
 * A driver can only ever move THEIR OWN route — every write is scoped to
 * {schoolId, driverEmail === the caller's email}, so no role gate is needed. Reads
 * are school-scoped. Mounted under the shared tenant guard (requireAuth + …).
 */
const router = Router();

type RouteDoc = mongoose.HydratedDocument<BusRouteAttrs>;

/** The public live shape of a route (identity + last known position). */
function toLive(r: RouteDoc) {
  return {
    id: String(r._id),
    code: r.code,
    name: r.name,
    stops: r.stops ?? [],
    students: r.students ?? 0,
    bus: r.bus ?? "",
    departure: r.departure ?? "",
    arrival: r.arrival ?? "",
    status: r.status ?? "active",
    trackingOn: !!r.trackingOn,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    speed: r.speed ?? 0,
    heading: r.heading ?? 0,
    lastPingAt: r.lastPingAt ?? "",
  };
}

const driverEmail = (req: { user?: { email?: string } }) => (req.user?.email || "").toLowerCase();

/** GET /api/transport/me — the signed-in driver's route + live state (null if none linked). */
router.get("/me", async (req, res, next) => {
  try {
    const email = driverEmail(req);
    const route = email
      ? await BusRoute.findOne({ schoolId: req.user!.schoolId, driverEmail: email })
      : null;
    res.json({ data: route ? toLive(route) : null });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/transport/me/students — the pupils riding the signed-in driver's
 * route(s), so they know who boards. Driver-only, and self-scoped: matches the
 * driver's own route(s) by the hard driverEmail link, OR by driver name but ONLY
 * for routes that have no email link — so a name collision can never pull in a
 * route that belongs to another driver's login. Returns only students whose
 * transportRouteCode is one of those routes.
 */
router.get("/me/students", requireRole("driver"), async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = driverEmail(req);
    const me = await User.findOne({ schoolId, email: req.user!.email }).lean();
    const name = (me?.name || "").trim();

    const or: Record<string, unknown>[] = [];
    if (email) or.push({ driverEmail: email });
    // Name fallback is scoped to UNLINKED routes only (driverEmail blank/null),
    // so it can never match a route hard-linked to someone else's login.
    if (name) or.push({ driverEmail: { $in: ["", null] }, driver: new RegExp(`^${escapeRx(name)}$`, "i") });
    const routes = or.length ? await BusRoute.find({ schoolId, $or: or }).lean() : [];
    const codes = routes.map((r) => r.code).filter(Boolean);

    if (codes.length === 0) {
      res.json({ data: [] });
      return;
    }

    const students = await Student.find({
      schoolId,
      status: "active",
      transportRouteCode: { $in: codes },
    })
      .select("firstName lastName className section rollNo pickupPoint transportRouteCode avatar guardian")
      .lean();

    const rows = students
      .map((s) => ({
        id: String(s._id),
        name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
        className: s.className ?? "",
        section: s.section ?? "",
        rollNo: s.rollNo ?? "",
        pickupPoint: s.pickupPoint ?? "",
        routeCode: s.transportRouteCode ?? "",
        avatar: s.avatar ?? "",
        guardianPhone: s.guardian?.phone ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

const pingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
});

/** POST /api/transport/location — a GPS ping. Updates ONLY the caller's own route. */
router.post("/location", validate(pingSchema), async (req, res, next) => {
  try {
    const { lat, lng, speed, heading } = req.body as z.infer<typeof pingSchema>;
    const route = await BusRoute.findOneAndUpdate(
      { schoolId: req.user!.schoolId, driverEmail: driverEmail(req) },
      {
        $set: {
          lat,
          lng,
          speed: speed ?? 0,
          heading: heading ?? 0,
          lastPingAt: new Date().toISOString(),
          trackingOn: true,
        },
      },
      { new: true }
    );
    if (!route)
      throw ApiError.forbidden(
        "No bus route is linked to your account. Ask the office to assign you a route."
      );
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

/** POST /api/transport/tracking — the driver turns location sharing on / off. */
router.post("/tracking", validate(z.object({ on: z.boolean() })), async (req, res, next) => {
  try {
    const on = (req.body as { on: boolean }).on;
    const route = await BusRoute.findOneAndUpdate(
      { schoolId: req.user!.schoolId, driverEmail: driverEmail(req) },
      { $set: { trackingOn: on } },
      { new: true }
    );
    if (!route) throw ApiError.forbidden("No bus route is linked to your account.");
    res.json({ data: { ok: true, trackingOn: !!route.trackingOn } });
  } catch (err) {
    next(err);
  }
});

/** GET /api/transport/track/:id — the live position of one route (anyone in the school). */
router.get("/track/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest("Invalid route id.");
    const route = await BusRoute.findOne({ schoolId: req.user!.schoolId, _id: req.params.id });
    if (!route) throw ApiError.notFound("Route not found.");
    // A ping older than a minute means the bus likely isn't live right now.
    const stale = !route.lastPingAt || Date.now() - Date.parse(route.lastPingAt) > 60_000;
    res.json({ data: { ...toLive(route), stale } });
  } catch (err) {
    next(err);
  }
});

/** GET /api/transport/live — every route currently sharing its location (office overview). */
router.get("/live", async (req, res, next) => {
  try {
    const routes = await BusRoute.find({ schoolId: req.user!.schoolId, trackingOn: true });
    res.json({ data: routes.map(toLive) });
  } catch (err) {
    next(err);
  }
});

export default router;
