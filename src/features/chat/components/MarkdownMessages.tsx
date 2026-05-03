"use client";

/**
 * Markdown.tsx
 *
 * Renders markdown with:
 * - GFM (tables, strikethrough, task lists)
 * - Math (KaTeX)
 * - Syntax-highlighted code blocks
 * - Inline hex color preview
 * - @mention highlighting
 * - Auto-linkify bare URLs
 *
 * Custom remark plugin: remarkMaya
 * ─────────────────────────────────────────────────────────────
 * HOW TO ADD YOUR OWN INLINE PATTERN
 * ─────────────────────────────────────────────────────────────
 * 1. Add an entry to the CUSTOM_PATTERNS array below.
 *    Each entry needs:
 *      - type:   a unique string key (e.g. "ticket")
 *      - regex:  a GLOBAL regex (must have the /g flag)
 *
 *    Example — JIRA-style ticket IDs like PROJECT-123:
 *      { type: "ticket", regex: /\b[A-Z]{2,10}-\d+\b/g }
 *
 *    Tips:
 *      - Use \b word boundaries to avoid partial matches.
 *      - Avoid short TLDs (.co, .in, .me) in URL-like patterns;
 *        they cause false positives on version strings like "v0.3".
 *      - Patterns are tested in array order. The first match at a
 *        given position wins (overlapping matches are skipped).
 *
 * 2. Handle the new type in buildInlineNode() below.
 *    Return any mdast node type: "inlineCode", "link", or
 *    a custom "html" node if you need arbitrary markup.
 *
 * 3. Handle the new type (if you returned "inlineCode") inside
 *    the <code> component renderer further down, OR add a
 *    dedicated component to the `components` map if you used
 *    a custom html node.
 * ─────────────────────────────────────────────────────────────
 */

import React, { memo, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils/utils";
import { CodeBlock } from "./message/CodeBlock";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";


import { visit } from "unist-util-visit";
import { Download, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Favicon from "@/components/common/Favicon";

// ─────────────────────────────────────────────────────────────
// CUSTOM PATTERNS — add your own entries here (see guide above)
// ─────────────────────────────────────────────────────────────
const CUSTOM_PATTERNS: { type: string; regex: RegExp }[] = [
  {
    type: "hex",
    // Matches #RGB and #RRGGBB hex color codes.
    // \b ensures we don't clip longer hex strings like git SHAs.
    regex: /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,
  },
  {
    type: "mention",
    // Matches @username handles (alphanumeric + underscore).
    regex: /@[a-zA-Z0-9_]+/g,
  },
  {
    type: "url",
    // Matches http/https URLs and www. prefixed URLs only.
    // Intentionally excludes bare domain guessing (no .co/.in/.me etc.)
    // to avoid false-positives on version strings like "v0.3" or "e.g.".
    // If you need bare domains, add them explicitly with a tight pattern
    // e.g.: /\b(?:github|npmjs|vercel)\.com\/[^\s<]*/gi
    regex: /\bhttps?:\/\/[^\s<]+|\bwww\.[^\s<]+/gi,
  },
  // ── ADD YOUR OWN PATTERN BELOW THIS LINE ──────────────────
  //
  // Example 1 — JIRA ticket IDs (PROJECT-123):
  // { type: "ticket", regex: /\b[A-Z]{2,10}-\d+\b/g },
  //
  // Example 2 — npm package references (@scope/package):
  // { type: "npm", regex: /@[a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-~][a-z0-9-._~]*/g },
  //
  // Example 3 — GitHub issue refs (#123):
  // { type: "ghissue", regex: /(?<![a-fA-F0-9])#\d+\b/g },
  //
  // ──────────────────────────────────────────────────────────
];

/**
 * Given a matched pattern type + raw value, return an mdast node.
 * Add a new `case` here when you add a new pattern type above.
 */
function buildInlineNode(type: string, value: string): any {
  switch (type) {
    case "hex":
    case "mention":
      // inlineCode nodes are intercepted by the <code> renderer below
      // and rendered as colored swatches / mention pills respectively.
      return { type: "inlineCode", value };

    case "url":
      return {
        type: "link",
        url: value.startsWith("http") ? value : `https://${value}`,
        children: [{ type: "text", value }],
      };



    default:
      return { type: "text", value };
  }
}

// ─────────────────────────────────────────────────────────────
// remarkMaya — remark plugin
// ─────────────────────────────────────────────────────────────
const remarkMaya = () => {
  return (tree: any) => {
    visit(tree, "text", (node: any, index: any, parent: any) => {
      if (!node.value || typeof index !== "number") return;

      // Don't process text that's already inside code or links
      if (
        !parent ||
        parent.type === "code" ||
        parent.type === "inlineCode" ||
        parent.type === "link"
      ) {
        return;
      }

      // Collect all matches from all patterns
      const allMatches: {
        type: string;
        value: string;
        index: number;
        length: number;
      }[] = [];

      for (const pattern of CUSTOM_PATTERNS) {
        // Clone regex to reset lastIndex safely (important for global regexes)
        const re = new RegExp(pattern.regex.source, pattern.regex.flags);
        let match: RegExpExecArray | null;
        while ((match = re.exec(node.value)) !== null) {
          allMatches.push({
            type: pattern.type,
            value: match[0],
            index: match.index,
            length: match[0].length,
          });
          // Prevent infinite loop on zero-width matches
          if (match[0].length === 0) re.lastIndex++;
        }
      }

      if (allMatches.length === 0) return;

      // Sort by position, then resolve overlaps (first match wins)
      allMatches.sort((a, b) => a.index - b.index);

      const nonOverlapping: typeof allMatches = [];
      let cursor = 0;
      for (const match of allMatches) {
        if (match.index >= cursor) {
          nonOverlapping.push(match);
          cursor = match.index + match.length;
        }
      }

      // Build replacement nodes
      const newNodes: any[] = [];
      let pos = 0;

      for (const match of nonOverlapping) {
        if (match.index > pos) {
          newNodes.push({ type: "text", value: node.value.slice(pos, match.index) });
        }
        newNodes.push(buildInlineNode(match.type, match.value));
        pos = match.index + match.length;
      }

      if (pos < node.value.length) {
        newNodes.push({ type: "text", value: node.value.slice(pos) });
      }

      // Replace original text node in-place
      parent.children.splice(index, 1, ...newNodes);
      // Tell unist-util-visit to skip the newly inserted nodes
      return index + newNodes.length;
    });
  };
};

// ─────────────────────────────────────────────────────────────
// when Google's favicon service returns 404 for invalid/partial URLs
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// InlineImagePreview — rich image card with lightbox
// ─────────────────────────────────────────────────────────────
const InlineImagePreview = memo(function InlineImagePreview({
  src,
  alt,
}: {
  src: string;
  alt?: string;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const ext = src.split(".").pop()?.split("?")[0] || "jpg";
      a.download = `image.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(src, "_blank");
    }
  }, [src]);

  if (errored) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground underline underline-offset-4 break-all"
      >
        {alt || src}
      </a>
    );
  }

  return (
    <>
      {/* Image Card */}
      <span className="group relative my-3 inline-block w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        <Image
          src={src}
          alt={alt ?? ""}
          width={800}
          height={600}
          onError={() => setErrored(true)}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          unoptimized
        />

        {/* Hover overlay */}
        <span className="absolute inset-0 flex items-end justify-end gap-1.5 bg-linear-to-t from-black/40 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            title="View full size"
            onClick={() => setLightboxOpen(true)}
          >
            <ZoomIn size={13} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            title="Download"
            onClick={handleDownload}
          >
            <Download size={13} />
          </Button>
        </span>

        {alt && (
          <span className="block border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground truncate">
            {alt}
          </span>
        )}
      </span>

      {/* Lightbox */}
      {lightboxOpen && (
        <span
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <span
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg border border-border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt ?? ""}
              width={1600}
              height={1200}
              className="max-h-[88vh] max-w-[88vw] w-auto h-auto object-contain"
              unoptimized
            />
            <span className="absolute right-2 top-2 flex gap-1.5">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                title="Download"
                onClick={handleDownload}
              >
                <Download size={14} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                title="Close"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={14} />
              </Button>
            </span>
          </span>
        </span>
      )}
    </>
  );
});

// ─────────────────────────────────────────────────────────────
// Component map — defined outside Markdown to avoid re-creation
// on every render. Safe because none of these close over props.
// ─────────────────────────────────────────────────────────────
const components: Record<string, React.FC<any>> = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-8 mb-4", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-8 mb-4", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("scroll-m-20 text-2xl font-semibold tracking-tight mt-6 mb-3", className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3", className)}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn("scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-3", className)}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn("scroll-m-20 text-base font-semibold tracking-tight mt-6 mb-3", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("leading-7", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-6 ml-6 list-disc not-first:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-6 ml-6 list-decimal not-first:mt-2", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground", className)}
      {...props}
    />
  ),
  img: ({ alt, src }: { alt?: string; src?: string }) => (
    <InlineImagePreview src={src ?? ""} alt={alt} />
  ),
  a: ({ className, href, children, ...props }) => {
    const url = href ?? "";
    const isExternal = url.startsWith("http://") || url.startsWith("https://");
    return (
      <Link
        href={url}
        className={cn("no-underline", className)}
        target={isExternal ? "_blank" : "_self"}
        rel={isExternal ? "noopener noreferrer" : undefined}
        {...props}
      >
        <Badge
          variant="ghost"
          className="bg-accent text-accent-foreground inline-flex items-center gap-1 px-1.5 py-0 h-5 align-middle -mt-0.5 max-w-64 overflow-hidden"
        >
          {isExternal && <Favicon url={url} />}
          <span className="truncate">{children}</span>
        </Badge>
      </Link>
    );
  },
  hr: ({ ...props }) => <hr className="my-4 md:my-8" {...props} />,
  table: ({ className, ...props }) => (
    <div className="my-6 w-full overflow-x-auto rounded-lg border border-border/60 scrollbar-none">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("bg-muted/60 sticky top-0", className)} {...props} />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn("border-b border-border/40 transition-colors hover:bg-muted/30", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        "[[align=center]]:text-center [[align=right]]:text-right whitespace-nowrap",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "px-4 py-3 text-left text-sm text-foreground/90",
        "[[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ children }) => <>{children}</>,

  /**
   * <code> renderer
   *
   * react-markdown v8+ no longer passes an `inline` prop.
   * Instead we detect context by:
   *   1. Language class present  → fenced code block (goes to CodeBlock)
   *   2. Content has newlines    → bare block code (inside <pre>)
   *   3. Neither                 → inline code (hex / mention / plain)
   *
   * If you added a new pattern type that maps to "inlineCode" in
   * buildInlineNode(), add a new branch here to render it.
   */
  code({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const codeContent = String(children).replace(/\n$/, "");
    const isBlock = match || codeContent.includes("\n");

    // ── Fenced block with language ─────────────────────────
    if (isBlock && match) {
      return <CodeBlock language={match[1]} value={codeContent} className="my-0" />;
    }

    // ── Block code without language (needs its own <pre> wrapper) ─────────
    if (isBlock) {
      return (
        <pre
          className={cn(
            "my-4 rounded-lg bg-secondary/60 text-sm font-mono leading-relaxed",
            "overflow-auto max-h-125 custom-scrollbar",
            "whitespace-pre-wrap wrap-break-word",
            "border border-border/40",
            className
          )}
        >
          <code className={cn("font-mono text-sm", className)} {...props}>
            {children}
          </code>
        </pre>
      );
    }

    // ── Inline from here down ──────────────────────────────

    // Hex color swatch: #RGB or #RRGGBB
    const isHexColor = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/i.test(codeContent);
    if (isHexColor) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-muted/50 px-1.5 py-0.5 rounded-md font-mono text-sm border border-border/50 align-middle">
          <span
            className="w-3 h-3 rounded-full border shadow-sm shrink-0"
            style={{ backgroundColor: codeContent }}
          />
          <span>{codeContent}</span>
        </span>
      );
    }

    // @mention pill
    const isMention = /^@[a-zA-Z0-9_]+$/.test(codeContent);
    if (isMention) {
      return (
        <span className="inline-block bg-blue-500/10 text-blue-500 font-semibold px-2 py-0.5 rounded-full text-sm border border-blue-500/10 mx-0.5 cursor-pointer hover:bg-blue-500/20 hover:text-blue-600 transition-all duration-200 shadow-sm active:scale-95">
          {codeContent}
        </span>
      );
    }



    // Plain inline code fallback
    return (
      <code
        className={cn(
          "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
};

// ─────────────────────────────────────────────────────────────
// Markdown component
// ─────────────────────────────────────────────────────────────
interface MarkdownProps {
  children: string;
}

const Markdown = memo(({ children }: MarkdownProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath, remarkMaya]}
    rehypePlugins={[rehypeRaw, rehypeKatex]}
    components={components}
  >
    {children}
  </ReactMarkdown>
));

Markdown.displayName = "Markdown";

export default Markdown;