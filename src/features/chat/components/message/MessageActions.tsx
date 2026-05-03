"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { useChatContext } from "../../context/ChatContext";
import { MessagePart } from "@/features/chat/types";

interface MessageActionsProps {
  content: string;
  messageId: string;
  isAssistant: boolean;
  parts?: MessagePart[];
}

async function copyRichText(messageId: string, fallbackContent: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-message-id="${messageId}"]`,
  );

  if (el) {
    const clone = el.cloneNode(true) as HTMLElement;

    clone
      .querySelectorAll("[data-copy-exclude]")
      .forEach((node) => node.remove());

    const html = clone.innerHTML;
    const plainText = clone.innerText || fallbackContent;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
    }
  }

  await navigator.clipboard.writeText(fallbackContent);
}

export default function MessageActions({
  content,
  messageId,
  isAssistant,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const { regenerate, isLoading } = useChatContext();

  const handleCopy = async () => {
    try {
      await copyRichText(messageId, content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Failed to copy to clipboard");
    }
  };

  const actions = [
    {
      key: "copy",
      show: true,
      onClick: handleCopy,
      title: "Copy message",
      icon: copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      ),
    },
    {
      key: "regenerate",
      show: isAssistant,
      onClick: () => regenerate(messageId),
      title: "Regenerate response",
      icon: <RefreshCw className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div
      className={cn(
        "my-1 flex items-center gap-0.5",
        isAssistant ? "justify-start -ml-1" : "justify-end",
      )}
    >
      {actions
        .filter((action) => action.show)
        .map((action) => (
          <Button
            variant="ghost"
            size="icon"
            key={action.key}
            onClick={action.onClick}
            title={action.title}
            disabled={action.key === "regenerate" && isLoading}
            className="h-7 w-7 cursor-pointer rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {action.icon}
          </Button>
        ))}
    </div>
  );
}
