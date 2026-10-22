import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** One configurable fee head (name + monthly amount). */
const feeHeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const feeStructureSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    code: { type: String, required: true, trim: true },
    class: { type: String, required: true, trim: true },

    /**
     * The school's chosen fee heads for this class — any names/amounts they like
     * (Tuition, Computer, ID Card, Diary, …). This is the source of truth for new
     * and edited structures.
     */
    heads: { type: [feeHeadSchema], default: [] },

    // Legacy fixed columns — kept ONLY so structures created before `heads`
    // existed still bill correctly (read as a fallback). New/edited structures
    // write `heads`. Do not add more of these.
    tuition: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    lab: { type: Number, default: 0 },
    library: { type: Number, default: 0 },
    sports: { type: Number, default: 0 },
    misc: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One fee structure per class per school (case-insensitive). Dedupe any duplicate
// class names before this index builds, or the build fails silently.
feeStructureSchema.index(
  { schoolId: 1, class: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export type FeeStructureAttrs = InferSchemaType<typeof feeStructureSchema>;
export const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);

// Surface a failed unique-index build (otherwise Mongoose swallows the E11000 and
// the {schoolId,class} uniqueness silently never takes effect in a tenant that
// still has duplicate class names — dedupe those, then restart).
FeeStructure.on("index", (err) => {
  if (err) {
    console.error("[FeeStructure] index build failed — dedupe duplicate class names:", err.message);
  }
});
