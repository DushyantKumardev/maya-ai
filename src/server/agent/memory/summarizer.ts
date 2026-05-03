import createProvider from "@/server/agent/provider";
import type { Message } from "@/features/chat/types";
import { buildSummaryMessages } from "@/server/agent/prompt";
import { APP_SHORT_NAME } from "@/lib/constants";
import { AppSettings } from "@/features/settings/types";
import { getErrorMessage } from "@/types/shared";
import type { ReasoningEffort } from "@/features/chat/types";

interface SummaryChoiceMessage {
  content?: string | null;
  reasoning?: string | null;
}

/**
 * Memory Layer — Summarizer
 *
 * Condenses old chat history into a concise summary to preserve
 * context while minimizing token usage.
 */
export async function generateSummary({
  messages,
  existingSummary = "",
  provider,
  model,
  settings,
  reasoning_effort,
  onStatusUpdate,
}: {
  messages: Message[];
  existingSummary?: string;
  provider: string;
  model: string;
  settings?: AppSettings;
  reasoning_effort?: ReasoningEffort;
  onStatusUpdate?: (message: { message: string; done?: boolean }) => void;
}): Promise<string> {
  const extractContent = (message: Message): string => {
    if (message.content) return message.content as string;
    if (message.parts?.length) {
      const fromParts = message.parts
        .filter((p) => p.type === "content")
        .map((p) => p.content)
        .join("");
      if (fromParts) return fromParts;
    }
    return "";
  };

  const historyText = messages
    .map((m) => `${m.role.toUpperCase()}: ${extractContent(m)}`)
    .join("\n\n");

  const messagesForModel = buildSummaryMessages(historyText, existingSummary);

  onStatusUpdate?.({ message: `${APP_SHORT_NAME} is compacting chat context...` });

  try {
    const response = await createProvider(provider, settings).chat.completions.create({
      model,
      messages: messagesForModel as any,
      temperature: 0.1,
      max_tokens: 800,
      ...(reasoning_effort && { reasoning_effort: reasoning_effort as any }),
    });

    const message = response.choices[0]?.message as SummaryChoiceMessage | undefined;
    const content = message?.content || message?.reasoning || "";
    const cleanSummary = content
      .replace(/<\/?thought>/gi, "")
      .replace(/^SUMMARY:\s*/i, "")
      .trim();

    onStatusUpdate?.({ message: `${APP_SHORT_NAME} compacted chat context.`, done: true });
    return cleanSummary;
  } catch (error) {
    console.error(`[Summarizer] Critical Error for ${model}:`, getErrorMessage(error));
    return existingSummary;
  }
}
