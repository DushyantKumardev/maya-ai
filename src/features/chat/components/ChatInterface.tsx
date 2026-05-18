"use client";

import { useChatContext } from "@/features/chat/context/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { useEffect, useRef, useState } from "react";
import ChatInputBox from "./chat-input-box";
import { AlertCircle, ChevronDown } from "lucide-react";
import ChatHomepage from "./ChatHomepage";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Loader from "@/components/common/Loader";

const SelectionPopup = dynamic(() => import("./ui/SelectionPopup").then(mod => mod.default), { ssr: false });
const GlobalPlayer = dynamic(() => import("./parts/GlobalPlayer").then(mod => mod.GlobalPlayer), { ssr: false });

/**
 * ChatInterface — reads all state from ChatContext.
 * - When messages are empty: shows ChatHomepage (no navigation needed, URL updates via replaceState)
 * - When messages exist: shows the message list + bottom input
 *
 * This single component handles both the new-chat flow (/c → URL becomes /c/[id])
 * and the existing-chat flow (/c/[id] direct link via its own ChatProvider).
 */
export function ChatInterface() {
  const {
    messages,
    isLoading,
    isLoadingConversation,
    error,
    textInput,
    handleInputChange,
    handleSubmit,
    stop,
    isStreaming,
    setTextInput,
    reasoningEffort,
    setReasoningEffort,
    replyTo,
    setReplyTo,
  } = useChatContext();

  const { settings } = useSettings();
  const persistConversations = settings?.persistConversations !== false;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const wasStreamingRef = useRef(false);
  const userScrolledRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const parentContainer = scrollAreaRef.current;
    if (!parentContainer) return;

    const lastMessage = messages[messages.length - 1];
    const secondLast = messages[messages.length - 2];
    const shouldPinLastUser =
      lastMessage?.role === "assistant" &&
      lastMessage.content === "" &&
      secondLast?.role === "user";

    if (shouldPinLastUser) {
      // Lock scroll to top unless user has scrolled
      if (!userScrolledRef.current) {
        lastUserMessageRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      wasStreamingRef.current = isStreaming;
      return;
    }

    // When streaming just ended, reset scroll lock
    if (wasStreamingRef.current && !isStreaming) {
      userScrolledRef.current = false;
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }

    const isNearBottom =
      parentContainer.scrollHeight -
        parentContainer.scrollTop -
        parentContainer.clientHeight <
      150;
    if (isNearBottom && !userScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? "auto" : "smooth",
      });
    }

    wasStreamingRef.current = isStreaming;
  }, [messages, isStreaming]);

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollButton(!isAtBottom);

    // Detect user manual scroll while streaming
    if (isStreaming && scrollTop !== lastScrollTopRef.current) {
      userScrolledRef.current = true;
    }
    lastScrollTopRef.current = scrollTop;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col relative overflow-hidden">
      <GlobalPlayer />
      <SelectionPopup />

      {error && (
        <div className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}

      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="custom-scrollbar flex-1 overflow-y-auto relative"
        style={{ overflowAnchor: "none" }}
      >
        {isLoadingConversation ? (
          <Loader />
        ) : messages.length === 0 ? (
          <div className="flex flex-col h-full">
            {!persistConversations && (
              <div className="mx-auto mb-6 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 animate-in fade-in slide-in-from-top-2">
                <Ghost className="size-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                  Incognito Mode Active
                </span>
              </div>
            )}
            <ChatHomepage />
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {!persistConversations && (
              <div className="mx-auto mb-2 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 animate-in fade-in slide-in-from-top-1">
                <Ghost className="size-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                  Incognito Mode Active
                </span>
              </div>
            )}
            {messages.map((m: any, index: number) => {
              const isLastUser =
                m.role === "user" &&
                index === messages.findLastIndex((msg) => msg.role === "user");
              return (
                <div
                  key={m.id}
                  ref={isLastUser ? lastUserMessageRef : undefined}
                >
                  <ChatMessage message={m} index={index} />
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
        <div
          aria-hidden="true"
          style={{
            height:
              messages.length > 1 &&
              messages[messages.length - 1]?.role === "assistant" &&
              messages[messages.length - 1]?.content === ""
                ? 600
                : 0,
          }}
        />

        {/* Floating Scroll to Bottom Button */}
        {showScrollButton && (
          <div className="sticky bottom-4 left-0 right-0 flex justify-center pointer-events-none z-30">
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollToBottom}
              className="size-10 rounded-full shadow-lg border border-primary/20 bg-background/80 backdrop-blur-md pointer-events-auto hover:bg-primary/10 hover:text-primary transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
            >
              <ChevronDown className="size-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom input only shown when the chat has started */}
      {messages.length > 0 && (
        <div className="mx-auto w-full max-w-chat  pb-4 pt-3 px-2">
          <ChatInputBox
            textInput={textInput}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            isStreaming={isStreaming}
            setTextInput={setTextInput}
            reasoningEffort={reasoningEffort}
            setReasoningEffort={setReasoningEffort}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
          />
        </div>
      )}
    </div>
  );
}
