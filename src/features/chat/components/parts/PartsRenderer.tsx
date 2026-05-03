import React, { useMemo } from "react";
import { MessagePart } from "@/features/chat/types";
import StatusPart from "./StatusPart";
import ContentPart from "./ContentPart";
import ReasoningPart from "./ReasoningPart";
import ErrorPart from "./ErrorPart";
import ToolResultPart from "./ToolResultPart";
import { QuestionCard, type QuestionData } from "../message/QuestionCard";
import TextShimmer from "@/components/ui/shimmer/TextShimmer";
import { ArtifactCard } from "../message/ArtifactCard";


function parseAskUserData(content: string, attributes?: Record<string, string>): QuestionData | null {
  // 1. Prioritize XML parsing (The new "Option 1" style)
  // We use the title from attributes if provided, or fallback to regex
  let title = attributes?.title;
  if (!title) {
    const titleMatch = content.match(/<ask_user\s+title=["'](.*?)["']\s*>/i);
    title = titleMatch?.[1];
  }

  const questions: any[] = [];
  
  // Regex to capture individual <question> tags
  // Support id, type, and optional options attributes
  const qRegex = /<question\s+id=["'](.*?)["']\s+type=["'](.*?)["'](?:\s+options=["'](.*?)["'])?\s*>([\s\S]*?)<\/question>/gi;
  
  let match;
  while ((match = qRegex.exec(content)) !== null) {
    const [_, id, type, optionsStr, qText] = match;
    questions.push({
      id,
      type: type as any,
      question: qText.trim(),
      options: optionsStr ? optionsStr.split(",").map(s => s.trim()).filter(Boolean) : undefined
    });
  }

  if (questions.length > 0) {
    return { title: title || "Clarification", questions };
  }

  // 2. Fallback to JSON (Backward compatibility)
  let cleaned = content.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  } else if (cleaned.startsWith("<ask_user>") && cleaned.endsWith("</ask_user>")) {
    cleaned = cleaned.replace(/<\/?ask_user>/g, "").trim();
  }
  
  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned);
    const rawData = typeof parsed?.raw === "string" ? JSON.parse(parsed.raw) : parsed?.raw;
    const candidate = rawData ?? parsed;

    if (
      candidate &&
      typeof candidate.title === "string" &&
      Array.isArray(candidate.questions)
    ) {
      return candidate as QuestionData;
    }
  } catch (e) {
    // Silently fail for JSON if it's not valid yet (likely streaming)
  }

  return null;
}


interface PartsRendererProps {
  parts: MessagePart[];
  messageId: string;
  isThinking: boolean;
  isStreaming?: boolean;
}

/**
 * PartsRenderer
 * 
 * The central dispatcher that iterates over message parts and
 * renders the appropriate component for each type.
 */
export default function PartsRenderer({
  parts,
  messageId,
  isThinking,
  isStreaming = false,
}: PartsRendererProps) {
  // 1. Identify which tools have final results (to suppress their status chips)
  const toolsWithResults = useMemo(() => {
    const ids = new Set<string>();
    parts.forEach((p: MessagePart) => {
      if (p.type === "tool_result" && p.toolCallId) {
        ids.add(p.toolCallId);
      }
    });
    return ids;
  }, [parts]);

  // 2. Coalesce consecutive parts and filter suppressed statuses
  const renderedParts = useMemo(() => {
    const result: MessagePart[] = [];
    
    // We keep track of the active mergeable parts even if statuses are injected between them
    let activeReasoning: Extract<MessagePart, { type: "reasoning" }> | null = null;
    let activeContent: Extract<MessagePart, { type: "content" | "ask_user" }> | null = null;

    // To prevent duplicate chips for the same tool call, we only show the LATEST status for each ID
    const latestStatusForTool = new Map<string, number>();
    parts.forEach((p: MessagePart, idx: number) => {
      if (p.type === "status" && p.toolCallId) {
        latestStatusForTool.set(p.toolCallId, idx);
      }
    });

    parts.forEach((p: MessagePart, idx: number) => {
      // Suppression 1: Hide status if we already have the tool's final result
      if (p.type === "status" && p.toolCallId && toolsWithResults.has(p.toolCallId)) {
        return;
      }

      // Suppression 2: Hide status if it's not the latest for this tool call
      if (p.type === "status" && p.toolCallId && latestStatusForTool.get(p.toolCallId) !== idx) {
        return;
      }

      if (p.type === "reasoning") {
        if (activeReasoning) {
          activeReasoning.content += "\n" + p.content;
          return;
        }
        const fresh = { ...p } as Extract<MessagePart, { type: "reasoning" }>;
        result.push(fresh);
        activeReasoning = fresh;
        activeContent = null; // entering reasoning mode breaks content continuity
        return;
      }

      if (p.type === "content") {
        // Substantive content (non-whitespace) signals the end of the preparatory reasoning phase
        if (p.content.trim().length > 0) {
          activeReasoning = null;
        }

        if (activeContent && activeContent.type === "content") {
          activeContent.content += "\n" + p.content;
          return;
        }
        const fresh = { ...p } as Extract<MessagePart, { type: "content" }>;
        result.push(fresh);
        activeContent = fresh;
        return;
      }

      if (p.type === "ask_user") {
        activeReasoning = null;
        if (activeContent && activeContent.type === "ask_user") {
          activeContent.content += p.content;
          return;
        }
        const fresh = { ...p } as Extract<MessagePart, { type: "ask_user" }>;
        result.push(fresh);
        activeContent = fresh;
        return;
      }

      // Any other part (status, tool_result, artifact, error) is pushed as is
      result.push({ ...p });

      // tool_result resets content (so tools stay interleaved with text), 
      // but it NO LONGER resets reasoning (to allow unified thought chains).
      if (p.type === "tool_result") {
        activeContent = null;
      }

      if (p.type === "error") {
        activeReasoning = null;
        activeContent = null;
      }
    });

    return result;
  }, [parts, toolsWithResults]);

  // Pre-compute current status parts for 'latest' logic in StatusPart
  const allStatusParts = useMemo(
    () => renderedParts.filter((p: MessagePart) => p.type === "status"),
    [renderedParts]
  );

  return (
    <>
      {renderedParts.map((p: MessagePart, i: number) => {
        const baseKey = p.type === "status" && p.toolCallId ? p.toolCallId : `${p.type}-${i}`;
        const artifactIndex =
          p.type === "artifact"
            ? renderedParts.slice(0, i).filter((part) => part.type === "artifact").length
            : -1;
        
        switch (p.type) {
          case "status":
            return (
              <StatusPart
                key={baseKey}
                part={p}
                messageId={messageId}
                allStatusParts={allStatusParts}
              />
            );
          case "reasoning":
            return (
              <ReasoningPart
                key={baseKey}
                reasoning={p.content}
                // isThinking should only show on the LAST reasoning part if global isThinking is true
                isThinking={isThinking && i === renderedParts.findLastIndex(rp => rp.type === "reasoning")}
              />
            );
          case "content":
            return <ContentPart key={baseKey} content={p.content} />;
          case "ask_user":
            if (!p.content.trim()) return null;

            const questionData = parseAskUserData(p.content, (p as any).attributes);

            return questionData ? (
              <QuestionCard key={baseKey} data={questionData} messageId={messageId} isStreaming={isStreaming} />
            ) : (
              <TextShimmer text="Writing questions..." key={baseKey} />
            );
          case "error":
            return <ErrorPart key={baseKey} error={p.text} />;
          case "tool_result":
            return (
              <ToolResultPart
                key={baseKey}
                part={p}
                messageId={messageId}
              />
            );
          case "artifact":
            return (
              <ArtifactCard
                key={baseKey}
                part={p}
                messageId={messageId}
                artifactIndex={artifactIndex}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
