import type { Types } from "mongoose";
import type { AppSettings, ModelConfig } from "@/features/settings/types";
import type { UserLocation } from "@/hooks/use-location";

/**
 * ============================================================================
 * Shared Domain Types (Chat & AI)
 * ============================================================================
 */

export type AttachmentKind =
  | "image"
  | "text"
  | "code"
  | "document"
  | "spreadsheet"
  | "data"
  | "audio"
  | "video"
  | "other";

export interface MessageAttachment {
  id?: string;
  url?: string;
  path?: string;
  kind: AttachmentKind;
  mimeType: string;
  filename: string;
  size: number;
  extractedText?: string;
  previewText?: string;
  createdAt?: Date | string;
}

export type Attachment = MessageAttachment;
export type TextFile = MessageAttachment;

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export type MessagePart =
  | { type: "reasoning"; content: string }
  | {
      type: "status";
      messages: string[];
      done?: boolean;
      data?: unknown;
      toolCallId?: string;
      toolName?: string;
    }
  | {
      type: "tool_result";
      toolCallId: string;
      toolName: string;
      result: any;
      isError?: boolean;
    }
  | { type: "content"; content: string }
  | { type: "ask_user"; content: string; attributes?: Record<string, string> }
  | { type: "artifact"; content: string; attributes: Record<string, string> }
  | { type: "error"; text: string }
  | {
      type: "usage";
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

export type ReasoningEffort = "none" | "low" | "medium" | "high";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  status?: string;
  image?: string;
  files?: MessageAttachment[];
  parts?: MessagePart[];
  model?: string;
  provider?: string;
  tool_calls?: ToolCall[];
  replyTo?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  createdAt?: Date | string;
}

/**
 * A conversation document as stored in MongoDB.
 */
export interface Conversation {
  userId: Types.ObjectId;
  title: string;
  messages: Message[];
  summary?: string;
  summarizedCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ============================================================================
 * API Contract Types (Composed from Domain Types)
 * ============================================================================
 */

/** Request body for POST /api/chat */
export interface ChatRequest {
  messages: Message[];
  model: string;
  provider: string;
  modelConfig?: Partial<ModelConfig>;
  reasoningEffort?: ReasoningEffort;
  settings?: Partial<AppSettings>;
  conversationId?: string;
  location?: UserLocation;
}
