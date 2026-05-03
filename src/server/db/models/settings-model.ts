// features/settings/models/settings.ts
import mongoose from "mongoose";

/**
 * Mongoose Schema for User Settings (Version 3).
 */

const ModelConfigSchema = new mongoose.Schema({
  temperature: { type: Number, default: 0.7 },
  topP: { type: Number, default: 0.9 },
  topK: { type: Number, default: 40 },
  maxTokens: { type: Number, default: 4096 },
  frequencyPenalty: { type: Number, default: 0 },
}, { _id: false });

const MemorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, { _id: false });

const ToolConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  apiKeyRef: { type: String, required: false },
}, { _id: false });

const SettingsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },

    // Appearance
    locale: { type: String, default: "en-US" },

    // Model
    provider: { type: String, default: "ollama" },
    modelId: { type: String, default: "qwen3:1.7b" },
    config: { type: ModelConfigSchema, default: () => ({}) },

    // Instructions
    persona: { type: String, default: "You are Maya, a helpful and context-aware AI assistant." },
    userContext: { type: String, default: "" },
    outputFormat: { type: String, default: "" },
    memories: { type: [MemorySchema], default: [] },

    // Connectivity
    emailProvider: { type: String, enum: ["gmail", "resend"], default: "gmail" },
    gmailEmail: { type: String, default: "" },
    resendEmail: { type: String, default: "" },
    apiKeys: { type: Map, of: String, default: () => ({}) }, // All values encrypted

    // Capabilities
    tools: { type: Map, of: ToolConfigSchema, default: () => ({}) },

    // History
    persistConversations: { type: Boolean, default: true },
    maxMessagesPerConversation: { type: Number, default: 20 },
    summarizeAfter: { type: Number, default: 10 },

    // Privacy
    telemetry: { type: Boolean, default: false },


    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Force refresh the model in development to pick up schema changes
if (process.env.NODE_ENV === "development" && mongoose.models.Settings) {
  delete mongoose.models.Settings;
}

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
