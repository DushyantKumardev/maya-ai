"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Markdown from "../MarkdownMessages";

interface ErrorPartProps {
  error: string;
}

export default function ErrorPart({ error }: ErrorPartProps) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground  max-w-2xl">
      <AlertTriangle
        size={15}
        className="mt-0.5 shrink-0 opacity-80"
      />
      <div className="min-w-0 flex-1 leading-relaxed [&_p]:m-0">
        <Markdown>{error.trim()}</Markdown>
      </div>
    </div>
  );
}
