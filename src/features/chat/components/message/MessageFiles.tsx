"use client";

import React from "react";
import { FileText } from "lucide-react";
import { TextFile } from "@/features/chat/types";
import { cn } from "@/lib/utils/utils";
import { formatAttachmentSize } from "@/lib/attachments";

interface MessageFilesProps {
  files: TextFile[];
  isUser?: boolean;
}

export function MessageFiles({ files, isUser }: MessageFilesProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-wrap gap-2 mt-1",
      isUser ? "justify-end" : "justify-start"
    )}>
      {files.map((file, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 pl-3 pr-4 py-1.5 transition-all hover:bg-secondary/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </div>
          
          <div className="flex flex-col">
            <span className="max-w-37.5 truncate text-[11px] font-semibold text-foreground/90">
              {file.filename}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">
              {formatAttachmentSize(file.size)} {file.kind}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
