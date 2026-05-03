import mongoose, { Schema, Model } from "mongoose";
import { type MessageAttachment } from "@/features/chat/types";

export interface IAttachment extends MessageAttachment {
  userId: string;
  path: string; // The relative file path: "storage/uploads/1234.png"
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    userId: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number },
    kind: { type: String },
    extractedText: { type: String },
    previewText: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const AttachmentModel: Model<IAttachment> =
  mongoose.models?.Attachment ||
  mongoose.model<IAttachment>("Attachment", AttachmentSchema);

export default AttachmentModel;
