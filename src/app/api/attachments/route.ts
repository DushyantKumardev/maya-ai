import { NextResponse } from "next/server";
import connectDB from "@/server/db/mongo";
import Attachment from "@/server/db/models/attachment-model";
import { auth } from "@/features/auth/config/auth";
import path from "path";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { saveFile } from "@/server/utils/storage";
import {
  inferAttachmentKind,
  sanitizeAttachmentName,
  truncateExtractedText,
} from "@/lib/attachments";

function buildPreviewText(text: string, maxChars = 400) {
  if (!text) return "";
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}...`;
}

/**
 * Endpoint to upload a file and return its MongoDB Attachment ID URL.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      file,
      filename,
      mimeType: providedMimeType,
      size,
      extractedText,
    } = await req.json();

    if (!file) {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 });
    }

    await connectDB();

    // 1. Extract base64 data from Data URL if present
    let base64Data = file;
    let mimeType = providedMimeType || "application/octet-stream";

    if (file.startsWith("data:")) {
      const parts = file.split(",");
      if (parts.length > 1) {
        base64Data = parts[1];
        const mimeMatch = parts[0].match(/data:(.*?);base64/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }
    }

    // 2. Save the file dynamically using the appropriate storage driver
    const safeFilename = sanitizeAttachmentName(filename);
    const extension = path.extname(safeFilename);
    const generatedExtension =
      extension || `.${mimeType.split("/")[1] || "bin"}`;
    const storedFileName = `${safeFilename.replace(/\.[^.]+$/, "")}${generatedExtension}`;
    const kind = inferAttachmentKind(mimeType, safeFilename);
    const finalExtractedText = truncateExtractedText(extractedText);

    const uploadResult = await saveFile(base64Data, storedFileName, mimeType, "uploads");

    // 3. Create attachment record.
    const attachment = await Attachment.create({
      userId: session.user.id,
      kind,
      mimeType,
      filename: safeFilename || storedFileName,
      size: typeof size === "number" ? size : Buffer.from(base64Data, "base64").length,
      path: uploadResult.path,
      extractedText: finalExtractedText || undefined,
      previewText: finalExtractedText
        ? buildPreviewText(finalExtractedText)
        : undefined,
    });

    const attachmentUrl = uploadResult.isCloud
      ? uploadResult.url
      : API_ENDPOINTS.ATTACHMENTS.BY_ID(attachment._id.toString());

    return NextResponse.json(
      {
        message: "Upload successful",
        attachment: {
          id: attachment._id.toString(),
          _id: attachment._id.toString(),
          kind: attachment.kind,
          mimeType: attachment.mimeType,
          filename: attachment.filename,
          size: attachment.size,
          url: attachmentUrl,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
