import { emitStatus, emitToolResult } from "@/server/agent/stream/emitter";
import type {
  ChatStreamConfig,
  CollectedToolCall,
  SendChunkFn,
  ToolExecutorsMap,
} from "@/server/agent/types";

export interface ToolResultMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Tools Layer — Executor
 *
 * Runs all tool calls in parallel and returns their results as
 * tool messages to be appended to the message context.
 *
 * Renamed from executeToolCalls → runTools.
 */
export async function runTools(
  toolCalls: CollectedToolCall[],
  sendChunk: SendChunkFn,
  userId?: string,
  executors: ToolExecutorsMap = {},
  provider?: string,
  model?: string,
  settings?: ChatStreamConfig["settings"],
  abortSignal?: AbortSignal,
  location?: ChatStreamConfig["location"],
): Promise<ToolResultMessage[]> {
  const toolPromises = toolCalls.map(async (toolCall) => {
    const functionName = toolCall.function.name;
    const executor = executors[functionName];

    if (!executor) {
      return {
        role: "tool" as const,
        tool_call_id: toolCall.id,
        name: functionName,
        content: JSON.stringify({
          error: `Tool executor not found for: ${functionName}. Please call each tool separately.`,
        }),
      };
    }

    let parsedArgs: unknown = {};

    try {
      if (abortSignal?.aborted) throw new Error("Aborted");

      parsedArgs = JSON.parse(toolCall.function.arguments) as unknown;

      const result = await executor(parsedArgs, {
        userId,
        provider,
        model,
        settings,
        location,
        signal: abortSignal,
        onStatusUpdate: (params) =>
          emitStatus(sendChunk, {
            ...params,
            toolCallId: toolCall.id,
            toolName: functionName,
          }),
      });

      emitToolResult(sendChunk, {
        toolCallId: toolCall.id,
        toolName: functionName,
        result,
        isError: false,
      });

      return {
        role: "tool" as const,
        tool_call_id: toolCall.id,
        name: functionName,
        content: JSON.stringify(result),
      };
    } catch (error) {
      const message = getErrorMessage(error);
      const errorData =
        parsedArgs && typeof parsedArgs === "object"
          ? { args: parsedArgs, error: message }
          : { error: message };

      console.log(`[Tool: ${functionName}] Error: ${message}`);

      emitStatus(sendChunk, {
        message: `Error executing ${functionName}: ${message}`,
        done: true,
        data: errorData,
        toolCallId: toolCall.id,
        toolName: functionName,
      });

      emitToolResult(sendChunk, {
        toolCallId: toolCall.id,
        toolName: functionName,
        result: errorData,
        isError: true,
      });

      return {
        role: "tool" as const,
        tool_call_id: toolCall.id,
        name: functionName,
        content: JSON.stringify({ error: message }),
      };
    }
  });

  return Promise.all(toolPromises);
}
