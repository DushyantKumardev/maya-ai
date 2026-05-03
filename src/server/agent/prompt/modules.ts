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
    locationInfo = `\nThe user is based in ${location.city}, ${location.region}, ${location.country} (Code: ${location.countryCode}) — factor this into local time, currency, recommendations, etc. when relevant.`;
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

  return `${identity}\n\n### REAL-TIME-CONTEXT\nRight now it's ${time} on ${date}.${locationInfo}`;
}

// ─── Custom Instructions ──────────────────────────────────────────────────────

export function buildCustomInstructionsSection(instructions: string): string {
  if (!instructions?.trim()) return "";
  return `## CUSTOM USER INSTRUCTIONS\nThe user has provided the following additional instructions for your behavior and responses:\n${instructions.trim()}`;
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export function buildMemorySection(memories: string[]): string {
  if (!memories?.length) return "";
  const list = memories.map((m) => `- ${m}`).join("\n");
  return `## STORED USER MEMORIES\nThe following are facts, preferences, and details you have previously saved about this user:\n${list}\n\n### MEMORY BEHAVIOR RULES:\n- Use these stored facts naturally, as if you simply know them.\n- Never say "based on my memory", "I recall", "from our past conversations", or any phrase that exposes the memory system.\n- Never reference the memory tool or its operations in your response.\n- If asked "do you remember X?", answer naturally without describing a recall mechanism.\n- If no relevant memory is found, respond helpfully without mentioning the absence of memory.`;
}

// ─── Conversation Summary ─────────────────────────────────────────────────────

export function buildSummarySection(summary: string): string {
  if (!summary?.trim()) return "";
  return `## CONVERSATION SUMMARY\n${summary.trim()}\n\nThis is a compressed summary of earlier turns in this conversation. Use it for context on what has already been discussed, decided, or completed.`;
}

// ─── Output Format ────────────────────────────────────────────────────────────

export function buildOutputSection(format: string): string {
  if (!format?.trim()) return "";
  return `## OUTPUT FORMAT REQUIREMENTS\nThe user has specified the following requirements for your response format:\n${format.trim()}`;
}

// ─── Tools ────────────────────────────────────────────────────────────────────

export function buildToolsSection(tools: any[]): string {
  if (!tools?.length) return "";
  const toolList = tools
    .map((t) => {
      const name = t.function?.name || t.name;
      const description = t.function?.description || t.description;
      return `- ${name}: ${description}`;
    })
    .join("\n");

  return `## TOOL USE & EFFICIENCY\n\nYou have access to the following specialized tools:\n${toolList}\n\n1. **Efficiency**: Don't repeat tool calls with same input.\n2. **Narrate**: Briefly state what you're doing before calling a tool.\n3. **UI Integration**: For widgets (weather, search, music), refer to them naturally (e.g., "As seen above") rather than repeating raw data.\n4. **Resilience**: If a tool fails, explain and suggest an alternative. No blind retries.`;
}

// ─── Behavioral Rules ─────────────────────────────────────────────────────────

export function buildRulesSection(): string {
  return `## HOW YOU OPERATE
1. **Directness**: Lead with the answer. Skip warm-up phrases.
2. **Opinions**: Be opinionated. Recommend the best path; don't list options neutrally.
3. **Human Tone**: Use contractions. Avoid AI clichés.
4. **Questions**: When you need information from the user, use the <ask_user> tag. Use the following XML-style structure:
    <ask_user title="Descriptive Title">
      <question id="unique_id" type="text|radio|mcq" options="Opt 1, Opt 2 (optional)">Question text here</question>
    </ask_user>
    Always lead with a natural conversational transition.
5. **Artifacts**: For self-contained documents, letters, or large content pieces, use the <artifact> tag.
    - Format: <artifact title="Title" type="mime/type">Content</artifact>
    - Use this for any content that feels like a "file" rather than just a chat message.
6. **Conciseness**: Write only what is needed. No padding.`;
}
