import { webSearchTool } from "./definitions/web-search";
import { weatherTool } from "./definitions/weather";
import { mailSenderTool } from "./definitions/mail-sender";
import { tunelinkTool } from "./definitions/tunelink";
import { visionTool } from "./definitions/image-analyze";
import { memoriesTool } from "./definitions/memory-store";
import { imageGenerationTool } from "./definitions/image-gen";
import { youtubeThumbnailTool } from "./definitions/yt-thumbnail";
import { docReaderTool } from "./definitions/doc-reader";

/**
 * Tools Layer — Registry
 *
 * Central manifest of all available tools.
 * Normalized into a consistent shape: all tools expose { type, function: { name, description, parameters }, execute }
 *
 * Note: docReaderTool previously used a non-standard nested { function: { ... } } shape.
 * It is unwrapped here for consistency.
 */

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/** All registered tool schemas (sent to the LLM). */
export const tools: ToolDefinition[] = [
  { type: "function", function: { name: webSearchTool.name, description: webSearchTool.description, parameters: webSearchTool.parameters } },
  { type: "function", function: { name: weatherTool.name, description: weatherTool.description, parameters: weatherTool.parameters } },
  { type: "function", function: { name: mailSenderTool.name, description: mailSenderTool.description, parameters: mailSenderTool.parameters } },
  { type: "function", function: { name: tunelinkTool.name, description: tunelinkTool.description, parameters: tunelinkTool.parameters } },
  { type: "function", function: { name: visionTool.name, description: visionTool.description, parameters: visionTool.parameters } },
  { type: "function", function: { name: imageGenerationTool.name, description: imageGenerationTool.description, parameters: imageGenerationTool.parameters } },
  { type: "function", function: { name: memoriesTool.name, description: memoriesTool.description, parameters: memoriesTool.parameters } },
  { type: "function", function: { name: youtubeThumbnailTool.name, description: youtubeThumbnailTool.description, parameters: youtubeThumbnailTool.parameters } },
  // docReaderTool uses nested { function: { ... } } shape — unwrapped here for consistency
  { type: "function", function: { name: docReaderTool.function.name, description: docReaderTool.function.description, parameters: docReaderTool.function.parameters } },
];

/** All registered tool executors (keyed by tool name). */
export const toolExecutors: Record<string, (...args: any[]) => any> = {
  [webSearchTool.name]: webSearchTool.execute,
  [weatherTool.name]: weatherTool.execute,
  [mailSenderTool.name]: mailSenderTool.execute,
  [tunelinkTool.name]: tunelinkTool.execute,
  [visionTool.name]: visionTool.execute,
  [imageGenerationTool.name]: imageGenerationTool.execute,
  [memoriesTool.name]: memoriesTool.execute,
  [youtubeThumbnailTool.name]: youtubeThumbnailTool.execute,
  [docReaderTool.function.name]: docReaderTool.execute,
};
