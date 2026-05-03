import type { ModelConfig } from "@/features/settings/types";

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 4096,
  frequencyPenalty: 0,
};

export const DEFAULT_TITLE_GENERATION_MODEL = "";