import fs from "fs";
import path from "path";

// Converts an image file to a base64 string.
export function imageToBase64(filePath: string): string {
  const absolute = path.join(process.cwd(), filePath);
  return fs.readFileSync(absolute).toString("base64");
}

// Converts a base64 string to an image file.
export function base64ToImage(base64String: string, outputPath: string): void {
  if (base64String.includes(",")) {
    base64String = base64String.split(",")[1];
  }
  const absolute = path.join(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, Buffer.from(base64String, "base64"));
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));