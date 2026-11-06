import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A direct message between two people in a school. Every message carries its
 * sender and recipient (by login email), so each user's inbox is just the
 * messages where they are the sender or the recipient — scoped per user, never
 * a flat school-wide list. A "conversation" is all the messages between one pair
 * of emails; replies are ordinary messages, so threads persist.
 */
const messageSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },

    fromEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    fromName: { type: String, default: "" },
    fromRole: { type: String, default: "" },

    toEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    toName: { type: String, default: "" },
    toRole: { type: String, default: "" },

    body: { type: String, required: true, trim: true },

    /** When the RECIPIENT read it (null = unread). Drives the unread badge. */
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A conversation query is "all messages between me and X", newest activity first.
messageSchema.index({ schoolId: 1, fromEmail: 1, toEmail: 1, createdAt: -1 });
messageSchema.index({ schoolId: 1, toEmail: 1, readAt: 1 });

export type MessageAttrs = InferSchemaType<typeof messageSchema>;
export const Message = mongoose.model("Message", messageSchema);
export type MessageDoc = mongoose.HydratedDocument<MessageAttrs>;
