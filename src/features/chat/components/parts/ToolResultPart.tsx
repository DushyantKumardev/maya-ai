"use client";

import React from "react";
import { MessagePart } from "@/features/chat/types";
import { WIDGET_REGISTRY } from "../widgets";
import { motion } from "motion/react";

interface ToolResultPartProps {
  part: MessagePart & { type: "tool_result" };
  messageId: string;
}

/**
 * ToolResultPart
 * 
 * Renders the final functional output of a tool.
 * It maps the 'result' field to 'data' for compatibility with existing widgets.
 */
export default function ToolResultPart({ part, messageId }: ToolResultPartProps) {
  const { toolName, result } = part;
  const Widget = toolName ? WIDGET_REGISTRY[toolName] : undefined;

  if (!Widget) {
    // If no widget is found, we might want to show a debug view in dev, 
    // but for production users we stay silent or show a generic success.
    return null;
  }

  // Normalize the part for the widget (existing widgets expect 'data' field)
  const normalizedPart = {
    ...part,
    data: result,
    done: true,
  } as any;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.4 
      }}
      className="w-full my-2 overflow-visible"
    >
      <Widget part={normalizedPart} messageId={messageId} />
    </motion.div>
  );
}
