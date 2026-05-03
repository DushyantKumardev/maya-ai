import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    
    // Basic security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const filepath = path.join(process.cwd(), "storage", "generated", filename);

    try {
      const buffer = await fs.readFile(filepath);
      
      // Determine content type based on extension
      const ext = path.extname(filename).toLowerCase();
      const contentType = ext === ".png" ? "image/png" : 
                          ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : 
                          ext === ".webp" ? "image/webp" : 
                          "application/octet-stream";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      console.error("Failed to read generated file:", err);
      return new NextResponse("Not Found", { status: 404 });
    }
  } catch (error) {
    console.error("Generated Asset Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
