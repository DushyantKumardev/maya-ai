export interface ServiceMetadata {
  id: string;
  name: string;
  category: "ai" | "search" | "tools";
  description: string;
  baseURL?: string;
  link?: string;
  /** Optional: Specify a different key ID in the DB to use (e.g. 'gemini' uses 'google' key) */
  apiKeyId?: string;
}

export const SERVICES: ServiceMetadata[] = [
  // AI Providers
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    description: "Required for GPT-4o, GPT-3.5, etc.",
    baseURL: "https://api.openai.com/v1",
    link: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "ai",
    description: "Required for Claude 3.5 Sonnet, etc.",
    baseURL: "https://api.anthropic.com/v1",
    link: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "ai",
    description: "Google's latest multimodal models.",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    link: "https://aistudio.google.com/app/apikey",
    apiKeyId: "google",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    category: "ai",
    description:
      "Unified API for 100+ models. Used for both chat and Image Generation.",
    baseURL: "https://openrouter.ai/api/v1",
    link: "https://openrouter.ai/keys",
  },
  {
    id: "groq",
    name: "Groq",
    category: "ai",
    description: "Ultra-fast inference for Llama 3, Mixtral, etc.",
    baseURL: "https://api.groq.com/openai/v1",
    link: "https://console.groq.com/keys",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    category: "ai",
    description:
      "Local inference. Requires Ollama running on your machine (http://localhost:11434).",
    baseURL: "http://localhost:11434/v1",
    link: "https://ollama.com",
  },
  {
    id: "ollama-cloud",
    name: "Ollama Cloud",
    category: "ai",
    description: "Official cloud-hosted models from Ollama.",
    baseURL: "https://ollama.com/v1",
    link: "https://ollama.com/settings/keys",
    apiKeyId: "ollama",
  },

  // Search
  {
    id: "serper",
    name: "Serper.dev",
    category: "search",
    description: "Required for the Web Search tool.",
    link: "https://serper.dev/api-key",
  },
];

/**
 * SYSTEM_PROVIDERS
 *
 * Derived list of AI providers for UI selection.
 * Single source of truth is the SERVICES array above.
 */
export const SYSTEM_PROVIDERS = SERVICES.filter((s) => s.category === "ai").map(
  (s) => ({
    name: s.name,
    value: s.id,
    baseURL: s.baseURL,
  }),
);
