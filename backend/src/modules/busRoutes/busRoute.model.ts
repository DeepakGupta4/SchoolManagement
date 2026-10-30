import mongoose, { Schema, type InferSchemaType } from "mongoose";

const busRouteSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    stops: { type: [String], default: [] },
    students: { type: Number, default: 0 },
    driver: { type: String, default: "" },
    driverEmail: { type: String, default: "", lowercase: true, trim: true },
    bus: { type: String, default: "" },
    capacity: { type: Number, default: 40 },
    departure: { type: String, default: "" },
    arrival: { type: String, default: "" },
    status: { type: String, default: "active" },
    distance: { type: String, default: "" },
    /** Monthly transport fee for this route — billed to students assigned to it. */
    fee: { type: Number, default: 0, min: 0 },

    // --- Live GPS tracking: the driver's phone updates these via /api/transport.
    // Not in the bus-route zod schema, so admin CRUD never touches them.
    trackingOn: { type: Boolean, default: false },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    lastPingAt: { type: String, default: "" }, // ISO timestamp of the last GPS ping
  },
  { timestamps: true }
);

export type BusRouteAttrs = InferSchemaType<typeof busRouteSchema>;
export const BusRoute = mongoose.model("BusRoute", busRouteSchema);
