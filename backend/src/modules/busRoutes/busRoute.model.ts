import mongoose, { Schema, type InferSchemaType } from "mongoose";

const busRouteSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    stops: { type: [String], default: [] },
    students: { type: Number, default: 0 },
    driver: { type: String, default: "" },
    bus: { type: String, default: "" },
    capacity: { type: Number, default: 40 },
    departure: { type: String, default: "" },
    arrival: { type: String, default: "" },
    status: { type: String, default: "active" },
    distance: { type: String, default: "" },
  },
  { timestamps: true }
);

export type BusRouteAttrs = InferSchemaType<typeof busRouteSchema>;
export const BusRoute = mongoose.model("BusRoute", busRouteSchema);
