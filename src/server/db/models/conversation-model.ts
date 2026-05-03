import mongoose, { Schema, Model } from "mongoose";
import type { Message, Conversation } from "@/features/chat/types";

// =============================================================================
// Mongoose Schemas
// =============================================================================

/**
 * Message Sub-schema.
 * Mirrors the shared `Message` type for database persistence.
 */
const MessageSchema = new Schema<Message>(
  {
    id: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    // content is NOT required — assistant messages use `parts` and have content: ""
    content: { type: String, default: "" },
    reasoning: { type: String },
    image: { type: String },
    files: { type: [Schema.Types.Mixed], default: [] },
    parts: { type: [Schema.Types.Mixed], default: [] },
    tool_calls: { type: [Schema.Types.Mixed], default: [] },
    replyTo: { type: String },
    usage: { type: Schema.Types.Mixed },
    model: { type: String },
    provider: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * Conversation Schema.
 * Links a user to a sequence of messages.
 */
const ConversationSchema = new Schema<Conversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, default: "New Chat" },
    messages: { type: [MessageSchema], default: [] },
    summary: { type: String, default: "" },
    summarizedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ConversationModel: Model<Conversation> =
  mongoose.models?.Conversation ||
  mongoose.model<Conversation>("Conversation", ConversationSchema);

export default ConversationModel;
