import { Settings } from "@/server/db/models/settings-model";
import connectDB from "@/server/db/mongo";
import type { Memory } from "@/features/settings/types";
import crypto from "crypto";

interface MemoryStatusUpdate {
  message: string;
  done?: boolean;
  data?: unknown;
}

interface MemorySystemOptions {
  userId: string;
  onStatusUpdate?: (params: MemoryStatusUpdate) => void;
}

interface MemoriesArgs {
  action: "add" | "delete" | "update" | "list" | "search" | "clear" | "add_bulk";
  content?: string;
  id?: string;
  query?: string;
  offset?: number;
  limit?: number;
}

interface MemoryResultBase {
  instructions?: string;
  metadata?: Record<string, number>;
  error?: string;
  success?: boolean;
  id?: string;
}

type MemoryToolResult = MemoryResultBase;

interface SettingsWithMemories {
  memories: Memory[];
  save: () => Promise<unknown>;
}

const LLM_BEHAVIOR_INSTRUCTIONS = `
CRITICAL RESPONSE RULES - NEVER BREAK THESE:
- Never say "based on my memory", "I recall", "I know from our past conversations", "from memory", or any phrase that exposes the memory system.
- Never reference the memory tool or its operations in your response.
- Use stored facts naturally, as if you simply know them.
- If asked "do you remember X?", answer naturally without describing a recall mechanism.
- If no relevant memory is found, respond helpfully without mentioning the absence of memory.
`.trim();

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown memory error";
}

function createMemoryId(): string {
  return crypto.randomUUID().slice(0, 8);
}

function sortMemoriesByCreatedAt(memories: Memory[]): Memory[] {
  return [...memories].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export const memoriesTool = {
  name: "memory-store",
  description:
    "Persistent memory system for storing and retrieving atomic facts about the user across sessions. Always list or search before adding to avoid duplicates.",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["add", "delete", "update", "list", "search", "clear", "add_bulk"],
        description: "The operation to perform on the memory store.",
      },
      content: {
        type: "string",
        description: "The fact or facts to store. For add_bulk, provide one fact per line.",
      },
      id: {
        type: "string",
        description: "Memory ID required for update and delete operations.",
      },
      query: {
        type: "string",
        description: "Search keywords for the search action.",
      },
      offset: {
        type: "number",
        description: "Pagination offset (default: 0).",
      },
      limit: {
        type: "number",
        description: "Number of results to return (default: 20, max: 50).",
      },
    },
    required: ["action"],
  },
  execute: async (
    args: MemoriesArgs,
    sysOptions: MemorySystemOptions,
  ): Promise<MemoryToolResult> => {
    const { userId, onStatusUpdate } = sysOptions;
    const { action, content = "", id, query, offset = 0, limit = 20 } = args;
    const safeLimit = Math.min(limit, 50);

    const status = (message: string, done = false, data?: unknown) =>
      onStatusUpdate?.({ message, done, data });

    try {
      await connectDB();

      const settings = (await Settings.findOne({
        userId,
      })) as SettingsWithMemories | null;
      if (!settings) {
        throw new Error("User settings not found.");
      }

      if (!settings.memories) {
        settings.memories = [];
      }

      const memories = settings.memories;

      switch (action) {
        case "add": {
          if (!content.trim()) {
            throw new Error("'content' is required to add a memory.");
          }

          status("Saving to memory...");

          const newId = createMemoryId();
          settings.memories.push({
            id: newId,
            content: content.trim(),
            createdAt: new Date().toISOString(),
          });
          await settings.save();

          status("Memory saved.", true);
          return {
            success: true,
            id: newId,
            instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nFact saved. Use it naturally in future responses without referencing that it was just stored.`,
          };
        }

        case "add_bulk": {
          if (!content.trim()) {
            throw new Error("'content' is required for bulk add.");
          }

          status("Saving memories...");

          const lines = content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

          if (lines.length === 0) {
            throw new Error("No valid facts found in bulk input.");
          }

          const newMemories: Memory[] = lines.map((line) => ({
            id: createMemoryId(),
            content: line,
            createdAt: new Date().toISOString(),
          }));

          settings.memories.push(...newMemories);
          await settings.save();

          status(`${newMemories.length} memories saved.`, true);
          return {
            success: true,
            instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\n${newMemories.length} facts saved. Integrate them naturally without disclosing that they were just stored.`,
          };
        }

        case "clear": {
          status("Clearing all memories...");

          const count = settings.memories.length;
          settings.memories = [];
          await settings.save();

          status("All memories cleared.", true);
          return {
            success: true,
            instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nAll ${count} stored facts have been permanently deleted. You no longer have any stored context about the user.`,
          };
        }

        case "list": {
          status("Loading memories...");

          const totalCount = memories.length;
          if (totalCount === 0) {
            status("No memories found.", true);
            return {
              instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nNo stored facts available.`,
            };
          }

          const sorted = sortMemoriesByCreatedAt(memories);
          const paginated = sorted.slice(offset, offset + safeLimit);
          const remainingCount = Math.max(0, totalCount - (offset + safeLimit));
          const list = paginated
            .map(
              (memory) =>
                `[${memory.id}] ${memory.content} (${new Date(memory.createdAt).toLocaleDateString()})`,
            )
            .join("\n");

          status(`${paginated.length} memories loaded.`, true);
          return {
            instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nStored facts (page ${Math.floor(offset / safeLimit) + 1}):\n${list}`,
            metadata: {
              total_count: totalCount,
              retrieved_count: paginated.length,
              offset,
              remaining_count: remainingCount,
            },
          };
        }

        case "search": {
          if (!query?.trim()) {
            throw new Error("'query' is required for search.");
          }

          status("Searching memories...");

          const keywords = query
            .toLowerCase()
            .split(/\s+/)
            .filter((word) => word.length > 2);

          if (keywords.length === 0) {
            keywords.push(query.toLowerCase());
          }

          const scoredResults = memories
            .map((memory) => {
              const lowContent = memory.content.toLowerCase();
              const score = keywords.reduce(
                (acc, keyword) => acc + (lowContent.includes(keyword) ? 1 : 0),
                0,
              );
              return { memory, score };
            })
            .filter((result) => result.score > 0)
            .sort((a, b) => {
              if (b.score !== a.score) {
                return b.score - a.score;
              }
              return (
                new Date(b.memory.createdAt).getTime() -
                new Date(a.memory.createdAt).getTime()
              );
            });

          const totalMatches = scoredResults.length;
          if (totalMatches === 0) {
            status("No matching memories found.", true);
            return {
              instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nNo stored facts match "${query}". Respond without referencing memory or its absence.`,
            };
          }

          const paginated = scoredResults.slice(offset, offset + safeLimit);
          const remainingCount = Math.max(0, totalMatches - (offset + safeLimit));

          status(`${totalMatches} matching memories found.`, true);
          return {
            instructions:
              `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nRelevant facts for "${query}":\n` +
              paginated
                .map((result) => `[${result.memory.id}] ${result.memory.content}`)
                .join("\n"),
            metadata: {
              total_matches: totalMatches,
              retrieved_count: paginated.length,
              offset,
              remaining_count: remainingCount,
            },
          };
        }

        case "delete": {
          if (!id) {
            throw new Error("'id' is required to delete a memory.");
          }

          status("Deleting memory...");

          const initialLength = settings.memories.length;
          settings.memories = settings.memories.filter(
            (memory) => memory.id !== id,
          );

          if (settings.memories.length === initialLength) {
            throw new Error(`Memory ID "${id}" not found.`);
          }

          await settings.save();
          status("Memory deleted.", true);
          return {
            success: true,
            instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nFact [${id}] has been removed. Do not reference it going forward.`,
          };
        }

        case "update": {
          if (!id || !content.trim()) {
            throw new Error("'id' and 'content' are required to update a memory.");
          }

          status("Updating memory...");

          const memory = settings.memories.find(
            (item) => item.id === id,
          );
          if (!memory) {
            throw new Error(`Memory ID "${id}" not found.`);
          }

          memory.content = content.trim();
          await settings.save();

          status("Memory updated.", true);
          return {
            success: true,
            instructions: `${LLM_BEHAVIOR_INSTRUCTIONS}\n\nFact [${id}] has been updated. Use the revised version naturally going forward.`,
          };
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      status(`Error: ${message}`, true, { error: message });
      return { error: message };
    }
  },
};
