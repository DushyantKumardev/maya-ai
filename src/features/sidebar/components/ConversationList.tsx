"use client";

import { Button } from "@/components/ui/button";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { useSession } from "next-auth/react";

interface ConversationItem {
  _id: string;
  title: string;
  updatedAt: string;
}

// Module-level cache to persist conversation history across sidebar open/close toggles and Radix sheet unmounts
let cachedConversations: ConversationItem[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds Cache TTL

export function getCachedConversationTitle(id: string): string | null {
  if (!cachedConversations) return null;
  const found = cachedConversations.find((c) => c._id === id);
  return found ? found.title : null;
}

const ConversationList = ({ open }: { open: boolean }) => {
  const [conversations, setConversations] = React.useState<ConversationItem[]>(
    cachedConversations || [],
  );
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(!cachedConversations);
  const pathname = usePathname();

  const [activeConversationId, setActiveConversationId] = React.useState<
    string | null
  >(null);

  const [generatingTitleId, setGeneratingTitleId] = React.useState<
    string | null
  >(null);

  const { status } = useSession();

  const fetchConversations = useCallback(async (force = false) => {
    if (status === "authenticated") {
      // Return cached list if still within Cache TTL and not forced
      if (!force && cachedConversations && Date.now() - lastFetchTime < CACHE_TTL) {
        setConversations(cachedConversations);
        setIsLoadingHistory(false);
        return;
      }

      try {
        const res = await fetch(API_ENDPOINTS.CONVERSATIONS.BASE);
        if (res.ok) {
          const data = await res.json();
          setConversations(data);
          cachedConversations = data;
          lastFetchTime = Date.now();
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
  }, [status]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(API_ENDPOINTS.CONVERSATIONS.BY_ID(id), {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => {
          const updated = prev.filter((c) => c._id !== id);
          cachedConversations = updated;
          return updated;
        });
        if (window.location.pathname === `/c/${id}`) {
          window.dispatchEvent(new CustomEvent("new-chat"));
          window.history.replaceState(null, "", "/c");
        }
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    setActiveConversationId(
      pathname.startsWith("/c/") ? pathname.split("/c/")[1] : null,
    );
  }, [pathname]);

  useEffect(() => {
    const handleTitleGenerating = (e: CustomEvent<{ id: string }>) => {
      setGeneratingTitleId(e.detail.id);
    };

    const handleConversationUpdated = () => {
      setGeneratingTitleId(null);
      fetchConversations(true); // Force fetch on conversation updates to get fresh titles/list!
    };

    window.addEventListener(
      "title-generating",
      handleTitleGenerating as EventListener,
    );
    window.addEventListener("conversation-updated", handleConversationUpdated);

    return () => {
      window.removeEventListener(
        "title-generating",
        handleTitleGenerating as EventListener,
      );
      window.removeEventListener(
        "conversation-updated",
        handleConversationUpdated,
      );
    };
  }, [fetchConversations]);

  return (
    <SidebarContent
      className={`custom-scrollbar flex-1 px-2 py-3 ${open ? "" : "hidden"}`}
      data-group="conversation-history"
    >
      {isLoadingHistory ? (
        <div className="px-1">
          <SidebarMenu>
            {Array.from({ length: 5 }).map((_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl px-4 py-6 text-center text-sm text-muted-foreground">
          No chats yet
        </div>
      ) : (
        <SidebarGroup className="gap-2 px-1">
          <SidebarGroupLabel className="px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            Recent chats
          </SidebarGroupLabel>
          <SidebarMenu>
            {conversations.map((conv) => (
              <SidebarMenuItem key={conv._id}>
                <SidebarMenuButton
                  asChild
                  isActive={activeConversationId === conv._id}
                  className="group/item relative h-10 rounded-lg px-3 text-[13px] font-medium transition-all duration-200 hover:bg-sidebar-accent/50 data-[active=true]:bg-sidebar-accent/80 data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm"
                >
                  <Link href={`/c/${conv._id}`} prefetch={false}>
                    {/* Active indicator bar */}
                    {activeConversationId === conv._id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.75 rounded-r-full bg-primary" />
                    )}
                    {generatingTitleId === conv._id ? (
                      <div className="relative min-w-0 flex-1 overflow-hidden py-1">
                        <Skeleton className="h-4 w-3/4 rounded-sm bg-primary/20 dark:bg-primary/30 animate-pulse relative before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/40 dark:before:via-white/20 before:to-transparent" />
                      </div>
                    ) : (
                      <span className="flex-1 truncate">{conv.title}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(e, conv._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-background/80 hover:text-destructive group-hover/item:opacity-100"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </SidebarContent>
  );
};

export default ConversationList;
