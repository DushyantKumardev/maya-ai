import { DEFAULT_PERSONA } from "./constants";

/**
 * Prompt Layer — Modules
 * All prompt section builder functions in one file.
 * Each function takes data and returns a formatted string block (or "").
 */

// ─── Base (always included) ───────────────────────────────────────────────────

export interface BasePromptOptions {
  customPersona?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
  };
  locale?: string;
}

export function buildBasePrompt(options: BasePromptOptions = {}): string {
  const { customPersona, location } = options;
  const identity = customPersona?.trim() || DEFAULT_PERSONA;

  let locationInfo = "";
  if (location?.city) {
    locationInfo = `\nUser Location: ${location.city}, ${location.region}, ${location.country}, ${location.countryCode}`;
  }

  const now = new Date();
  const dateLocale = options.locale || "en-US";
  const date = now.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = now
    .toLocaleTimeString(dateLocale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return `${identity}\n\n### REAL-TIME-CONTEXT\n
- It's ${time} on ${date}.${locationInfo}`;
}

// ─── Custom Instructions ──────────────────────────────────────────────────────

export function buildCustomInstructionsSection(instructions: string): string {
  if (!instructions?.trim()) return "";
  return `## USER CUSTOM INSTRUCTIONS\n${instructions.trim()}`;
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export function buildMemorySection(memories: string[]): string {
  if (!memories?.length) return "";
  const list = memories.map((m) => `- ${m}`).join("\n");
  return `## MEMORIES\nUse memory-store tool if needed`;
}

// ─── Conversation Summary ─────────────────────────────────────────────────────

export function buildSummarySection(summary: string): string {
  if (!summary?.trim()) return "";
  return `## CONVERSATION SUMMARY\nThis is a compressed summary of earlier turns in this conversation. \n${summary.trim()}`;
}

// ─── Output Format ────────────────────────────────────────────────────────────

export function buildOutputSection(format: string): string {
  if (!format?.trim()) return "";
  return `## USER'S OUTPUT FORMAT REQUIREMENTS:\n${format.trim()}`;
}

// ─── Tools ────────────────────────────────────────────────────────────────────

export function buildToolsSection(tools: unknown[]): string {
  if (!tools?.length) return "";
  return `## TOOLS:
 - Never call tools silently.
- Before EACH tool call, render a visible status message.
- Perform one tool action at a time.
- Do not batch tool calls together.
- Wait until the current tool result is available before starting the next action.`;
}

// ─── Behavioral Rules ─────────────────────────────────────────────────────────

export function buildRulesSection(): string {
  return `## STRUCTURED OUTPUT FORMAT
**Questions**: If you need to ask questions, use a single \`<ask_user title="Title"><question id="id" type="text|radio|mcq" options="Opt1,Opt2">Text</question>...</ask_user>\` tag with conversational transition. Never output multiple \`<ask_user>\` blocks in a single turn. If you have multiple questions, you MUST place them all as separate \`<question>\` elements inside one single, unified \`<ask_user>\` block.
**Artifacts**: For self-contained files/docs, use \`<artifact title="Title" type="mime/type">Content</artifact>\`.
`;
}
