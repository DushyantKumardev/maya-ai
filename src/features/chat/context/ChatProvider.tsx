"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useChatHandler } from "../hooks/use-chat-handler";
import { ChatContext } from "./ChatContext";

interface ChatProviderProps {
  conversationId?: string;
  children: React.ReactNode;
}

/**
 * ChatProvider — lifts useChatHandler state to the layout level.
 */
export function ChatProvider({ conversationId, children }: ChatProviderProps) {
  const router = useRouter();
  const {
    messages,
    isLoading,
    error,
    textInput,
    handleInputChange,
    handleSubmit,
    stop,
    isStreaming,
    isThinking,
    regenerate,
    currentConversationId,
    setTextInput,
    reasoningEffort,
    setReasoningEffort,
    resetChat,
    isLoadingConversation,
    replyTo,
    setReplyTo,
  } = useChatHandler({ conversationId });

  // Update browser URL once the server creates a conversation id (new chat flow only or ephemeral upgrade)
  useEffect(() => {
    if (
      currentConversationId &&
      (window.location.pathname === "/c" ||
        window.location.pathname === "/c/new" ||
        window.location.pathname.startsWith("/c/ephemeral_"))
    ) {
      window.history.replaceState(null, "", `/c/${currentConversationId}`);
      window.dispatchEvent(new CustomEvent("url-changed"));
    }
  }, [currentConversationId]);

  const pathname = usePathname();

  // Reset chat on "new-chat" event
  useEffect(() => {
    const handleNewChat = () => {
      resetChat();
      router.push("/c");
    };
    window.addEventListener("new-chat", handleNewChat);
    return () => window.removeEventListener("new-chat", handleNewChat);
  }, [router, resetChat]);

  // Also reset if user manually navigates back to /c and we still have old state
  useEffect(() => {
    if (
      pathname === "/c" &&
      currentConversationId &&
      !isLoadingConversation &&
      !isLoading &&
      !isStreaming
    ) {
      resetChat();
    }
  }, [
    pathname,
    currentConversationId,
    resetChat,
    isLoadingConversation,
    isLoading,
    isStreaming,
  ]);

  const contextValue = useMemo(() => ({
    messages,
    isLoading,
    error,
    textInput,
    handleInputChange,
    handleSubmit,
    regenerate,
    stop,
    isStreaming,
    isThinking,
    reasoningEffort,
    setReasoningEffort,
    setTextInput,
    isLoadingConversation,
    replyTo,
    setReplyTo,
  }), [
    messages,
    isLoading,
    error,
    textInput,
    handleInputChange,
    handleSubmit,
    regenerate,
    stop,
    isStreaming,
    isThinking,
    reasoningEffort,
    setReasoningEffort,
    setTextInput,
    isLoadingConversation,
    replyTo,
    setReplyTo,
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}
