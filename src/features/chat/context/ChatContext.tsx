"use client";

import { createContext, useContext } from "react";
import { Message } from "../hooks/use-chat-handler";
import type { ReasoningEffort } from "@/features/chat/types";

interface ChatContextType {
  messages: Message[];
  textInput: string;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (
    e?: React.FormEvent | null,
    imageData?: string | null,
    overrideContent?: string,
    files?: any[],
  ) => Promise<void>;
  regenerate: (assistantMessageId: string) => Promise<void>;
  isThinking: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  stop: () => void;
  error: string | null;
  setTextInput: React.Dispatch<React.SetStateAction<string>>;
  reasoningEffort: ReasoningEffort;
  setReasoningEffort: React.Dispatch<React.SetStateAction<ReasoningEffort>>;
  isLoadingConversation: boolean;
  replyTo: string | null;
  setReplyTo: React.Dispatch<React.SetStateAction<string | null>>;
}


const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * Hook to access the chat context.
 *
 * @returns The current ChatContextType value.
 * @throws Error if used outside of a ChatProvider.
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

export { ChatContext };
export type { ChatContextType };
