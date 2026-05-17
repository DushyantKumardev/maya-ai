import createProvider from "@/server/agent/provider";
import { VISION_ANALYSIS_PROMPT } from "@/server/agent/prompt/constants";
import { API_ENDPOINTS } from "@/lib/constants/api";

export const visionTool = {
  type: "function",
  name: "image-analyze",
  description: "Analyze image from URL, path, or ID to understand content.",
  parameters: {
    type: "object",
    properties: {
      imageUrlOrId: {
        type: "string",
        description: "Direct URL, absolute path, or internal image ID.",
      },
      userQuery: {
        type: "string",
        description: "Specific analysis request for the image.",
      },
    },
    required: ["imageUrlOrId"],
  },
  execute: visionToolRunner,
};

/**
 * Uses a capable vision model to describe an image.
 * Prioritizes the passed provider/model, falls back to Ollama Cloud or Local.
 */
const defaultVisionModel = "gemma4:31b-cloud";

export async function describeImage(
  b64Image: string,
  userPrompt: string,
  context?: { provider?: string; model?: string; settings?: any },
): Promise<string> {
  const { provider, model, settings } = context || {};
  // 1. First Attempt: Use the model/provider the user has currently selected.
  if (provider && model) {
    try {
      const client = createProvider(provider, settings);
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_ANALYSIS_PROMPT(userPrompt) },
              { type: "image_url", image_url: { url: b64Image } },
            ],
          },
        ],
      });
      const description = response.choices[0]?.message?.content;
      if (description) return description;
    } catch (err: any) {
      console.warn(
        `[Vision] Primary model (${model}) failed: ${err.message}. Trying fallback...`,
      );
    }
  }

  // 2. Second Attempt: Fallback to the dedicated default vision model (Ollama Cloud).
  try {
    const cloudClient = createProvider("ollama-cloud", settings);
    const cloudResponse = await cloudClient.chat.completions.create({
      model: defaultVisionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_ANALYSIS_PROMPT(userPrompt) },
            { type: "image_url", image_url: { url: b64Image } },
          ],
        },
      ],
    });
    const cloudDesc = cloudResponse.choices[0]?.message?.content;
    if (cloudDesc) return cloudDesc;
  } catch (err: any) {
    console.error(
      `[Vision] Fallback model (${defaultVisionModel}) failed:`,
      err.message,
    );
    return `[ANALYSIS ERROR: I tried to analyze the image using your current model (${model}) and my fallback model (${defaultVisionModel}), but both failed. Error details: ${err.message}]`;
  }

  return "[ANALYSIS ERROR: An unexpected error occurred during image processing.]";
}

async function visionToolRunner(
  args: { imageUrlOrId: string; userQuery?: string },
  sysOptions: any = {},
) {
  const { onStatusUpdate, provider, model } = sysOptions;
  onStatusUpdate?.({ message: "Preparing image for analysis..." });

  try {
    let imageToAnalyze = args.imageUrlOrId;
    const fs = await import("fs/promises");
    const path = await import("path");

    if (args.imageUrlOrId.includes(API_ENDPOINTS.ATTACHMENTS.BASE + "/")) {
      const attachmentId = args.imageUrlOrId.split("/").pop();
      const Attachment = (await import("@/server/db/models/attachment-model"))
        .default;
      const connectDB = (await import("@/server/db/mongo")).default;
      await connectDB();
      const attachment = await Attachment.findById(attachmentId).lean();
      if (attachment && attachment.path) {
        if (attachment.path.startsWith("http://") || attachment.path.startsWith("https://")) {
          onStatusUpdate?.({ message: "Fetching remote attachment..." });
          const response = await fetch(attachment.path);
          if (!response.ok) throw new Error(`Failed to fetch attachment from cloud: ${response.statusText}`);
          const buffer = Buffer.from(await response.arrayBuffer());
          imageToAnalyze = `data:${attachment.mimeType || "image/png"};base64,${buffer.toString("base64")}`;
        } else {
          onStatusUpdate?.({ message: "Reading attachment from disk..." });
          const rawBuffer = await fs.readFile(attachment.path);
          const b64 = rawBuffer.toString("base64");
          imageToAnalyze = `data:${attachment.mimeType || "image/png"};base64,${b64}`;
        }
      }
    } else if (
      args.imageUrlOrId.startsWith("http://") ||
      args.imageUrlOrId.startsWith("https://")
    ) {
      onStatusUpdate?.({ message: "Fetching remote image..." });
      const response = await fetch(args.imageUrlOrId, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        },
      });
      if (!response.ok)
        throw new Error(
          `Failed to fetch image from URL: ${response.statusText}`,
        );
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "image/png";
      imageToAnalyze = `data:${contentType};base64,${buffer.toString("base64")}`;
    } else if (path.isAbsolute(args.imageUrlOrId)) {
      onStatusUpdate?.({
        message: `Reading local file: ${path.basename(args.imageUrlOrId)}...`,
      });
      try {
        const rawBuffer = await fs.readFile(args.imageUrlOrId);
        const ext = path
          .extname(args.imageUrlOrId)
          .toLowerCase()
          .replace(".", "");
        const mimeType = ext === "jpg" ? "image/jpeg" : `image/${ext || "png"}`;
        imageToAnalyze = `data:${mimeType};base64,${rawBuffer.toString("base64")}`;
      } catch (err: any) {
        console.log(`Could not read local image file: ${err.message}`);
        return { instructions: "Error: Could not read local image file.", };
      }
    }

    const description = await describeImage(
      imageToAnalyze,
      args.userQuery || "",
      { provider, model, settings: sysOptions.settings },
    );
    onStatusUpdate?.({ message: "Analyzed image", done: true });

    const isError = description.startsWith("[ANALYSIS ERROR:");
    const instructions = isError
      ? "An error occurred while trying to analyze the image. Please inform the user about the failure and provide the error details found in the description."
      : "Use this description to answer the user's question about the image. Maintain a helpful and descriptive tone.";

    return { description, instructions };
  } catch (err: any) {
    onStatusUpdate?.({
      message: `Analysis failed: ${err.message}`,
      done: true,
    });
    throw err;
  }
}
