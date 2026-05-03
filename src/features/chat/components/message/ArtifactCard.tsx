"use client";

import { ChevronRight, Code2, FileText } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import type { MessagePart } from "@/features/chat/types";

interface ArtifactCardProps {
  part: Extract<MessagePart, { type: "artifact" }>;
  messageId: string;
  artifactIndex: number;
}

export function ArtifactCard({ part, messageId, artifactIndex }: ArtifactCardProps) {
  const title = part.attributes.title || "Artifact";
  const type = part.attributes.type || "document";
  const isCode =
    type.includes("code") ||
    type.includes("script") ||
    type.includes("typescript") ||
    type.includes("javascript") ||
    type.includes("python");

  const openArtifact = () => {
    window.dispatchEvent(
      new CustomEvent("artifact-open", {
        detail: {
          messageId,
          artifactIndex,
          title,
          content: part.content,
          type,
        },
      }),
    );
  };

  return (
    <button
      type="button"
      onClick={openArtifact}
      className={cn(
        "my-3 flex w-full max-w-md items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left shadow-sm transition-all",
        "hover:border-primary/40 hover:bg-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      title="Open artifact"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {isCode ? <Code2 className="size-5" /> : <FileText className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {type} · {part.content.length} characters
        </span>
      </span>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <ChevronRight className="size-4" />
      </span>
    </button>
  );
}
