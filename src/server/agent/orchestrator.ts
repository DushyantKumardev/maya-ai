import createProvider from "@/server/agent/provider";
import { createStreamProcessor } from "@/server/agent/stream/processor";
import { createToolCollector } from "@/server/agent/tools/collector";
import { runTools } from "@/server/agent/tools/executor";
import { tools as allRegisteredTools, toolExecutors as allRegisteredExecutors } from "@/server/agent/tools/registry";
import { filterActiveTools } from "@/server/agent/tools/filter";
import { resolveSettings } from "@/server/agent/context/settings";
import { loadChatHistory } from "@/server/agent/context/history";
import { buildMessageContext } from "@/server/agent/context/builder";
import type { ChatStreamConfig, SendChunkFn } from "@/server/agent/types";

/**
 * Orchestrator — The Main Chat Loop
 *
 * Ties together all pipeline layers:
 * provider → context → prompt → tools → stream → [tool loop] → done
 *
 * Renamed from createChatStream (kept as the exported name for API compatibility).
 */
export function createChatStream(config: ChatStreamConfig): ReadableStream {
  const { provider, abortSignal, modelConfig, reasoning_effort, userId } = config;

  let isStreamClosed = false;

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendChunk: SendChunkFn = (data) => {
        if (isStreamClosed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch (err) {
          console.error("[Orchestrator] Failed to enqueue chunk:", err);
          isStreamClosed = true;
        }
      };

      // ── Layer 1+2a: Provider + Settings ─────────────────────────────────
      const { settings, activeProvider, activeModel } = await resolveSettings(config);

      sendChunk({ type: "metadata", model: activeModel, provider: activeProvider });

      // ── Layer 2b–2d: History, Vision, Summary, Message Build ─────────────
      const { summary, processedMessages, historyToKeep } = await loadChatHistory({
        config,
        settings,
        activeProvider,
        activeModel,
        sendChunk,
      });

      // ── Layer 5a: Tool Filtering ─────────────────────────────────────────
      const { activeTools, activeExecutors } = filterActiveTools(
        allRegisteredTools,
        allRegisteredExecutors,
        settings,
      );

      const memories = (settings.memories || []).map((m: any) => m.content);

      const { currentMessages } = buildMessageContext({
        settings,
        summary,
        processedMessages,
        historyToKeep,
        location: config.location,
        reasoningEffort: reasoning_effort,
        tools: activeTools,
        memories,
      });

      // ── Handle pending tool calls from last assistant message ────────────
      const lastMessage = processedMessages[processedMessages.length - 1];
      if (
        lastMessage?.role === "assistant" &&
        Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length > 0
      ) {
        const executed = await runTools(
          lastMessage.tool_calls,
          sendChunk,
          userId,
          activeExecutors,
          activeProvider,
          activeModel,
          settings,
          abortSignal,
        );
        if (executed.length > 0) currentMessages.push(...executed);
      }

      // ── Main Streaming Loop (max 12 steps) ────────────────────────────────
      let stepCount = 0;
      const maxSteps = 12;

      while (stepCount < maxSteps) {
        stepCount++;

        const processor = createStreamProcessor(sendChunk);
        const collector = createToolCollector();

        let accumulatedContent = "";
        let accumulatedReasoning = "";
        let hasError = false;

        try {
          const response = await createProvider(provider, settings).chat.completions.create(
            {
              model: activeModel,
              messages: currentMessages,
              tools: activeTools.length > 0 ? activeTools : undefined,
              stream: true,
              ...(reasoning_effort && reasoning_effort !== "none" && {
                reasoning_effort: reasoning_effort as any,
              }),
              ...(modelConfig && {
                temperature: modelConfig.temperature,
                top_p: modelConfig.topP,
                max_tokens: modelConfig.maxTokens,
                ...(activeProvider !== "gemini" && {
                  frequency_penalty: modelConfig.frequencyPenalty,
                }),
              }),
              stream_options: { include_usage: true },
            },
            { signal: abortSignal },
          );

          for await (const chunk of response) {
            if (chunk.usage) {
              sendChunk({ type: "usage", usage: chunk.usage });
            }

            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            if (delta.content) accumulatedContent += delta.content;
            if ((delta as any).reasoning) accumulatedReasoning += (delta as any).reasoning;

            if (!collector.processChunk(delta)) {
              processor.processChunk(delta);
            }
          }
        } catch (error: any) {
          console.error("LLM Provider Error:", error.message || "Unknown error occurred");
          sendChunk({
            type: "error",
            text: `\n\n**Provider Error:** ${error.message || "An unexpected error occurred while communicating with the AI provider."}\n`,
          });
          hasError = true;
        }

        if (hasError) break;

        const { toolCalls, hasToolCalls } = collector.finalise();
        if (!hasToolCalls) break;

        // Validate tool call format
        const isValidFormat = toolCalls.every((toolCall: any) => {
          const isValidName = activeTools.some((t) => t.function.name === toolCall.function.name);
          let isValidJson = true;
          try { JSON.parse(toolCall.function.arguments); } catch { isValidJson = false; }
          return isValidName && isValidJson;
        });

        if (!isValidFormat) {
          currentMessages.push({
            role: "user",
            content: "SYSTEM ERROR: Invalid tool call(s). Fix names/JSON and call tools separately with valid arguments.",
          });
          continue;
        }

        currentMessages.push({
          role: "assistant",
          content: accumulatedContent || null,
          ...(accumulatedReasoning && { reasoning: accumulatedReasoning }),
          tool_calls: toolCalls,
        });

        if (toolCalls.length > 0) {
          const executed = await runTools(
            toolCalls,
            sendChunk,
            userId,
            activeExecutors,
            activeProvider,
            activeModel,
            settings,
            abortSignal,
          );
          executed.forEach((result) => currentMessages.push(result));
        }
      }

      if (!isStreamClosed) {
        controller.close();
        isStreamClosed = true;
      }
    },
    cancel() {
      isStreamClosed = true;
    },
  });
}
