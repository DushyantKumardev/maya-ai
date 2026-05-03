import React from "react";
import dynamic from "next/dynamic";

const Markdown = dynamic(() => import("../MarkdownMessages"), {
  ssr: true,
  loading: () => <div className="animate-pulse h-4 w-24 bg-muted/20 rounded" />
});

interface ContentPartProps {
  content: string;
}

export default function ContentPart({ content }: ContentPartProps) {
  if (!content) return null;

  return (
    <div className="mb-1 text-[15px] leading-[1.7] text-foreground">
      <Markdown>{content}</Markdown>
    </div>
  );
}
