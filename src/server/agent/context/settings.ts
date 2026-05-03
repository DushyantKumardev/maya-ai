import { AppSettings, DEFAULT_SETTINGS } from "@/features/settings/types";
import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import type { ChatStreamConfig } from "@/server/agent/types";

/**
 * Context Layer — Step 2a: Settings Resolution
 *
 * Merges default settings → DB settings → client overrides,
 * and determines the active provider and model for this request.
 */
export async function resolveSettings(config: ChatStreamConfig) {
  const { userId, settings: clientSettings, provider, model } = config;

  let settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(clientSettings as Partial<AppSettings>),
  };

  if (userId) {
    await connectDB();
    const dbSettings = await Settings.findOne({ userId }).lean();

    if (dbSettings) {
      settings = {
        ...settings,
        ...(dbSettings as unknown as Partial<AppSettings>),
        ...(clientSettings as Partial<AppSettings>),
        apiKeys: {
          ...(dbSettings?.apiKeys instanceof Map
            ? Object.fromEntries(dbSettings.apiKeys)
            : typeof dbSettings?.apiKeys?.entries === "function"
              ? Object.fromEntries(dbSettings.apiKeys.entries())
              : dbSettings?.apiKeys || {}),
          ...Object.fromEntries(
            Object.entries((clientSettings as any)?.apiKeys || {}).filter(
              ([_, value]) => value !== "••••••••••••••••",
            ),
          ),
        },
      };
    }
  }

  return {
    settings,
    activeProvider: provider || settings.provider || "ollama",
    activeModel: model || settings.modelId,
  };
}
