import { buildContextMessages } from "@/server/agent/prompt";
import type { Message } from "@/features/chat/types";

/**
 * Context Layer — Step 2d: Message Builder
 *
 * Normalizes raw messages into the provider format, then assembles
 * the final [system, ...history] array that gets sent to the LLM.
 */

function extractContent(message: any): string | any[] {
  if (message.content) return message.content;
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === "content")
      .map((p: any) => p.content)
      .join("");
  }
  return "";
}

/**
 * Normalizes raw DB messages into the flat format expected by providers.
 * Also injects replyTo context where present.
 */
export function normalizeMessages(messages: any[]) {
  return messages.map((message: any) => {
    let content = extractContent(message);

    if (message.replyTo && typeof content === "string") {
      content = `[The user is specifically referring to this part of the conversation: "${message.replyTo}"]\n\n${content}`;
    }

    return {
      role: message.role,
      content: Array.isArray(content) ? content : content || "",
      tool_calls: message.tool_calls,
      tool_call_id: message.tool_call_id,
      name: message.name,
      ...(message.reasoning ? { reasoning: message.reasoning } : {}),
    };
  });
}

/**
 * Assembles the complete message array for the LLM call:
 * [system prompt, ...normalized history]
 */
export function buildMessageContext(params: {
  settings: any;
  summary: string;
  processedMessages: any[];
  historyToKeep: any[];
  location?: any;
  reasoningEffort?: string;
  tools?: any[];
  memories?: string[];
}) {
  const {
    settings,
    summary,
    processedMessages,
    historyToKeep,
    location,
    reasoningEffort,
    tools,
    memories,
  } = params;

  const contextMessages = buildContextMessages({
    settings,
    location,
    reasoningEffort,
    summary,
    processedMessages,
    tools,
    memories,
    config: {
      memory: { status: "auto" },
      summary: { status: "auto" },
      outputFormat: { status: "auto" },
      rules: { status: "on" },
      tools: { status: "auto" },
    },
  });

  return {
    hasSummaryMemory: Boolean(summary?.trim()),
    currentMessages: [
      ...contextMessages,
      ...normalizeMessages(historyToKeep),
    ] as any[],
  };
}
