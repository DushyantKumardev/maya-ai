"use client";

import React, { useEffect, useState } from "react";
import { MessagePart } from "@/features/chat/types";
import { motion, AnimatePresence } from "motion/react";
import TextShimmer from "@/components/ui/shimmer/TextShimmer";
import { cn } from "@/lib/utils/utils";

interface StatusPartProps {
  part: MessagePart & { type: "status" };
  messageId: string;
  allStatusParts: MessagePart[];
}

function isStatusPart(part: MessagePart | undefined): part is Extract<MessagePart, { type: "status" }> {
  return part?.type === "status";
}

/**
 * StatusPart
 *
 * Renders a transient progress indicator for tools and internal processes.
 * - Loading: shimmer animated chip with pulsing dot.
 * - Done: fades out after a short delay to keep the UI clean.
 * 
 * All permanent UI results (widgets) are handled by ToolResultPart.
 */
export default function StatusPart({
  part,
  messageId,
  allStatusParts,
}: StatusPartProps) {
  const lastPart = allStatusParts[allStatusParts.length - 1];
  const lastStatusPart = isStatusPart(lastPart) ? lastPart : null;

  const isLatest = lastStatusPart?.toolCallId === part.toolCallId;
  const { messages, done } = part;
  const visibilityKey = `${messageId}:${part.toolCallId ?? "no-tool-call"}`;

  // Auto-hide chips after completion
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  
  useEffect(() => {
    if (done) {
      const timeoutId = window.setTimeout(() => {
        setDismissedKey(visibilityKey);
      }, 1800);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [done, visibilityKey]);

  const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

  // Logic to determine visibility
  const visible = dismissedKey !== visibilityKey;
  
  // Show the chip if it's not dismissed yet AND (it's not done OR it's the latest one)
  const shouldShowChip = visible && (!done || isLatest);

  const label = latestMessage
    ? latestMessage.charAt(0).toUpperCase() + latestMessage.slice(1)
    : null;

  // ── Rendering ──────────────────────────────────────────────────────────────

  const renderChip = () => {
    if (!latestMessage && done) return null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.98, y: 2 }}
        animate={{ opacity: done ? 0.6 : 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -2 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "flex items-center gap-2.5 py-1 text-[11px] font-medium transition-colors",
          done ? "text-muted-foreground/50" : "text-muted-foreground"
        )}
      >
        {/* State indicator: Globe for search, or small dot/pulsing for generic */}
        {/* {isWebSearch && !done ? (
          <Globe className="size-3.5 text-primary/70 animate-pulse" />
        ) : !done ? (
          null
        ) : (
          <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/30 ml-1" />
        )} */}

        {/* Text Area */}
        <div className="flex-1 truncate">
          {label ? (
            done ? (
              <span className="truncate max-w-64">{label}</span>
            ) : (
              <TextShimmer
                text={label}
                speed={2}
                color="var(--muted-foreground)"
                shineColor="var(--primary)"
                spread={70}
                className="font-medium text-primary/80"
              />
            )
          ) : (
            <span className="flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-start gap-2 mb-1 w-full" data-copy-exclude>
      <AnimatePresence mode="wait">
        {shouldShowChip && (
          <motion.div
            key="status-chip-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderChip()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
