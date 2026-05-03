import React from "react";
import PartsRenderer from "../parts/PartsRenderer";
import Markdown from "../MarkdownMessages";
import { MessagePart } from "../../hooks/use-chat-handler";

interface MessageBodyProps {
  parts?: MessagePart[];
  content?: string;
  messageId: string;
  isThinking: boolean;
  isStreaming?: boolean;
}

export function MessageBody({
  parts,
  content,
  messageId,
  isThinking,
  isStreaming,
}: MessageBodyProps) {
  if (parts && parts.length > 0) {
    return (
      <PartsRenderer
        parts={parts}
        messageId={messageId}
        isThinking={isThinking}
        isStreaming={isStreaming}
      />
    );
  }

  if (content) {
    return (
      <div className="text-[15px] leading-[1.7] prose prose-sm dark:prose-invert max-w-none">
        <Markdown>{content}</Markdown>
      </div>
    );
  }

  return null;
}
