import mongoose, { Schema, type InferSchemaType } from "mongoose";

const bookSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, default: "" },
    category: { type: String, default: "" },
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    isbn: { type: String, default: "" },
    publisher: { type: String, default: "" },
    year: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type BookAttrs = InferSchemaType<typeof bookSchema>;
export const Book = mongoose.model("Book", bookSchema);
