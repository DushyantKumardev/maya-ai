"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { APP_NAME } from "@/lib/constants";
import { QuickSettingsSheet } from "@/features/chat/components/QuickSettingsSheet";
import ModelSelector from "@/features/chat/components/ModelSelector";
import { useSettings } from "@/features/settings/context/SettingsContext";
import { Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/utils";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { useChatHandler } from "@/features/chat/hooks/use-chat-handler";
import { getCachedConversationTitle } from "@/features/sidebar/components/ConversationList";

export function Header() {
  const { settings, updateMemory } = useSettings();
  const { resetChat } = useChatHandler();
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const lastFetchedId = useRef<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const getConversationId = (path: string) => {
    const match = path.match(/^\/c\/(.+)$/);
    return match ? match[1] : null;
  };
  const conversationId = getConversationId(pathname);

  useEffect(() => {
    if (!conversationId || conversationId === "new") {
      lastFetchedId.current = null;
      return;
    }

    if (lastFetchedId.current === conversationId) return;

    let cancelled = false;

    const loadTitle = async () => {
      if (conversationId.startsWith("ephemeral_")) {
        setChatTitle("New Chat (Incognito)");
        lastFetchedId.current = conversationId;
        return;
      }

      // Try to load instantly from Sidebar cache to avoid a network request!
      const cachedTitle = getCachedConversationTitle(conversationId);
      if (cachedTitle) {
        setChatTitle(cachedTitle);
        lastFetchedId.current = conversationId;
        return;
      }

      try {
        const res = await fetch(
          API_ENDPOINTS.CONVERSATIONS.BY_ID(conversationId),
        );
        if (!res.ok || cancelled) return;

        const data = await res.json();
        if (!cancelled) {
          setChatTitle(data.title || null);
          lastFetchedId.current = conversationId;
        }
      } catch {
        if (!cancelled) {
          setChatTitle(null);
        }
      }
    };

    loadTitle();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const handleConversationUpdated = () => {
      lastFetchedId.current = null;
      const conversationId = getConversationId(pathname);
      if (!conversationId || conversationId === "new") {
        setChatTitle(null);
        return;
      }

      if (conversationId.startsWith("ephemeral_")) {
        setChatTitle("New Chat (Incognito)");
        lastFetchedId.current = conversationId;
        return;
      }

      // Try to load instantly from Sidebar cache to avoid a network request!
      const cachedTitle = getCachedConversationTitle(conversationId);
      if (cachedTitle) {
        setChatTitle(cachedTitle);
        lastFetchedId.current = conversationId;
        return;
      }

      void fetch(API_ENDPOINTS.CONVERSATIONS.BY_ID(conversationId))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.title) {
            setChatTitle(data.title);
            lastFetchedId.current = conversationId;
          }
        })
        .catch(() => {
          setChatTitle(null);
        });
    };

    const handleNewChat = () => {
      setChatTitle(null);
      lastFetchedId.current = null;
    };

    const handleUrlChanged = () => {
      lastFetchedId.current = null;
      setChatTitle(null);
    };

    window.addEventListener("conversation-updated", handleConversationUpdated);
    window.addEventListener("new-chat", handleNewChat);
    window.addEventListener("url-changed", handleUrlChanged);

    return () => {
      window.removeEventListener(
        "conversation-updated",
        handleConversationUpdated,
      );
      window.removeEventListener("new-chat", handleNewChat);
      window.removeEventListener("url-changed", handleUrlChanged);
    };
  }, [conversationId, pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="-ml-1 h-9 w-9 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
        <div className="flex w-full items-baseline gap-2 overflow-hidden">
          <span className="max-w-[60%] truncate text-sm font-semibold tracking-tight text-foreground/90">
            {conversationId ? chatTitle || APP_NAME : APP_NAME}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <ModelSelector />
        </div>

        <div className="flex items-center gap-1">
          <div className="h-4 w-px bg-border/50 mx-1 md:hidden" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newValue = !settings.persistConversations;
              void updateMemory({ persistConversations: newValue });

              // Reset chat when toggling Incognito Mode in either direction to prevent state mixing/corruption
              if (conversationId) {
                resetChat();
                router.push("/c");
              }
            }}
            className={cn(
              "h-9 w-9 rounded-full transition-all",
              !settings.persistConversations
                ? "bg-primary/10 text-primary hover:bg-primary/20"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            title={
              !settings.persistConversations
                ? "Incognito Mode Active"
                : "Incognito Mode Disabled"
            }
          >
            <Ghost
              className={cn(
                "h-4 w-4",
                !settings.persistConversations && "fill-current",
              )}
            />
          </Button>

          <ThemeToggle />
          <QuickSettingsSheet />
        </div>
      </div>
    </header>
  );
}
