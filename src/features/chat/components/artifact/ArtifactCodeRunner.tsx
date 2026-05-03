"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { RefreshCw, Terminal, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import type { ResolvedArtifactType } from "./ArtifactRenderer";

interface ConsoleEntry {
  level: "log" | "warn" | "error" | "info";
  args: string[];
  timestamp: number;
}

interface ArtifactCodeRunnerProps {
  code: string;
  language: ResolvedArtifactType;
}

/** Builds the full srcdoc HTML for the sandbox iframe */
function buildSrcdoc(code: string, language: ResolvedArtifactType): string {
  // The console bridge — overrides console methods and postMessages to parent
  const consoleBridge = `
<script>
  (function() {
    var _post = function(level, args) {
      try {
        parent.postMessage({
          type: '__artifact_console__',
          level: level,
          args: args.map(function(a) {
            try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
            catch(e) { return String(a); }
          })
        }, '*');
      } catch(e) {}
    };
    ['log','warn','error','info'].forEach(function(m) {
      var orig = console[m].bind(console);
      console[m] = function() {
        var args = Array.prototype.slice.call(arguments);
        _post(m, args);
        orig.apply(console, arguments);
      };
    });
    window.addEventListener('error', function(e) {
      _post('error', [e.message + (e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : '')]);
    });
    window.addEventListener('unhandledrejection', function(e) {
      _post('error', ['Unhandled Promise Rejection: ' + String(e.reason)]);
    });
  })();
<\/script>`;

  if (language === "html") {
    // Inject console bridge at the top of <head> if possible, else prepend
    if (code.includes("<head>")) {
      return code.replace("<head>", "<head>" + consoleBridge);
    }
    return consoleBridge + code;
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
  ${consoleBridge}
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

const LEVEL_STYLES: Record<ConsoleEntry["level"], string> = {
  log: "text-foreground/80",
  info: "text-blue-400",
  warn: "text-amber-400",
  error: "text-red-400",
};

const LEVEL_PREFIX: Record<ConsoleEntry["level"], string> = {
  log: "›",
  info: "ℹ",
  warn: "⚠",
  error: "✖",
};

/**
 * ArtifactCodeRunner — renders a sandboxed <iframe> preview for HTML / vanilla JS.
 * Console output is captured via postMessage and shown in a collapsible panel.
 */
export function ArtifactCodeRunner({ code, language }: ArtifactCodeRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcdoc, setSrcdoc] = useState(() => buildSrcdoc(code, language));
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const runId = useRef(0); // used to ignore stale messages after reload

  // Listen for console messages from the sandbox
  useEffect(() => {
    const id = runId.current;
    const handler = (event: MessageEvent) => {
      if (
        event.data?.type === "__artifact_console__" &&
        runId.current === id
      ) {
        const entry: ConsoleEntry = {
          level: event.data.level,
          args: event.data.args,
          timestamp: Date.now(),
        };
        setConsoleEntries((prev) => [...prev, entry]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [srcdoc]);

  useEffect(() => {
    runId.current += 1;
    const timer = setTimeout(() => {
      setSrcdoc(buildSrcdoc(code, language));
      setConsoleEntries([]);
      setIsLoading(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [code, language]);

  const handleReload = useCallback(() => {
    runId.current += 1;
    setConsoleEntries([]);
    setIsLoading(true);
    setSrcdoc(buildSrcdoc(code, language));
  }, [code, language]);

  const errorCount = consoleEntries.filter((e) => e.level === "error").length;

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
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-md hover:bg-primary/10 hover:text-primary"
          onClick={handleReload}
          title="Reload preview"
        >
          <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Iframe */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        <iframe
          ref={iframeRef}
          srcDoc={srcdoc}
          sandbox="allow-scripts"
          title="Artifact Preview"
          className="w-full h-full border-0 bg-white"
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Console panel */}
      <div className="shrink-0 border-t border-border/30 bg-black/60 max-h-48 flex flex-col">
        {/* Console header */}
        <button
          onClick={() => setConsoleOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 w-full text-left hover:bg-muted/10 transition-colors"
        >
          <Terminal className="size-3 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex-1">
            Console
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
              <AlertCircle className="size-3" />
              {errorCount} error{errorCount > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/50">{consoleEntries.length}</span>
          {consoleOpen ? (
            <ChevronDown className="size-3 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-3 text-muted-foreground" />
          )}
        </button>

        {/* Console entries */}
        {consoleOpen && (
          <div className="overflow-y-auto max-h-36 px-3 pb-2 space-y-0.5 custom-scrollbar">
            {consoleEntries.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/40 italic py-1">No output yet.</p>
            ) : (
              consoleEntries.map((entry, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 font-mono text-[11px] leading-relaxed",
                    LEVEL_STYLES[entry.level]
                  )}
                >
                  <span className="shrink-0 mt-px opacity-60">{LEVEL_PREFIX[entry.level]}</span>
                  <span className="break-all">{entry.args.join(" ")}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
