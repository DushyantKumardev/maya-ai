import {
  buildBasePrompt,
  buildCustomInstructionsSection,
  buildMemorySection,
  buildSummarySection,
  buildOutputSection,
  buildToolsSection,
  buildRulesSection,
  BasePromptOptions,
} from "./modules";
import {
  TITLE_GENERATION_PROMPT,
  SUMMARIZATION_PROMPT,
  REASONING_EFFORT_INSTRUCTIONS,
} from "./constants";
import { Message } from "@/features/chat/types";
import { AppSettings } from "@/features/settings/types";

// Re-export everything for consumers that import from this barrel
export * from "./modules";
export * from "./constants";

/**
 * Prompt Layer — Public API
 *
 * assemblePrompt      → builds the full system prompt string
 * buildContextMessages → wraps it into a Message[] for the LLM
 * buildTitleMessages  → messages for background title generation
 * buildSummaryMessages → messages for background summarization
 */

// ─── Flag Types ───────────────────────────────────────────────────────────────

export type FlagStatus = "on" | "off" | "auto";

export interface PromptLayerFlag {
  status: FlagStatus;
}

export interface PromptConfig {
  memory: PromptLayerFlag;
  summary: PromptLayerFlag;
  tools: PromptLayerFlag;
  rules: PromptLayerFlag;
  outputFormat: PromptLayerFlag;
}

export interface PromptContext {
  memories?: string[];
  summary?: string;
  tools?: any[];
  outputFormat?: string;
  baseOptions?: BasePromptOptions;
  customInstructions?: string;
}

// ─── Layer Inclusion Logic ────────────────────────────────────────────────────

const shouldInclude = (flag: PromptLayerFlag, data?: any): boolean => {
  if (flag.status === "off") return false;
  if (flag.status === "on") return true;
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "string") return data.trim().length > 0;
  return true;
};

// ─── System Prompt Assembler ──────────────────────────────────────────────────

export const assemblePrompt = (
  config: PromptConfig,
  context: PromptContext,
  reasoningEffort?: string,
): string => {
  const parts: string[] = [];

  parts.push(buildBasePrompt(context.baseOptions));

  if (context.customInstructions?.trim()) {
    parts.push(buildCustomInstructionsSection(context.customInstructions));
  }

  if (shouldInclude(config.memory, context.memories)) {
    const s = buildMemorySection(context.memories || []);
    if (s) parts.push(s);
  }

  if (shouldInclude(config.summary, context.summary)) {
    const s = buildSummarySection(context.summary || "");
    if (s) parts.push(s);
  }

  if (shouldInclude(config.outputFormat, context.outputFormat)) {
    const s = buildOutputSection(context.outputFormat || "");
    if (s) parts.push(s);
  }

  if (shouldInclude(config.tools, context.tools)) {
    const s = buildToolsSection(context.tools || []);
    if (s) parts.push(s);
  }

  if (shouldInclude(config.rules)) {
    parts.push(buildRulesSection());

    if (reasoningEffort === "none") {
      parts.push(
        `## SPEED MODE: NO THINKING\nAnswer immediately and directly. Do not engage in internal reasoning.`,
      );
    } else if (
      reasoningEffort &&
      REASONING_EFFORT_INSTRUCTIONS[reasoningEffort]
    ) {
      parts.push(REASONING_EFFORT_INSTRUCTIONS[reasoningEffort]);
    }
  }

  let finalPrompt = parts.join("\n\n");
  if (reasoningEffort && reasoningEffort !== "none") {
    finalPrompt = `<think>\n${finalPrompt}`;
  }
  return finalPrompt;
};

// ─── Context Message Builder ──────────────────────────────────────────────────

export function buildContextMessages(context: {
  settings: AppSettings;
  location?: any;
  reasoningEffort?: string;
  summary?: string;
  memories?: string[];
  processedMessages?: Message[];
  tools?: any[];
  config?: PromptConfig;
}): Message[] {
  const {
    settings,
    location,
    summary,
    memories,
    tools,
    reasoningEffort,
    config: explicitConfig,
  } = context;

  const promptContext: PromptContext = {
    memories: memories || [],
    summary,
    tools: tools || [],
    outputFormat: settings.outputFormat,
    customInstructions: (settings as any).customInstructions,
    baseOptions: {
      customPersona: settings.persona,
      location,
      locale: settings.locale,
    },
  };

  const promptConfig: PromptConfig = explicitConfig || {
    memory: { status: "auto" },
    summary: { status: "auto" },
    outputFormat: { status: "auto" },
    tools: { status: "auto" },
    rules: { status: "on" },
  };

  const systemPrompt = assemblePrompt(
    promptConfig,
    promptContext,
    reasoningEffort,
  );

  return [
    {
      id: "system-main",
      role: "system",
      content: systemPrompt,
    },
  ];
}

// ─── Background Task Message Builders ────────────────────────────────────────

export function buildTitleMessages(firstMessage: string): Message[] {
  const now = new Date();
  const date = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = now
    .toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return [
    {
      id: "title-gen-system",
      role: "system",
      content: TITLE_GENERATION_PROMPT(date, time),
    },
    { id: "title-gen-user", role: "user", content: firstMessage },
  ];
}

export function buildSummaryMessages(
  history: string,
  existingSummary: string,
): Message[] {
  const fullPrompt = `${SUMMARIZATION_PROMPT}\n\n${
    existingSummary ? `EXISTING SUMMARY:\n${existingSummary}\n\n` : ""
  }NEW MESSAGES TO INTEGRATE:\n${history}`;

  return [
    { id: "summarize-system", role: "system", content: SUMMARIZATION_PROMPT },
    { id: "summarize-user", role: "user", content: fullPrompt },
  ];
}
