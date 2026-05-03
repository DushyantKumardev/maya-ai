"use client";

import React from "react";
import MarkdownMessages from "@/features/chat/components/MarkdownMessages";
import { Highlighter } from "./Highlighter";

/** Resolved artifact type used internally across the artifact system. */
export type ResolvedArtifactType =
  | "html"
  | "javascript"
  | "typescript"
  | "css"
  | "python"
  | "json"
  | "markdown"
  | "text";

interface ArtifactRendererProps {
  content: string;
  resolvedType: ResolvedArtifactType;
  rawType: string;
}

export function resolveArtifactType(type: string): ResolvedArtifactType {
  const t = type.toLowerCase().trim();

  if (t === "html" || t === "htm") return "html";
  if (["javascript", "js", "jsx"].includes(t)) return "javascript";
  if (["typescript", "ts", "tsx"].includes(t)) return "typescript";
  if (t === "css") return "css";
  if (["python", "py"].includes(t)) return "python";
  if (t === "json") return "json";
  if (t.includes("markdown") || t.includes("md")) return "markdown";

  return "text";
}

/** Returns true if this artifact type can be run in the browser sandbox. */
export function canRunArtifact(resolvedType: ResolvedArtifactType): boolean {
  return resolvedType === "html" || resolvedType === "javascript";
}

/**
 * Full-width inline syntax highlighter used exclusively inside the artifact panel.
 * No card wrapper, no header, no max-width — fills the entire panel.
 */
function ArtifactCodeView({ language, content }: { language: string; content: string }) {
  return (
    <div className="h-full w-full overflow-hidden" data-component="ArtifactCodeView">
      <Highlighter
        language={language}
        value={content}
        customStyle={{
          padding: "1.5rem 2rem",
          fontSize: "13px",
          lineHeight: "1.7",
          width: "100%",
          height: "100%",
          overflow: "auto",
        }}
      />
    </div>
  );
}

/**
 * ArtifactRenderer — selects and renders the appropriate full-width viewer
 * for a given artifact type. No CodeBlock dependency — custom rendering only.
 */
export function ArtifactRenderer({ content, resolvedType, rawType }: ArtifactRendererProps) {
  const lang = rawType || resolvedType;

  switch (resolvedType) {
    case "markdown":
      return (
        <div 
          className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-foreground/80 p-6 md:p-10 text-wrap"
          data-component="ArtifactMarkdownView"
        >
          <MarkdownMessages>{content}</MarkdownMessages>
        </div>
      );

    case "html":
    case "javascript":
    case "typescript":
    case "css":
    case "python":
    case "json":
      return <ArtifactCodeView language={lang} content={content} />;

    case "text":
    default:
      // Generic or unknown — treat as code if rawType looks like a code lang
      if (lang && lang !== "text" && lang !== "plain" && lang !== "txt") {
        return <ArtifactCodeView language={lang} content={content} />;
      }
      return (
        <pre 
          className="whitespace-pre-wrap break-words text-sm font-mono text-foreground/80 leading-relaxed p-8 w-full h-full"
          data-component="ArtifactTextView"
        >
          {content}
        </pre>
      );
  }
}
