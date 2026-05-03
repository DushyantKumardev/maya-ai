"use client";

import {
  FileText,
  Code2,
  Download,
  Copy,
  Check,
  X,
  Eye,
  FileCode,
  FileJson,
  Braces,
  Hash,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import {
  ArtifactRenderer,
  resolveArtifactType,
  canRunArtifact,
} from "@/features/chat/components/artifact/ArtifactRenderer";
import { ArtifactCodeRunner } from "@/features/chat/components/artifact/ArtifactCodeRunner";

interface ArtifactProps {
  title: string;
  content: string;
  type: string;
  url?: string;
  id?: string;
  defaultTab?: "code" | "preview";
  onClose?: () => void;
}

type Tab = "code" | "preview";

function getTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t === "html" || t === "htm") return <FileCode className="size-5" />;
  if (["javascript", "js", "jsx", "typescript", "ts", "tsx"].includes(t))
    return <Braces className="size-5" />;
  if (t === "json") return <FileJson className="size-5" />;
  if (["python", "py"].includes(t)) return <Hash className="size-5" />;
  if (["markdown", "md"].includes(t)) return <FileText className="size-5" />;
  if (
    ["code", "css", "script"].includes(t) ||
    ["bash", "sh", "sql", "yaml", "xml", "rust", "go", "c", "cpp", "java"].includes(t)
  )
    return <Code2 className="size-5" />;
  return <FileText className="size-5" />;
}

function getDownloadExtension(rawType: string): string {
  const map: Record<string, string> = {
    html: "html",
    htm: "html",
    javascript: "js",
    js: "js",
    jsx: "jsx",
    typescript: "ts",
    ts: "ts",
    tsx: "tsx",
    css: "css",
    python: "py",
    py: "py",
    json: "json",
    markdown: "md",
    md: "md",
    text: "txt",
    plain: "txt",
    bash: "sh",
    sh: "sh",
    sql: "sql",
    yaml: "yaml",
    xml: "xml",
  };
  return map[rawType.toLowerCase()] ?? "txt";
}

export const Artifact = ({ title, content, type, defaultTab = "code", onClose }: ArtifactProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const resolvedType = useMemo(() => resolveArtifactType(type), [type]);
  const runnable = useMemo(() => canRunArtifact(resolvedType), [resolvedType]);

  const [prevContent, setPrevContent] = useState(content);
  if (content !== prevContent) {
    setPrevContent(content);
    setActiveTab(defaultTab);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = getDownloadExtension(type);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9_\-. ]/gi, "_") || "artifact"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex flex-col w-full h-full bg-background/50 backdrop-blur-sm overflow-hidden"
      data-component="Artifact"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/50 bg-muted/20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner shrink-0">
            {getTypeIcon(type)}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm font-bold text-foreground leading-tight truncate max-w-48 md:max-w-64">
              {title}
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              {type || "Document"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="size-4" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
              onClick={onClose}
              title="Close artifact"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Tab bar (only when runnable) ────────────────────────────────── */}
      {runnable && (
        <div className="flex items-center gap-1 px-4 pt-2 pb-0 border-b border-border/30 bg-muted/10 shrink-0">
          {(["code", "preview"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-t-md transition-all capitalize relative",
                activeTab === tab
                  ? "text-primary bg-background/60 shadow-sm after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-px after:bg-background/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
              )}
            >
              {tab === "code" ? (
                <Code2 className="size-3" />
              ) : (
                <Eye className="size-3" />
              )}
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* ── Content Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden min-h-0">
        {runnable && activeTab === "preview" ? (
          <div className="h-full w-full p-3">
            <ArtifactCodeRunner code={content} language={resolvedType} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar bg-card/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ArtifactRenderer
              content={content}
              resolvedType={resolvedType}
              rawType={type}
            />
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-2 border-t border-border/50 bg-muted/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">
            Live Artifact
          </span>
          {runnable && (
            <span className="text-[10px] font-medium text-primary/60 uppercase tracking-tight ml-1">
              · Runnable
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground/50">
          {content.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  );
};
