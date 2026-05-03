import React from "react";
import { Indicator } from "@/components/common/Indicator";
import { MessagePart } from "../../hooks/use-chat-handler";

interface MessageStatusProps {
  isLastAssistant: boolean;
  isLoading: boolean;
  hasContent: boolean;
  parts?: MessagePart[];
}

/**
 * MessageStatus
 *
 * Renders the current state of a message:
 * 1. Active tool statuses (e.g. "Searching the web") - hides when done.
 * 2. Initial loading indicator if no content/parts yet.
 */
export function MessageStatus({ 
  isLastAssistant, 
  isLoading, 
  hasContent, 
  parts 
}: MessageStatusProps) {
  // Only show status for the last assistant message while it's loading
  if (!isLastAssistant || !isLoading) return null;


  // 2. Fallback: Show simple pulse indicator if we have no content and no active reasoning/status yet
  const hasReasoning = parts?.some(p => p.type === "reasoning");
  
  if (!hasContent && !hasReasoning) {
    return (
      <div className="flex items-center gap-2 py-2 px-1">
        <Indicator />
      </div>
    );
  }

  return null;
}
