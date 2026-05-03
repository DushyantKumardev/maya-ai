"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CornerUpLeft } from "lucide-react";
import { useChatContext } from "../../context/ChatContext";

export default function SelectionPopup() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [selectedText, setSelectedText] = useState("");
  const { setReplyTo } = useChatContext();

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    // Check if selection is within a chat message
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

    const isWithinChatMessage = (node as HTMLElement).closest(
      '[data-component="chat-message"]',
    );

    if (!isWithinChatMessage || text.length < 2) {
      setPosition(null);
      return;
    }

    const rect = range.getBoundingClientRect();

    // Position it above the selection center
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 45,
    });

    setSelectedText(text);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const onAskMaya = () => {
    if (!selectedText) return;

    setReplyTo(selectedText);

    // Focus the chat input
    const chatInput = document.querySelector(
      'textarea[data-component="chat-input"]',
    ) as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.focus();
      // Scroll to bottom of textarea if needed
      chatInput.scrollTop = chatInput.scrollHeight;
    }

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setPosition(null);
  };

  return (
    <AnimatePresence>
      {position && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            zIndex: 100,
            transform: "translateX(-50%)",
          }}
          className="pointer-events-auto"
        >
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="flex items-center overflow-hidden rounded-xl bg-black px-3.5 py-2 shadow-2xl transition-all hover:bg-black/90 active:scale-95"
          >
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={onAskMaya}
              className="flex items-center gap-2 text-[15px] font-bold text-white"
            >
              <span>Reply</span>
              <CornerUpLeft size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Smaill arrow at bottom */}
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 bg-black rotate-45 pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
