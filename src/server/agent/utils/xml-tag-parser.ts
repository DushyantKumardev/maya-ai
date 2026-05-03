/**
 * A streaming XML tag parser that separates tagged content from regular content.
 * The tag name you pass becomes the key in the returned object.
 *
 * Handles partial tag matches across stream chunks and parses attributes in opening tags.
 *
 * Usage:
 *   const parser = createXmlTagParser("artifact");
 *   const result = parser.push("<artifact title='Test'>Hello</artifact>");
 *   // result.artifact   = "Hello"
 *   // result.attributes = { title: "Test" }
 *   // result.content    = "" (outside text)
 */

export function createXmlTagParser<T extends string>(tagName: T) {
  const openTagStart = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  
  let insideTag = false;
  let pendingBuffer = ""; // holds partial tag matches across chunks
  let currentAttributes: Record<string, string> = {};

  const parseAttributes = (attrString: string) => {
    const attrs: Record<string, string> = {};
    const regex = /(\w+)=["']([^"']*)["']/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  };

  return {
    tagName,

    push(chunk: string): Record<T, string> & { content: string; attributes: Record<string, string> } {
      let tagged = "";
      let content = "";
      let remaining = pendingBuffer + chunk;
      pendingBuffer = "";

      while (remaining.length > 0) {
        if (!insideTag) {
          const startIdx = remaining.indexOf(openTagStart);
          if (startIdx !== -1) {
            const endIdx = remaining.indexOf(">", startIdx);
            if (endIdx !== -1) {
              // Found full opening tag with potential attributes
              content += remaining.substring(0, startIdx);
              const attrString = remaining.substring(startIdx + openTagStart.length, endIdx);
              currentAttributes = parseAttributes(attrString);
              insideTag = true;
              remaining = remaining.substring(endIdx + 1);
            } else {
              // Found start but not the end of opening tag
              content += remaining.substring(0, startIdx);
              pendingBuffer = remaining.substring(startIdx);
              remaining = "";
            }
          } else {
            // Check for partial opening tag at the end
            const partialLen = findPartialTagMatch(remaining, openTagStart);
            if (partialLen > 0) {
              content += remaining.substring(0, remaining.length - partialLen);
              pendingBuffer = remaining.substring(remaining.length - partialLen);
              remaining = "";
            } else {
              content += remaining;
              remaining = "";
            }
          }
        } else {
          const endIdx = remaining.indexOf(closeTag);
          if (endIdx !== -1) {
            // Found closing tag
            tagged += remaining.substring(0, endIdx);
            insideTag = false;
            remaining = remaining.substring(endIdx + closeTag.length);
          } else {
            // Check for partial closing tag at the end
            const partialLen = findPartialTagMatch(remaining, closeTag);
            if (partialLen > 0) {
              tagged += remaining.substring(0, remaining.length - partialLen);
              pendingBuffer = remaining.substring(remaining.length - partialLen);
              remaining = "";
            } else {
              tagged += remaining;
              remaining = "";
            }
          }
        }
      }

      return { 
        [tagName]: tagged, 
        content, 
        attributes: { ...currentAttributes } 
      } as any;
    },

    get isInsideTag() {
      return insideTag;
    },

    /** Flush any remaining buffered content. Call after stream ends. */
    flush(): Record<T, string> & { content: string; attributes: Record<string, string> } {
      const flushed = pendingBuffer;
      pendingBuffer = "";
      if (insideTag) {
        return { [tagName]: flushed, content: "", attributes: currentAttributes } as any;
      }
      return { [tagName]: "", content: flushed, attributes: {} } as any;
    },

    reset() {
      insideTag = false;
      pendingBuffer = "";
      currentAttributes = {};
    },
  };
}

function findPartialTagMatch(text: string, tag: string): number {
  const maxCheck = Math.min(text.length, tag.length - 1);
  for (let len = maxCheck; len >= 1; len--) {
    if (text.endsWith(tag.substring(0, len))) {
      return len;
    }
  }
  return 0;
}
