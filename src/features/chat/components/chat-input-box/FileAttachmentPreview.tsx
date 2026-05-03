"use client";

import React from "react";
import { X, FileText } from "lucide-react";
import { TextFile } from "@/features/chat/types";
import { formatAttachmentSize } from "@/lib/attachments";

interface FileAttachmentPreviewProps {
  files: TextFile[];
  onRemove: (index: number) => void;
}

export function FileAttachmentPreview({ files, onRemove }: FileAttachmentPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2">
      {files.map((file, idx) => (
        <div
          key={idx}
          className="group relative flex items-center gap-2 rounded-xl border border-border bg-secondary/30 pl-3 pr-2 py-1.5 transition-all hover:bg-secondary/50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </div>
          
          <div className="flex flex-col pr-6">
            <span className="max-w-30 truncate text-[11px] font-semibold text-foreground/90">
              {file.filename}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">
              {formatAttachmentSize(file.size)} {file.kind}
            </span>
          </div>

          <button
            onClick={() => onRemove(idx)}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
