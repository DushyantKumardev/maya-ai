import { DEFAULT_SETTINGS } from "@/features/settings/types";
import ConversationModel from "@/server/db/models/conversation-model";
import connectDB from "@/server/db/mongo";
import { preprocessImages } from "@/server/agent/context/vision";
import { generateSummary } from "@/server/agent/memory/summarizer";
import type { Message } from "@/features/chat/types";
import type { ChatStreamConfig, SendChunkFn } from "@/server/agent/types";

/**
 * Context Layer — Step 2b: History Loading
 *
 * Loads the conversation from DB, runs vision preprocessing on messages,
 * and triggers summarization if history exceeds the configured threshold.
 */
export async function loadChatHistory(params: {
  config: ChatStreamConfig;
  settings: any;
  activeProvider: string;
  activeModel: string;
  sendChunk: SendChunkFn;
}) {
  const { config, settings, activeProvider, activeModel, sendChunk } = params;
  const { messages, conversationId, model } = config;

  const maxHistory =
    settings?.maxMessagesPerConversation ??
    DEFAULT_SETTINGS.maxMessagesPerConversation;
  const summarizeAfter =
    settings?.summarizeAfter ?? DEFAULT_SETTINGS.summarizeAfter;
  const shouldSummarize = summarizeAfter > 0;
  const persistConversations = settings?.persistConversations !== false;

  let summary = "";
  let conversation: any = null;

  if (conversationId && persistConversations) {
    await connectDB();
    conversation = await ConversationModel.findById(conversationId);
    summary = conversation?.summary || "";
  }

  const processedMessages = await preprocessImages(messages);

  let historyToKeep = processedMessages;

  if (processedMessages.length > maxHistory) {
    historyToKeep = processedMessages.slice(-maxHistory);
    const oldMessages = processedMessages.slice(0, -maxHistory);
    const alreadySummarized = conversation?.summarizedCount || 0;
    const pendingSummaryCount = oldMessages.length - alreadySummarized;

    if (shouldSummarize && pendingSummaryCount >= summarizeAfter) {
      const newOldMessages = oldMessages.slice(alreadySummarized);

      if (newOldMessages.length > 0) {
        const newSummary = await generateSummary({
          messages: newOldMessages as Message[],
          existingSummary: summary,
          provider: activeProvider,
          model: activeModel,
          settings,
          reasoning_effort: "none",
          onStatusUpdate: ({ message, done = false }) => {
            sendChunk({ type: "summary_status", message, done });
          },
        });

        if (newSummary && newSummary !== summary) {
          summary = newSummary;
          if (conversation) {
            conversation.summary = summary;
            conversation.summarizedCount = oldMessages.length;
            await conversation.save();
          }
        }
      }
    }
  }

  return { summary, processedMessages, historyToKeep };
}
