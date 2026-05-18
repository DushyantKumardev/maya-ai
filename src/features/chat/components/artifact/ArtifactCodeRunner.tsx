"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import type { ResolvedArtifactType } from "./ArtifactRenderer";

interface ArtifactCodeRunnerProps {
  code: string;
  language: ResolvedArtifactType;
  isStreaming?: boolean;
}

/** Builds the full srcdoc HTML for the sandbox iframe */
function buildSrcdoc(code: string, language: ResolvedArtifactType): string {
  if (language === "html") {
    return code;
  }

  // Vanilla JS — wrap in minimal HTML boilerplate
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 1rem; background: #0d0d0d; color: #e5e5e5; }
  </style>
</head>
<body>
  <script>
    try {
      ${code}
    } catch(e) {
      console.error(e.message);
    }
  <\/script>
</body>
</html>`;
}

/**
 * ArtifactCodeRunner — renders a sandboxed <iframe> preview for HTML / vanilla JS.
 * Does not capture console logs to ensure a clean productivity user experience.
 */
export function ArtifactCodeRunner({ code, language, isStreaming = false }: ArtifactCodeRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcdoc, setSrcdoc] = useState(() => buildSrcdoc(code, language));
  const [isLoading, setIsLoading] = useState(true);
  const runId = useRef(0); // used to ignore stale messages after reload
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    // If it's streaming, do not reload/re-run the iframe code
    if (isStreaming) {
      return;
    }

    runId.current += 1;
    setSrcdoc(buildSrcdoc(code, language));
    setIsLoading(true);
    hasLoadedOnce.current = false;
  }, [code, language, isStreaming]);

  const handleReload = useCallback(() => {
    runId.current += 1;
    setIsLoading(true);
    hasLoadedOnce.current = false;
    setSrcdoc(buildSrcdoc(code, language));
  }, [code, language]);

  const handleOpenInNewTab = useCallback(() => {
    const rawContent = language === "html" ? code : srcdoc;
    const blob = new Blob([rawContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }, [code, language, srcdoc]);

  return (
    <div 
      className="flex flex-col h-full w-full overflow-hidden rounded-lg border border-border/40 bg-black/40"
      data-component="ArtifactCodeRunner"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/10 shrink-0">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {language === "html" ? "HTML Preview" : "JS Sandbox"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
            onClick={handleOpenInNewTab}
            title="Open in new tab (full screen)"
          >
            <ExternalLink className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
            onClick={handleReload}
            title="Reload preview"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        {isStreaming ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md z-20 animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-3 p-6 max-w-sm text-center">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                <RefreshCw className="size-5 animate-spin" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Generating Preview...</h3>
              <p className="text-xs text-muted-foreground">
                We'll render the interactive preview once the assistant finishes writing the code.
              </p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            title="Artifact Preview"
            className="w-full h-full border-0 bg-white"
            onLoad={() => {
              setIsLoading(false);
              hasLoadedOnce.current = true;
            }}
          />
        )}
        {isLoading && !hasLoadedOnce.current && !isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
