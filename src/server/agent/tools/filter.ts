import type { ToolExecutorsMap } from "@/server/agent/types";

/**
 * Tools Layer — Filter
 *
 * Filters the full tool registry down to only the tools
 * the user has enabled in their settings.
 *
 * Split from the old pipeline.ts God file.
 */

/** Maps user-facing setting keys to internal tool function names. */
const TOOL_SETTING_MAP: Record<string, string> = {
  webSearch: "web-search",
  weather: "weather",
  mailSender: "mail-sender",
  tunelink: "tunelink",
  imageAnalyze: "image-analyze",
  imageGen: "image-gen",
  memoryStore: "memory-store",
  ytThumbnail: "yt-thumbnail",
  docReader: "doc-reader",
};

export function filterActiveTools(
  allTools: any[],
  allExecutors: ToolExecutorsMap,
  settings: any,
): { activeTools: any[]; activeExecutors: ToolExecutorsMap } {
  let activeTools = [...allTools];

  if (settings?.tools) {
    const toolSettings = settings.tools;
    activeTools = activeTools.filter((tool) => {
      const toolName = tool.function.name;
      const settingId = Object.keys(TOOL_SETTING_MAP).find(
        (key) => TOOL_SETTING_MAP[key] === toolName,
      );
      if (settingId) return toolSettings[settingId]?.enabled === true;
      return true; // keep system tools not mapped to user toggles
    });
  }

  const enabledNames = new Set(activeTools.map((t) => t.function.name));
  const activeExecutors: ToolExecutorsMap = {};
  Object.keys(allExecutors).forEach((name) => {
    if (enabledNames.has(name)) activeExecutors[name] = allExecutors[name];
  });

  return { activeTools, activeExecutors };
}
