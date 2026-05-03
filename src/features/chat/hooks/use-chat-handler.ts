import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { useUserLocation } from "@/features/chat/context/LocationContext";
import { CHAT_COMPLETION_BEEP } from "@/lib/constants/audio";
import { playAudio } from "@/lib/utils/audio";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type {
  Message,
  MessageAttachment,
  MessagePart,
  ToolCall,
  ReasoningEffort
} from "@/features/chat/types";

export type { Message, MessagePart };

interface UseChatHandlerOptions {
  conversationId?: string;
}

function getTextContentFromParts(parts?: MessagePart[]) {
  if (!Array.isArray(parts)) return "";

  return parts
    .filter((part) => part.type === "content")
    .map((part) => part.content)
    .join("");
}

function normalizeMessageContent(message: Message): Message {
  if (message.content || !message.parts?.length) {
    return message;
  }

  const reconstructedContent = getTextContentFromParts(message.parts);
  return reconstructedContent
    ? { ...message, content: reconstructedContent }
    : message;
}

/**
 * Manages the entire chat lifecycle:
 * - Local state (messages, inputs, loading states).
 * - Server communication (streaming responses, saving history).
 * - Conversation management (CRUD operations).
 */
export function useChatHandler(options: UseChatHandlerOptions = {}) {
  const { settings } = useSettings();
  const { location } = useUserLocation();
  const { data: session, status } = useSession();

  // State Variables
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(
    !!options.conversationId && options.conversationId !== "new",
  );
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(options.conversationId === "new" ? null : options.conversationId || null);
  const searchParams = useSearchParams();
  const searchThink = searchParams.get("think");
  const searchReasoning = searchParams.get(
    "reasoning",
  ) as ReasoningEffort | null;
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>(
    searchThink === "false"
      ? "none"
      : searchReasoning || (searchThink === "true" ? "medium" : "none"),
  );
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Keep messagesRef in sync with state on every render
  messagesRef.current = messages;

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fetches an existing conversation (messages & metadata) from the server.
   */
  const loadConversation = useCallback(async (id: string) => {
    if (status !== "authenticated") return;

    if (id.startsWith("ephemeral_")) {
      setIsLoadingConversation(false);
      return;
    }
    setIsLoadingConversation(true);
    try {
      const res = await fetch(API_ENDPOINTS.CONVERSATIONS.BY_ID(id));
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setMessages((data.messages || []).map(normalizeMessageContent));
      setCurrentConversationId(id);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load conversation";
      console.error("Error loading conversation:", err);
      setError(message);
    } finally {
      setIsLoadingConversation(false);
    }
  }, [status]);

  useEffect(() => {
    if (options.conversationId && options.conversationId !== "new") {
      loadConversation(options.conversationId);
    }
  }, [options.conversationId, loadConversation]);

  /**
   * Persists the current message history to the database via PATCH.
   */
  const saveMessages = useCallback(
    async (conversationId: string, msgs: Message[]) => {
      if (conversationId.startsWith("ephemeral_") || settings?.persistConversations === false) {
        return;
      }
      try {
        const normalizedMessages = msgs.map(normalizeMessageContent);
        const res = await fetch(API_ENDPOINTS.CONVERSATIONS.BY_ID(conversationId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: normalizedMessages }),
        });
        if (!res.ok) {
          const errBody = await res.text().catch(() => "(no body)");
          console.error(`[saveMessages] HTTP ${res.status} — ${errBody}`);
        }
      } catch (err) {
        console.error("[saveMessages] Network error:", err);
      }
    },
    [settings?.persistConversations],
  );

  /**
   * Creates a new conversation document on the server.
   * Returns the new Location ID.
   */
  const createConversation = async (title: string): Promise<string | null> => {
    try {
      const res = await fetch(API_ENDPOINTS.CONVERSATIONS.BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      const data = await res.json();
      return data.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      return null;
    }
  };

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setTextInput(e.target.value);
  }, []);

  /**
   * Helper for stream errors
   */
  const handleStreamError = useCallback(
    (err: unknown, assistantMessageId: string) => {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      // If error, remove the optimistic assistant message so it doesn't stay stuck
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMessageId),
      );

      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Chat error:", err);
    },
    [],
  );

  /**
   * Core Streaming Logic
   */
  const streamAssistantResponse = useCallback(
    async (
      messagesToSend: Message[],
      conversationId: string,
      resumeMessageId?: string,
      overrideConversationId?: string,
    ) => {
      const activeConvId = overrideConversationId || conversationId;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const assistantMessageId = resumeMessageId || (Date.now() + 1).toString();

      if (!resumeMessageId) {
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      const assistantResponse = {
        parts: resumeMessageId
          ? messagesToSend.find((m) => m.id === resumeMessageId)?.parts || []
          : ([] as MessagePart[]),
        tool_calls: (resumeMessageId
          ? messagesToSend.find((m) => m.id === resumeMessageId)
              ?.tool_calls || []
          : []) as ToolCall[],
        usage: resumeMessageId
          ? messagesToSend.find((m) => m.id === resumeMessageId)?.usage
          : undefined,
        model: settings.modelId,
        provider: settings.provider,
      };

      const finalizeAndSave = async () => {
        const latestMessages = messagesRef.current;
        let finalMessages: Message[];
        if (resumeMessageId) {
          finalMessages = latestMessages.map((m) =>
            m.id === resumeMessageId
              ? {
                  ...m,
                  content: getTextContentFromParts(assistantResponse.parts),
                  parts: assistantResponse.parts,
                  tool_calls: assistantResponse.tool_calls,
                  model: assistantResponse.model,
                  provider: assistantResponse.provider,
                }
              : m,
          );
        } else {
          finalMessages = [
            ...latestMessages.filter((m) => m.id !== assistantMessageId),
            {
              id: assistantMessageId,
              role: "assistant",
              content: getTextContentFromParts(assistantResponse.parts),
              parts: assistantResponse.parts,
              tool_calls: assistantResponse.tool_calls,
              usage: assistantResponse.usage,
              model: assistantResponse.model,
              provider: assistantResponse.provider,
              createdAt: new Date(),
            },
          ];
        }

        await saveMessages(activeConvId, finalMessages);
        window.dispatchEvent(new CustomEvent("conversation-updated"));
        
        if (finalMessages.length === 2) {
          setTimeout(
            () => window.dispatchEvent(new CustomEvent("conversation-updated")),
            3500,
          );
        }
      };

      try {
        const response = await fetch(API_ENDPOINTS.CHAT.STREAM, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            messages: messagesToSend.map((m) => {
              const msg: any = { role: m.role };
              if (m.image) {
                const contentParts: any[] = [];
                if (m.content)
                  contentParts.push({ type: "text", text: m.content });
                contentParts.push({
                  type: "image_url",
                  image_url: { url: m.image },
                });
                msg.content = contentParts;
              } else {
                msg.content =
                  m.content || getTextContentFromParts(m.parts) || "";
              }
              if (m.files?.length) msg.files = m.files;
              if (m.image) msg.image = m.image;
              if (m.parts) msg.parts = m.parts;
              if (m.replyTo) msg.replyTo = m.replyTo;
              if (m.tool_calls) msg.tool_calls = m.tool_calls;
              if ((m as any).tool_call_id)
                msg.tool_call_id = (m as any).tool_call_id;
              if ((m as any).name) msg.name = (m as any).name;
              return msg;
            }),
            provider: settings.provider,
            model: settings.modelId,
            modelConfig: settings.config,
            settings,
            reasoningEffort,
            conversationId: activeConvId || undefined,
            location,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();

        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkValue = decoder.decode(value, { stream: true });
          if (chunkValue) setIsStreaming(true);
          buffer += chunkValue;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              const lastPart =
                assistantResponse.parts[assistantResponse.parts.length - 1];

              if (event.type === "reasoning" && event.text) {
                setIsThinking(true);
                if (lastPart?.type === "reasoning")
                  lastPart.content += event.text;
                else
                  assistantResponse.parts.push({
                    type: "reasoning",
                    content: event.text,
                  });
              } else if (event.type === "content" && event.text) {
                setIsThinking(false);
                const currentLastPart =
                  assistantResponse.parts[assistantResponse.parts.length - 1];
                if (currentLastPart?.type === "content")
                  currentLastPart.content += event.text;
                else
                  assistantResponse.parts.push({
                    type: "content",
                    content: event.text,
                  });
              } else if (event.type === "ask_user" && event.text) {
                setIsThinking(false);
                const currentLastPart =
                  assistantResponse.parts[assistantResponse.parts.length - 1];
                if (currentLastPart?.type === "ask_user") {
                  currentLastPart.content += event.text;
                  if (event.attributes) {
                    currentLastPart.attributes = { ...currentLastPart.attributes, ...event.attributes };
                  }
                } else {
                  assistantResponse.parts.push({
                    type: "ask_user",
                    content: event.text,
                    attributes: event.attributes || {},
                  });
                }
              } else if (event.type === "summary_status" && event.message) {
                const summaryStatusPart = assistantResponse.parts.find(
                  (p) => p.type === "status" && p.toolName === "summarizer",
                );
                if (summaryStatusPart && summaryStatusPart.type === "status") {
                  summaryStatusPart.messages.push(event.message);
                  summaryStatusPart.done = event.done ?? summaryStatusPart.done;
                } else {
                  assistantResponse.parts.push({
                    type: "status",
                    messages: [event.message],
                    done: event.done || false,
                    toolName: "summarizer",
                  });
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, status: event.message }
                      : msg,
                  ),
                );
              } else if (event.status || event.type === "status") {
                const statusMsg = event.status || event.message;
                let matchingPart;
                if (event.toolCallId) {
                  matchingPart = assistantResponse.parts.find(
                    (p) =>
                      p.type === "status" &&
                      (p as any).toolCallId === event.toolCallId,
                  );
                }
                if (!matchingPart)
                  matchingPart =
                    lastPart?.type === "status" ? lastPart : undefined;

                if (matchingPart && matchingPart.type === "status") {
                  matchingPart.messages.push(statusMsg);
                  if (event.done !== undefined) matchingPart.done = event.done;
                  if (event.data !== undefined) matchingPart.data = event.data;
                } else {
                  assistantResponse.parts.push({
                    type: "status",
                    messages: [statusMsg],
                    done: event.done || false,
                    data: event.data,
                    toolCallId: event.toolCallId,
                    toolName: event.toolName,
                  });
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, status: statusMsg }
                      : msg,
                  ),
                );
              } else if (event.type === "tool_result") {
                // Handle the new tool_result event
                assistantResponse.parts.push({
                  type: "tool_result",
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  result: event.result,
                  isError: event.isError || false,
                });
              } else if (event.type === "error" && event.text) {
                setIsThinking(false);
                assistantResponse.parts.push({
                  type: "error",
                  text: event.text,
                });
              } else if (event.type === "artifact" && event.text) {
                setIsThinking(false);
                const currentLastPart =
                  assistantResponse.parts[assistantResponse.parts.length - 1];
                if (currentLastPart?.type === "artifact") {
                  currentLastPart.content += event.text;
                  if (event.attributes) {
                    currentLastPart.attributes = { ...currentLastPart.attributes, ...event.attributes };
                  }
                } else {
                  assistantResponse.parts.push({
                    type: "artifact",
                    content: event.text,
                    attributes: event.attributes || {},
                  });
                }
              } else if (event.type === "usage" && event.usage)
                assistantResponse.usage = event.usage;
              else if (event.type === "metadata") {
                (assistantResponse as any).model = event.model;
                (assistantResponse as any).provider = event.provider;
              }
            } catch (e) {
              console.error("Failed to parse chat stream chunk:", e);
            }
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: getTextContentFromParts(assistantResponse.parts),
                    parts: [...assistantResponse.parts],
                    tool_calls:
                      assistantResponse.tool_calls.length > 0
                        ? [...assistantResponse.tool_calls]
                        : msg.tool_calls,
                    usage: assistantResponse.usage,
                  }
                : msg,
            ),
          );
        }

        if (!abortControllerRef.current?.signal.aborted) {
          await finalizeAndSave();
        }

      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          await finalizeAndSave();
          return;
        }
        handleStreamError(err, assistantMessageId);
      } finally {
        setIsStreaming(false);
        setIsThinking(false);
        abortControllerRef.current = null;
        setIsLoading(false);
        playAudio(CHAT_COMPLETION_BEEP);
      }
    },
    [settings, reasoningEffort, saveMessages, handleStreamError, location],
  );

  /**
   * Handles form submission (User sends a message).
   */
  const uploadAttachment = useCallback(
    async (payload: {
      file: string;
      filename?: string;
      mimeType?: string;
      size?: number;
      extractedText?: string;
    }): Promise<MessageAttachment | null> => {
      try {
        const uploadRes = await fetch(API_ENDPOINTS.ATTACHMENTS.BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed with status ${uploadRes.status}`);
        }

        const data = await uploadRes.json();
        const attachment = data.attachment || null;
        if (attachment && !attachment.id && attachment._id) {
          attachment.id = attachment._id;
        }
        return attachment;
      } catch (err) {
        console.error("Error uploading attachment:", err);
        return null;
      }
    },
    [],
  );

  const sendMessage = useCallback(async (
    content: string,
    imageData?: string | null,
    files: Array<
      Pick<
        MessageAttachment,
        "filename" | "mimeType" | "size" | "extractedText"
      > & {
        dataUrl: string;
      }
    > = [],
  ) => {
    // Proactive Auth Check: Ensure user is logged in before processing any message
    if (status === "unauthenticated" || !session) {
      toast.error("Your session has expired. Please log in to continue.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
      return;
    }

    if ((!content.trim() && !imageData && files.length === 0) || isLoading)
      return;

    let attachmentUrl = null;
    if (imageData) {
      const imageAttachment = await uploadAttachment({
        file: imageData,
        mimeType: "image/jpeg",
      });
      attachmentUrl = imageAttachment?.url || null;
    }

    // 2. Upload and get URLs
    const uploadedFiles = (
      await Promise.all(
        files.map((file) =>
          uploadAttachment({
            file: file.dataUrl,
            filename: file.filename,
            mimeType: file.mimeType,
            size: file.size,
            extractedText: file.extractedText,
          }),
        ),
      )
    ).filter(Boolean) as MessageAttachment[];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content,
      replyTo: replyTo || undefined,
      ...(attachmentUrl ? { image: attachmentUrl } : {}),
      ...(uploadedFiles.length ? { files: uploadedFiles } : {}),
      model: settings.modelId,
      provider: settings.provider,
      createdAt: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setTextInput("");
    setReplyTo(null); // Clear replyTo after sending
    setIsLoading(true);
    setError(null);

    let activeConversationId = currentConversationId;
    if (!activeConversationId) {
      const titleSeed =
        content ||
        uploadedFiles[0]?.filename ||
        (attachmentUrl ? "Image conversation" : "New conversation");
      const title =
        titleSeed.length > 50 ? titleSeed.substring(0, 50) + "..." : titleSeed;
      activeConversationId = await createConversation(title);
      if (!activeConversationId) {
        setError("Failed to create conversation");
        setIsLoading(false);
        setMessages(messages);
        return;
      }
      setCurrentConversationId(activeConversationId);
      window.dispatchEvent(new CustomEvent("conversation-updated"));
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("title-generating", {
            detail: { id: activeConversationId },
          }),
        );
      }, 100);
    }

    await streamAssistantResponse(
      updatedMessages,
      activeConversationId,
      assistantMessageId,
      activeConversationId,
    );
  }, [
    isLoading,
    messages,
    replyTo,
    settings.modelId,
    settings.provider,
    currentConversationId,
    session,
    status,
    uploadAttachment,
    streamAssistantResponse
  ]);

  const handleSubmit = useCallback(async (
    e?: React.FormEvent | null,
    imageData?: string | null,
    overrideContent?: string,
    files?: Array<
      Pick<
        MessageAttachment,
        "filename" | "mimeType" | "size" | "extractedText"
      > & {
        dataUrl: string;
      }
    >,
  ) => {
    e?.preventDefault();
    const content = overrideContent || textInput;
    if (!content.trim() && !imageData && !(files && files.length > 0)) return;
    await sendMessage(content, imageData, files || []);
  }, [textInput, sendMessage]);

  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      if (isLoading || !currentConversationId) return;
      const idx = messages.findLastIndex((m) => m.id === assistantMessageId);
      if (idx === -1) return;
      const history = messages.slice(0, idx);
      setMessages(history);
      setIsLoading(true);
      setError(null);
      await streamAssistantResponse(history, currentConversationId);
    },
    [isLoading, messages, currentConversationId, streamAssistantResponse],
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    setIsThinking(false);
  }, []);

  const resetChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setTextInput("");
    setReplyTo(null);
    setIsLoading(false);
    setIsStreaming(false);
    setIsThinking(false);
    setError(null);
    setCurrentConversationId(null);
    setIsLoadingConversation(false);
  }, []);

  useEffect(() => {
    if (
      options.conversationId &&
      messages.length === 0 &&
      !isLoadingConversation
    ) {
      const params = new URLSearchParams(window.location.search);
      const initialQuery = params.get("q");
      const pendingImage = sessionStorage.getItem("pending_image");
      if ((initialQuery && initialQuery.trim()) || pendingImage) {
        sendMessage(initialQuery || "", pendingImage, []);
        if (pendingImage) sessionStorage.removeItem("pending_image");
        window.history.replaceState(null, "", `/c/${options.conversationId}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.conversationId, isLoadingConversation]);

  return {
    messages,
    textInput,
    handleInputChange,
    handleSubmit,
    regenerate,
    isThinking,
    isLoading,
    isLoadingConversation,
    isStreaming,
    stop,
    error,
    currentConversationId,
    setTextInput,

    reasoningEffort,
    setReasoningEffort,
    resetChat,
    replyTo,
    setReplyTo,
  };
}
