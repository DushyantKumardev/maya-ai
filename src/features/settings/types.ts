// src/types/settings.ts

/**
 * ============================================================================
 * Settings & Provider Types — Single Source of Truth
 * ============================================================================
 */

/** A system-level AI provider (hard-coded, not user-editable). */
export interface SystemProvider {
  name: string;
  value: string;
  baseURL: string;
  apiKey?: string;
}

/** Per.model generation parameters. */
export interface ModelConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  frequencyPenalty: number;
}

/** Default generation parameters. */
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 4096,
  frequencyPenalty: 0,
};

/** Gmail credentials stored securely in the DB. */
export interface GmailCredentials {
  email: string;
  /** Gmail App Password (not the account password). Stored encrypted in DB. */
  appPassword: string;
}

/** A single structured memory fact. */
export interface Memory {
  id: string;
  content: string;
  createdAt: string;
}

/** 
 * The full application settings shape (persisted per user).
 */
export interface AppSettings {

  // Appearance
  theme: "light" | "dark" | "system";
  locale: string;

  // Model
  provider: string;
  modelId: string;
  config: ModelConfig;

  // Instructions
  persona: string;
  /** @deprecated Use memories array instead */
  userContext: string;
  outputFormat: string;
  memories: Memory[];

  // Connectivity
  emailProvider: "gmail" | "resend";
  gmailEmail: string;
  resendEmail: string;
  apiKeys: Record<string, string>;

  // Capabilities
  tools: Record<string, {
    enabled: boolean;
    apiKeyRef?: string;
  }>;

  // History
  persistConversations: boolean;
  maxMessagesPerConversation: number;
  summarizeAfter: number;

  // Privacy
  telemetry: boolean;

  updatedAt: string;
}

/** Sensible defaults for new users. */
export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  locale: "en-US",
  provider: "ollama",
  modelId: "qwen3:1.7b",
  config: { ...DEFAULT_MODEL_CONFIG },
  persona: "You are Maya, a helpful and context-aware AI assistant.",
  userContext: "",
  outputFormat: "",
  memories: [],
  emailProvider: "gmail",
  gmailEmail: "",
  resendEmail: "",
  apiKeys: {},
  tools: {
    webSearch: { enabled: true, apiKeyRef: "serper" },
    weather: { enabled: true, apiKeyRef: "openweather" },
    mailSender: { enabled: true },
    tunelink: { enabled: true },
    imageAnalyze: { enabled: true },
    imageGen: { enabled: true },
    memoryStore: { enabled: true },
    ytThumbnail: { enabled: true },
    docReader: { enabled: true },
  },
  persistConversations: true,
  maxMessagesPerConversation: 20,
  summarizeAfter: 10,
  telemetry: false,
  updatedAt: new Date().toISOString(),
};
