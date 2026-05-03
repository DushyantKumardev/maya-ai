import { buildTitleMessages } from "@/server/agent/prompt";
import { Settings } from "@/server/db/models/settings-model";
import Conversation from "@/server/db/models/conversation-model";
import connectDB from "@/server/db/mongo";
import createProvider from "@/server/agent/provider";
import { AppSettings} from "@/features/settings/types";

export type BackgroundJobType = "generate_title" | "sync_messages";

/**
 * Global Background Service Runner
 * Runs async tasks detached from the primary request thread to improve API speeds.
 */
export const BackgroundService = {
  dispatch: (jobName: BackgroundJobType, payload: { conversationId: string, userId: string, firstMessage: string }) => {
    // Detach promise so Vercel/Node doesn't block the request response
    Promise.resolve().then(async () => {
      try {
        await connectDB();
        
        switch (jobName) {
          case "generate_title":
            await handleGenerateTitle(payload);
            break;
        
        }
      } catch (e) {
        console.error(`[BackgroundService] Job '${jobName}' failed:`, e);
      }
    });
  }
};

/**
 * Handles automatic title generation
 */
async function handleGenerateTitle({ conversationId, userId, firstMessage }: { conversationId: string, userId: string, firstMessage: string }) {
  if (!firstMessage || !conversationId) return;
  const settings = await Settings.findOne({ userId }).lean() as AppSettings | null;
  if (!settings) return;

  const { provider: selectedProvider, modelId: selectedModel } = settings;

  try {
    const res = await createProvider(selectedProvider, settings as AppSettings).chat.completions.create({
      model: selectedModel,
      messages: buildTitleMessages(firstMessage) as any,
      ...(selectedProvider === "ollama" ? { reasoning_effort: "none" } : {})
    } as any); 

    const rawTitle = res.choices[0]?.message?.content || "New Conversation";
    const title = rawTitle.replace(/^["']|["']$/g, "").trim();

    if (title) {
      await Conversation.findOneAndUpdate(
        { _id: conversationId, userId },
        { $set: { title } }
      );
    }
  } catch (error: any) {
    console.log("Failed to generate title in background", error?.message);
  }
}

