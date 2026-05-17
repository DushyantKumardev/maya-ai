import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";

const isCloudMode =
  process.env.NEXT_PUBLIC_APP_MODE === "cloud" &&
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (isCloudMode) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadResult {
  path: string;      // Absolute local filepath or Cloudinary secure URL
  url: string;       // Public URL or identifier endpoint
  isCloud: boolean;
}

/**
 * Saves a base64 encoded file either to Cloudinary (if configured) or the local filesystem (if self-hosted).
 */
export async function saveFile(
  base64Data: string,
  filename: string,
  mimeType: string,
  subFolder: "uploads" | "generated"
): Promise<UploadResult> {
  if (isCloudMode) {
    try {
      // ── CLOUD STORAGE DRIVER (Cloudinary) ──
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        folder: `maya-ai/${subFolder}`,
        resource_type: "auto",
        public_id: filename.replace(/\.[^/.]+$/, ""), // remove extension
      });

      return {
        path: uploadResponse.secure_url,
        url: uploadResponse.secure_url,
        isCloud: true,
      };
    } catch (error) {
      console.error("Cloudinary upload failed, falling back to local filesystem:", error);
      // Fallback to local file system if Cloudinary fails during an active upload
    }
  }

  // ── SELF-HOSTED DRIVER (Local File System) ──
  const buffer = Buffer.from(base64Data, "base64");
  const uploadDir = path.join(process.cwd(), "storage", subFolder);

  // Ensure local directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  const storedFileName = `${Date.now()}-${filename}`;
  const filepath = path.join(uploadDir, storedFileName);
  await fs.writeFile(filepath, buffer);

  // Return local path and internal serving endpoint
  return {
    path: filepath,
    url: subFolder === "uploads"
      ? "/api/attachments" // Will be post-fixed with MongoDB ID in the API handler
      : `/api/storage/generated/${storedFileName}`,
    isCloud: false,
  };
}
