"use client";

import { useEffect, useState } from "react";

type TypingTextProps = {
  text: string;
  speed?: number;
  className?: string;
};

export function TypingText({ text, speed = 20, className }: TypingTextProps) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (!text) return;

    const interval = setInterval(() => {
      setVisible((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  if (!text || text?.length > 500) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className} aria-live="polite">
      {text.slice(0, visible)}
    </span>
  );
}