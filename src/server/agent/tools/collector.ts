import type { CollectedToolCall, ToolCallCollectionResult, StreamDelta } from "@/server/agent/types";

/**
 * Tools Layer — Collector
 *
 * Accumulates streamed tool-call deltas into complete, usable tool-call
 * objects. The OpenAI streaming format sends tool calls in increments
 * (id → name chunks → argument chunks) — this merges them back together.
 *
 * Renamed from createToolCallCollector → createToolCollector.
 */
export function createToolCollector() {
  const toolCallsMap = new Map<number, CollectedToolCall>();
  let isCollecting = false;

  return {
    /**
     * Feed a single tool_calls delta chunk.
     * @returns true if the chunk was a tool-call delta (consumed),
     *          false if it wasn't (caller should process as content).
     */
    processChunk: (delta: StreamDelta): boolean => {
      if (!delta?.tool_calls || !Array.isArray(delta.tool_calls)) return false;

      isCollecting = true;

      for (const chunk of delta.tool_calls) {
        const index = chunk.index !== undefined ? chunk.index : 0;
        let toolCall = toolCallsMap.get(index);

        if (!toolCall) {
          toolCall = {
            id: chunk.id || "",
            function: {
              name: chunk.function?.name || "",
              arguments: chunk.function?.arguments || "",
            },
            type: "function",
          };
          toolCallsMap.set(index, toolCall);
        } else {
          if (chunk.id) toolCall.id = chunk.id;
          if (chunk.function?.name) toolCall.function.name += chunk.function.name;
          if (chunk.function?.arguments) toolCall.function.arguments += chunk.function.arguments;
        }
      }

      return true;
    },

    finalise: (): ToolCallCollectionResult => {
      const toolCalls = Array.from(toolCallsMap.values());
      return {
        toolCalls,
        hasToolCalls: isCollecting && toolCalls.length > 0,
      };
    },
  };
}
