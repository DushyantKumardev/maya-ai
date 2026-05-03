import type { SendChunkFn } from "@/server/agent/types";

/**
 * Stream Layer — Emitter
 *
 * Helper functions that emit typed events into the ReadableStream.
 * Renamed from status-events-emitter.ts → emitter.ts
 * Functions renamed: emitStatusEvent → emitStatus, emitToolResultEvent → emitToolResult.
 */

export interface StatusEventParams {
  message: string;
  done?: boolean;
  data?: unknown;
  toolCallId?: string;
  toolName?: string;
}

export const emitStatus = (sendChunk: SendChunkFn, params: StatusEventParams) => {
  sendChunk({
    type: "status",
    message: params.message,
    done: params.done || false,
    data: params.data,
    toolCallId: params.toolCallId,
    toolName: params.toolName,
  });
};

export interface ToolResultEventParams {
  toolCallId: string;
  toolName: string;
  result: any;
  isError?: boolean;
}

export const emitToolResult = (sendChunk: SendChunkFn, params: ToolResultEventParams) => {
  sendChunk({
    type: "tool_result",
    toolCallId: params.toolCallId,
    toolName: params.toolName,
    result: params.result,
    isError: params.isError || false,
  });
};
