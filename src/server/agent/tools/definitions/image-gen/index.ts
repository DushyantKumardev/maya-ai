import { AppSettings } from "@/features/settings/types";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { API_ENDPOINTS } from "@/lib/constants/api";
import connectDB from "@/server/db/mongo";
import Attachment from "@/server/db/models/attachment-model";
import { saveFile } from "@/server/utils/storage";

// ─── Types ────────────────────────────────────────────────────

interface ImageGenerationArgs {
  prompt: string;
  count?: number;
  aspect_ratio?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
}

interface StatusUpdate {
  message: string;
  done?: boolean;
  data?: any;
}

interface ImageGenerationSystemOptions {
  onStatusUpdate?: (params: StatusUpdate) => void;
  settings?: AppSettings;
  userId?: string;
}

export interface ImageGenerationResponse {
  images?: Array<{ url: string; prompt: string }>;
  model?: string;
  provider?: string;
  error?: string;
  instructions?: string;
}

// ─── Constants ────────────────────────────────────────────────

const IMAGE_MODEL = "flux"; // free, no auth needed. Alternatives: "turbo", "flux-realism", "flux-anime"
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

// Map aspect ratios to pixel dimensions (all ~1MP to keep generation fast)
const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1":  { width: 1024, height: 1024 },
  "4:3":  { width: 1024, height: 768 },
  "3:4":  { width: 768,  height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576,  height: 1024 },
};

// ─── Tool Definition ──────────────────────────────────────────

export const imageGenerationTool = {
  type: "function",
  name: "image-gen",
  description: "Generate images from text prompts (draw, create, generate).",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Visual description of the image.",
      },
      count: {
        type: "number",
        description: "Number of images (1-4, default 1).",
        default: 1,
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "4:3", "3:4", "16:9", "9:16"],
        description: "The aspect ratio of the generated image. Default is '1:1'.",
        default: "1:1",
      },
    },
    required: ["prompt"],
  },
  execute: imageGeneration,
};

// ─── Private helpers ──────────────────────────────────────────

/**
 * Calls Pollinations.AI image endpoint — no API key, no auth, works from Node.js server.
 * Returns image bytes as a Buffer.
 */
async function generateImageWithPollinations(
  prompt: string,
  aspectRatio: string,
): Promise<Buffer> {
  const { width, height } = ASPECT_RATIO_DIMENSIONS[aspectRatio] ?? ASPECT_RATIO_DIMENSIONS["1:1"];

  const params = new URLSearchParams({
    model: IMAGE_MODEL,
    width: String(width),
    height: String(height),
    nologo: "true",
    private: "true",   // don't show in public Pollinations feed
    seed: String(Math.floor(Math.random() * 999999)),
  });

  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pollinations API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    const text = await response.text();
    throw new Error(`Unexpected response type "${contentType}": ${text.slice(0, 200)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Public execute ───────────────────────────────────────────

export async function imageGeneration(
  args: ImageGenerationArgs,
  sysOptions: ImageGenerationSystemOptions = {},
): Promise<ImageGenerationResponse> {
  const { prompt, aspect_ratio = "1:1", count = 1 } = args;
  const { onStatusUpdate } = sysOptions;

  if (!prompt?.trim()) {
    onStatusUpdate?.({ message: "Prompt is empty.", done: true });
    return { images: [], error: "Prompt cannot be empty." };
  }

  onStatusUpdate?.({ message: `Creating image` });

  try {
    // Generate `count` images (capped at 4)
    const clampedCount = Math.min(Math.max(count, 1), 4);
    const results: Array<{ url: string; prompt: string }> = [];

    for (let i = 0; i < clampedCount; i++) {
      if (clampedCount > 1) {
        onStatusUpdate?.({ message: `Generating image ${i + 1} of ${clampedCount}…` });
      }

      const imageBuffer = await generateImageWithPollinations(prompt.trim(), aspect_ratio);
      const base64Data = imageBuffer.toString("base64");
      const fileName = `img_${crypto.randomUUID()}.jpg`;

      const uploadResult = await saveFile(base64Data, fileName, "image/jpeg", "generated");

      if (uploadResult.isCloud) {
        try {
          await connectDB();
          await Attachment.create({
            userId: sysOptions.userId || "system",
            kind: "image",
            mimeType: "image/jpeg",
            filename: fileName,
            size: imageBuffer.length,
            path: uploadResult.path,
          });
        } catch (dbErr) {
          console.error("Failed to register generated image in database:", dbErr);
        }
      }

      results.push({ url: uploadResult.url, prompt: prompt.trim() });
    }

    const finalResult = {
      images: results,
      model: IMAGE_MODEL,
      provider: "Pollinations.AI",
      instructions: `Image Generated Successfully! Use Don't give any link just confirm , rest all handled by system.`
    };

    onStatusUpdate?.({ 
      message: "Created Image", 
      done: true,
    });

    return finalResult;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    onStatusUpdate?.({ message: `Generation failed: ${errorMessage}`, done: true });
    return { images: [], error: errorMessage };
  }
}