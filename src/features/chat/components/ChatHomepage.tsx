"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import ChatInputBox from "@/features/chat/components/chat-input-box";
import { APP_LOGO, APP_NAME, HOME_PAGE_GREETINGS, SUGGESTIONS } from "@/lib/constants";
import { useChatContext } from "@/features/chat/context/ChatContext";
import { TypingText } from "@/components/common/TypingText";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/utils";

const getIconColor = (id: string) => {
  switch (id) {
    case "code": return "text-emerald-500 dark:text-emerald-400";
    case "brainstorm": return "text-blue-500 dark:text-blue-400";
    case "explain": return "text-amber-500 dark:text-amber-400";
    case "draft": return "text-purple-500 dark:text-purple-400";
    default: return "text-muted-foreground";
  }
};

export default function ChatHomeClient() {
  const {
    textInput,
    handleInputChange,
    handleSubmit,
    setTextInput,
    reasoningEffort,
    setReasoningEffort,
    replyTo,
    setReplyTo,
  } = useChatContext();

  const { data: session } = useSession();
  const [hasMounted, setHasMounted] = useState(false);
  const [greeting, setGreeting] = useState("");

  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const userName = session?.user?.name?.split(" ")[0] || "there";

  useEffect(() => {
    const timer = setTimeout(() => setHasMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    const greetings =
      typeof HOME_PAGE_GREETINGS === "function"
        ? HOME_PAGE_GREETINGS(userName)
        : HOME_PAGE_GREETINGS;

    if (Array.isArray(greetings) && greetings.length > 0) {
      const randomGreeting =
        greetings[Math.floor(Math.random() * greetings.length)];
      const timer = setTimeout(() => setGreeting(randomGreeting), 0);
      return () => clearTimeout(timer);
    }
  }, [userName, hasMounted]);

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-background px-4">
      <div className="relative z-10 flex w-full max-w-chat flex-col items-center gap-8 text-center -translate-y-8">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5 p-2.5 transition-transform duration-300 hover:scale-105">
            <Image
              src={APP_LOGO.LIGHT}
              alt={APP_NAME}
              width={36}
              height={36}
              className="drop-shadow-sm dark:hidden"
              priority
            />
            <Image
              src={APP_LOGO.DARK}
              alt={APP_NAME}
              width={36}
              height={36}
              className="hidden drop-shadow-sm dark:block"
              priority
            />
          </div>

          <h1 className="max-w-2xl px-4 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-4xl">
            {hasMounted && <TypingText text={greeting} />}
          </h1>
        </div>

        {/* Input Area */}
        <div className="w-full flex flex-col gap-4">
          <ChatInputBox
            ref={inputRef}
            textInput={textInput}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={false}
            stop={() => {}}
            isStreaming={false}
            setTextInput={setTextInput}
            reasoningEffort={reasoningEffort}
            setReasoningEffort={setReasoningEffort}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
          />

          {/* Suggestion Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 px-2 mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {SUGGESTIONS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setTextInput(s.prompt);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-card/45",
                    "hover:border-primary/20 hover:bg-secondary hover:text-foreground text-muted-foreground",
                    "transition-all duration-200 active:scale-95 cursor-pointer shadow-sm backdrop-blur-sm",
                  )}
                >
                  <Icon className={cn("size-3.5", getIconColor(s.id))} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
