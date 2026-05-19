import createProvider from "@/server/agent/provider";
import { VISION_ANALYSIS_PROMPT } from "@/server/agent/prompt/constants";

/**
 * Utils — Vision Fallback
 *
 * Uses a vision-capable model to describe an image when the active
 * model doesn't support vision natively. Used by the image-analyze tool.
 */
export async function describeImage(
  b64Image: string,
  userPrompt: string,
  context?: { provider?: string; model?: string; settings?: any },
): Promise<string> {
  const { settings } = context || {};

  // 1. Try the selected model if vision-capable (handled by caller)
  // 2. Fallback chain: Ollama Cloud → Ollama Local

  try {
    const cloudClient = createProvider("ollama-cloud", settings);
    const cloudResponse = await cloudClient.chat.completions.create({
      model: "qwen3.5:cloud",
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
  } catch (err) {
    console.warn("[Vision] Ollama Cloud fallback failed:", err);
  }

  try {
    const localClient = createProvider("ollama", settings);
    const localResponse = await localClient.chat.completions.create({
      model: "llava",
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
    const localDesc = localResponse.choices[0]?.message?.content;
    if (localDesc) return localDesc;
  } catch (err: any) {
    console.error("[Vision] All vision fallbacks failed:", err.message);
    return `[Failed to describe image: No vision-capable models available. ${err.message}]`;
  }

  return "[Failed to describe image: Unknown error]";
}
