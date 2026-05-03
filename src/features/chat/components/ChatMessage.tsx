import React from "react";
import { cn } from "@/lib/utils/utils";
import MessageActions from "./message/MessageActions";
import { useChatContext } from "../context/ChatContext";
import { Message } from "../hooks/use-chat-handler";
import { Reply, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// UI Primitives
import {
  Message as MessageRoot,
  MessageContent,
  MessageBubble,
  MessageActionsContainer,
} from "@/components/common/MessageBubble";

// Modular Sub-components
import { MessageAttachments } from "./message/MessageAttachments";
import { MessageBody } from "./message/MessageBody";
import { MessageStatus } from "./message/MessageStatus";

interface ChatMessageProps {
  message: Message;
  index: number;
}

const ChatMessage = React.memo(function ChatMessage({
  message,
  index,
}: ChatMessageProps) {
  const { role, parts } = message;
  const { messages, isLoading, isThinking, isStreaming } = useChatContext();

  const isUser = role === "user";
  const isAssistant = role === "assistant";

  // Content normalization for actions
  const content = React.useMemo(() => {
    if (parts && parts.length > 0) {
      return parts
        .filter((p: any) => p.type === "content")
        .map((p: any) => p.content)
        .join("\n");
    }
    return message.content || "";
  }, [parts, message.content]);

  const showActions = !isLoading || index !== messages.length - 1;
  const isLastAssistant =
    isAssistant &&
    index === messages.findLastIndex((m) => m.role === "assistant");

  const hasContent = !!(content || (parts && parts.length > 0));

  const searchSuggestions = React.useMemo(() => {
    if (!isAssistant || !parts) return [];
    const searchPart = parts.find(
      (p: any) => p.type === "tool_result" && p.toolName === "web-search",
    ) as any;
    if (!searchPart || !searchPart.result) return [];
    return searchPart.result.peopleAlsoAsk || [];
  }, [isAssistant, parts]);

  const { handleSubmit } = useChatContext();

  return (
    <MessageRoot
      isUser={isUser}
      data-component="chat-message"
      className="animate-slide-in-from-bottom-4 px-4 py-3 md:px-0"
    >
      <MessageContent isUser={isUser}>
        <MessageAttachments message={message} isUser={isUser} />

        {message.replyTo && (
          <div className={cn(
            "mb-1 flex max-w-[85%] items-center gap-2 overflow-hidden rounded-2xl bg-white/5 px-3 py-2 text-xs backdrop-blur-sm ring-1 ring-white/10",
            isUser ? "ml-auto rounded-br-none" : "mr-auto rounded-bl-none"
          )}>
            <Reply className="h-3.5 w-3.5 shrink-0 opacity-60" />
            <span className="truncate text-foreground/60 italic">
              {message.replyTo}
            </span>
          </div>
        )}

        <MessageBubble isUser={isUser}>
          <MessageBody
            parts={parts}
            content={content}
            messageId={message.id}
            isThinking={isThinking && index === messages.length - 1}
            isStreaming={isStreaming && index === messages.length - 1}
          />

          <MessageStatus
            isLastAssistant={isLastAssistant}
            isLoading={isLoading}
            hasContent={hasContent}
            parts={parts}
          />
        </MessageBubble>

        {content && (
          <MessageActionsContainer
            isUser={isUser}
            className={cn(
              "my-1",
              showActions && (!isLastAssistant || !isStreaming)
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <MessageActions
              content={content}
              messageId={message.id}
              isAssistant={isAssistant}
              parts={parts}
            />
          </MessageActionsContainer>
        )}

        {/* ── Suggested Questions (Follow-ups) ── */}
        {isLastAssistant && searchSuggestions.length > 0 && !isStreaming && (
          <div className="mt-4 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-500">
            <div className="flex items-center gap-2 px-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/30">
                Suggestions
              </span>
              <div className="h-px flex-1 bg-border/30" />
            </div>
            <div className="flex flex-wrap gap-2">
              {searchSuggestions.slice(0, 3).map((paa: any, idx: number) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(null, null, paa.question)}
                  className="h-auto py-2.5 px-4 text-[12px] font-medium rounded-2xl border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/20 text-primary transition-all whitespace-normal text-left max-w-sm group/btn shadow-xs"
                >
                  <span className="flex-1">{paa.question}</span>
                  <ArrowUpRight 
                    size={13} 
                    className="ml-2 opacity-30 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all shrink-0" 
                  />
                </Button>
              ))}
            </div>
          </div>
        )}
      </MessageContent>
    </MessageRoot>
  );
});

export { ChatMessage };
