import { NextResponse } from "next/server";
import connectDB from "@/server/db/mongo";
import Attachment from "@/server/db/models/attachment-model";
import { auth } from "@/features/auth/config/auth";
import fs from "fs/promises";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const attachment = await Attachment.findById(id).lean();
    if (!attachment || !attachment.path) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const { mimeType, path: filepath, filename } = attachment;

    if (filepath.startsWith("http://") || filepath.startsWith("https://")) {
      return NextResponse.redirect(filepath);
    }

    try {
      const buffer = await fs.readFile(filepath);

      const headers: Record<string, string> = {
        "Content-Type": mimeType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      };

      if (filename) {
        headers["Content-Disposition"] =
          `inline; filename="${encodeURIComponent(filename)}"`;
      }

      return new NextResponse(buffer, { headers });
    } catch (err) {
      console.error("Failed to read file from disk:", err);
      return new NextResponse("File not found on disk", { status: 404 });
    }
  } catch (error) {
    console.error("GET Attachment Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
