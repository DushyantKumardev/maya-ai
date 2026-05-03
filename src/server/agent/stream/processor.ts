import { createXmlTagParser } from "@/server/agent/utils/xml-tag-parser";
import type { SendChunkFn, StreamDelta } from "@/server/agent/types";

/**
 * Stream Layer — Processor
 *
 * Inspects each stream delta and routes it to the correct typed event:
 *  - reasoning  (e.g. DeepSeek R1 native reasoning field)
 *  - content    (standard text)
 *  - ask_user   (extracted from <ask_user> XML tags)
 *  - artifact   (extracted from <artifact> XML tags)
 */
export function createStreamProcessor(sendChunk: SendChunkFn) {
  const askUserParser = createXmlTagParser("ask_user");
  const artifactParser = createXmlTagParser("artifact");

  return {
    processChunk: (delta: StreamDelta) => {
      if (delta?.reasoning) {
        sendChunk({ type: "reasoning", text: delta.reasoning });
      }

      if (delta?.content) {
        const artResult = artifactParser.push(delta.content);
        if (artResult.artifact) {
          sendChunk({ type: "artifact", text: artResult.artifact, attributes: artResult.attributes });
        }

        if (artResult.content) {
          const askResult = askUserParser.push(artResult.content);
          if (askResult.ask_user) {
            sendChunk({ type: "ask_user", text: askResult.ask_user, attributes: askResult.attributes });
          }
          if (askResult.content) {
            sendChunk({ type: "content", text: askResult.content });
          }
        }
      }
    },

    flush: () => {
      const artFlushed = artifactParser.flush();
      if (artFlushed.artifact) {
        sendChunk({ type: "artifact", text: artFlushed.artifact, attributes: artFlushed.attributes });
      }

      const askFlushed = askUserParser.push(artFlushed.content || "");
      const finalAsk = askUserParser.flush();

      if (askFlushed.ask_user || finalAsk.ask_user) {
        sendChunk({
          type: "ask_user",
          text: (askFlushed.ask_user || "") + (finalAsk.ask_user || ""),
          attributes: askFlushed.attributes || finalAsk.attributes,
        });
      }

      if (askFlushed.content || finalAsk.content) {
        sendChunk({
          type: "content",
          text: (askFlushed.content || "") + (finalAsk.content || ""),
        });
      }
    },
  };
}
