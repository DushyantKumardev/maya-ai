import Attachment, { IAttachment } from "@/server/db/models/attachment-model";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  ProviderContentPart,
  StreamMessageInput,
  TextContentPart,
} from "@/server/agent/types";

/**
 * Context Layer — Step 2c: Vision Preprocessing
 *
 * For vision-capable models: fetches image attachments from DB and
 * encodes them as base64 data URIs in the latest message.
 *
 * For non-vision models: replaces images with a text placeholder that
 * instructs the AI to use the image-analyze tool instead.
 */

function isImagePart(
  part: ProviderContentPart,
): part is Extract<ProviderContentPart, { type: "image_url" }> {
  return part.type === "image_url";
}

function buildImagePlaceholder(imageUrl: string): TextContentPart {
  return {
    type: "text",
    text: `\n[IMAGE ATTACHED: Use the 'image-analyze' tool with imageUrlOrId: "${imageUrl}" if you need to understand this content.]\n`,
  };
}

export async function preprocessImages(
  messages: StreamMessageInput[],
): Promise<StreamMessageInput[]> {
  const processed = structuredClone(messages);

  for (const message of processed) {
    if (!Array.isArray(message.content)) continue;

    const parts: ProviderContentPart[] = [];

    for (const part of message.content) {
      if (isImagePart(part)) {
        parts.push(buildImagePlaceholder(part.image_url.url));
      } else {
        parts.push(part);
      }
    }

    message.content = parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("\n")
      .trim();
  }

  return processed;
}
