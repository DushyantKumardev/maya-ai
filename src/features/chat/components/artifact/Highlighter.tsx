"use client";

import React, { useState, useEffect } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import python from "react-syntax-highlighter/dist/cjs/languages/prism/python";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/cjs/languages/prism/jsx";
import css from "react-syntax-highlighter/dist/cjs/languages/prism/css";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import markup from "react-syntax-highlighter/dist/cjs/languages/prism/markup";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import sql from "react-syntax-highlighter/dist/cjs/languages/prism/sql";
import yaml from "react-syntax-highlighter/dist/cjs/languages/prism/yaml";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "next-themes";

// Register languages
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("html", markup);
SyntaxHighlighter.registerLanguage("htm", markup);
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("xml", markup);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("yaml", yaml);

interface HighlighterProps {
  language: string;
  value: string;
  customStyle?: React.CSSProperties;
  className?: string;
}

export function Highlighter({ language, value, customStyle, className }: HighlighterProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <SyntaxHighlighter
      key={isDark ? "dark" : "light"}
      language={language}
      style={isDark ? vscDarkPlus : vs}
      customStyle={{
        margin: 0,
        backgroundColor: "transparent",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        ...customStyle,
      }}
      codeTagProps={{
        style: {
          fontFamily: "var(--font-mono)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        },
      }}
      wrapLines={true}
      PreTag="div"
      className={className}
      {...({ "data-component": "Highlighter" } as any)}
    >
      {value}
    </SyntaxHighlighter>
  );
}
