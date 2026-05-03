"use client";

import React, { useState, useCallback } from "react";
import { Check, Copy, Code2, Eye } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { Highlighter } from "../artifact/Highlighter";

interface CodeBlockProps {
  language: string;
  value: string;
  className?: string;
  /** Optional: the title to show in the artifact panel when previewing */
  previewTitle?: string;
}

export function CodeBlock({ language, value, className, previewTitle }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const isHtml = language.toLowerCase() === "html" || language.toLowerCase() === "htm";

  const openPreview = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("artifact-open", {
        detail: {
          messageId: `codeblock-${Date.now()}`,
          artifactIndex: 0,
          title: previewTitle || "HTML Preview",
          content: value,
          type: "html",
          openTab: "preview",
        },
      }),
    );
  }, [value, previewTitle]);

  const copyToClipboard = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative my-6 overflow-hidden rounded-lg border border-border/5 shadow-sm transition-all hover:shadow-lg",
        "bg-card text-card-foreground",
        className,
      )}
      data-component="CodeBlock"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Code2 size={14} className="text-primary/70" />
          <span className="text-base font-bold text-secondary-foreground font-mono uppercase tracking-wider">
            {language || "text"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview button — only for HTML */}
          {isHtml && (
            <Button
              variant="ghost"
              size="sm"
              onClick={openPreview}
              className="h-7 px-3 text-[11px] font-semibold gap-1.5 text-primary/70 hover:text-primary hover:bg-primary/10 transition-all"
              aria-label="Preview HTML"
            >
              <Eye size={12} />
              Preview
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 px-3 text-[11px] font-semibold gap-1.5 text-muted-foreground hover:text-foreground transition-all"
            aria-label="Copy code"
          >
            {isCopied ? (
              <>
                <Check size={12} className="text-green-500" />
              </>
            ) : (
              <>
                <Copy size={12} />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative overflow-hidden custom-scrollbar">
        <div className="overflow-x-auto max-h-112.5 custom-scrollbar selection:bg-primary/20">
          <Highlighter
            language={language}
            value={value}
            customStyle={{
              padding: "1.25rem 1.5rem 1.25rem 1rem",
              fontSize: "13px",
              lineHeight: "1.6",
            }}
          />
        </div>

        {/* Subtle gradient at the bottom for long code */}
        {value.split("\n").length > 15 && (
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-linear-to-t from-card/30 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
