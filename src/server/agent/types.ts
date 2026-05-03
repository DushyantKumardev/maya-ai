import { AppSettings } from "@/features/settings/types";
import { Message } from "@/features/chat/types";
import type { ReasoningEffort } from "@/features/chat/types";

/**
 * ============================================================================
 * Agent — Shared Type Contracts
 * ============================================================================
 * Central home for all types shared across pipeline layers.
 * Previously scattered in streaming/types.ts.
 */

/** Enqueues a typed JSON event into the ReadableStream. */
export type SendChunkFn = (data: StreamEvent) => void;

// ─── Message Content Parts ────────────────────────────────────────────────────

export type TextContentPart = {
  type: "text";
  text: string;
};

export type ImageUrlContentPart = {
  type: "image_url";
  image_url: { url: string };
};

export type ProviderContentPart = TextContentPart | ImageUrlContentPart;

export interface StreamMessageInput extends Omit<Message, "content"> {
  content: string | ProviderContentPart[];
}

// ─── Stream Events ────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: "reasoning"; text: string }
  | { type: "content"; text: string }
  | { type: "ask_user"; text: string; attributes?: Record<string, string> }
  | {
      type: "status";
      message: string;
      toolName?: string;
      done?: boolean;
      data?: unknown;
      toolCallId?: string;
    }
  | { type: "summary_status"; message: string; done?: boolean }
  | {
      type: "usage";
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    }
  | { type: "error"; text: string }
  | {
      type: "tool_result";
      toolCallId: string;
      toolName: string;
      result: any;
      isError?: boolean;
    }
  | { type: "artifact"; text: string; attributes: Record<string, string> }
  | { type: "metadata"; model: string; provider: string };

// ─── LLM Stream Delta ────────────────────────────────────────────────────────

export interface StreamDelta {
  content?: string | null;
  reasoning?: string | null;
  tool_calls?: any[];
  role?: string;
  index?: number;
}

// ─── Tool Call Types ──────────────────────────────────────────────────────────

/** A fully-assembled tool call after all streamed deltas have been merged. */
export interface CollectedToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
  type: "function";
}

export interface ToolCallCollectionResult {
  toolCalls: CollectedToolCall[];
  hasToolCalls: boolean;
}

// ─── Tool Executor ────────────────────────────────────────────────────────────

export interface ToolExecutorContext {
  userId?: string;
  provider?: string;
  model?: string;
  settings?: Partial<AppSettings>;
  signal?: AbortSignal;
  location?: ChatStreamConfig["location"];
  onStatusUpdate?: (params: {
    message: string;
    done?: boolean;
    data?: unknown;
    toolCallId?: string;
    toolName?: string;
  }) => void;
}

export type ToolExecutorsMap = Record<
  string,
  (args: unknown, context: ToolExecutorContext) => Promise<unknown>
>;

// ─── Chat Stream Config ───────────────────────────────────────────────────────

/** Config passed into the chat orchestrator from the API route. */
export interface ChatStreamConfig {
  messages: Message[];
  model: string;
  provider: string;
  reasoning_effort?: ReasoningEffort;
  abortSignal?: AbortSignal;
  modelConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
  };
  userId?: string;
  settings?: Partial<AppSettings>;
  conversationId?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    provider: "ip" | "browser";
  };
}
