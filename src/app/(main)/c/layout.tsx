"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { ChatProvider } from "@/features/chat/context/ChatProvider";
import { useChatContext } from "@/features/chat/context/ChatContext";
import { Header } from "@/components/Header";
import { Artifact } from "@/features/chat/components/message/Artifact";
import { cn } from "@/lib/utils/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Loader from "@/components/common/Loader";

type ArtifactSelection = {
  messageId: string;
  artifactIndex: number;
  title: string;
  content: string;
  type: string;
  openTab?: "code" | "preview";
};

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const conversationId = params?.id as string;
  const { messages, isStreaming } = useChatContext();
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] =
    useState<ArtifactSelection | null>(null);
  const [defaultTab, setDefaultTab] = useState<"code" | "preview">("code");
  const isResizing = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prevArtifactCount = useRef(0);

  const artifactItems = useMemo(() => {
    return messages.flatMap((message) => {
      let artifactIndex = 0;

      return (message.parts ?? []).flatMap((part) => {
        if (part.type !== "artifact") return [];

        const item = {
          messageId: message.id,
          artifactIndex,
          title: part.attributes.title || "Artifact",
          content: part.content,
          type: part.attributes.type || "code",
        };
        artifactIndex += 1;
        return [item];
      });
    });
  }, [messages]);

  const [prevConversationId, setPrevConversationId] = useState(conversationId);
  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    setIsArtifactOpen(false);
    setSelectedArtifact(null);
  }

  // Auto-open artifact panel when a new artifact appears during streaming
  useEffect(() => {
    if (isStreaming && artifactItems.length > prevArtifactCount.current) {
      const timer = setTimeout(() => setIsArtifactOpen(true), 0);
      return () => clearTimeout(timer);
    }
    prevArtifactCount.current = artifactItems.length;
  }, [artifactItems.length, isStreaming]);

  const artifactData =
    (selectedArtifact
      ? (artifactItems.find(
          (item) =>
            item.messageId === selectedArtifact.messageId &&
            item.artifactIndex === selectedArtifact.artifactIndex,
        ) ?? selectedArtifact)
      : null) ??
    artifactItems[artifactItems.length - 1] ??
    null;

  // Artifact cards in messages own opening the panel.
  useEffect(() => {
    const handleArtifactOpen = (event: Event) => {
      const detail = (event as CustomEvent<ArtifactSelection>).detail;
      if (!detail) return;

      setSelectedArtifact(detail);
      setDefaultTab(detail.openTab ?? "code");
      setIsArtifactOpen(true);
    };

    window.addEventListener("artifact-open", handleArtifactOpen);
    return () => {
      window.removeEventListener("artifact-open", handleArtifactOpen);
    };
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    if (!isResizing.current) return;
    isResizing.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;
    const newLeftWidth = (relativeX / containerRect.width) * 100;

    // Constraints: min 20%, max 80%
    if (newLeftWidth > 20 && newLeftWidth < 80) {
      setLeftWidth(newLeftWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Content shared between mobile and desktop
  const chatContent = (
    <div
      className={cn(
        "flex flex-col h-dvh overflow-hidden shrink-0 transition-[width] duration-300 ease-in-out",
        isMobile ? "w-full" : isArtifactOpen ? `w-[${leftWidth}%]` : "w-full",
      )}
      style={
        !isMobile
          ? { width: isArtifactOpen ? `${leftWidth}%` : "100%" }
          : undefined
      }
    >
      <Header />
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-row h-dvh w-full overflow-hidden bg-background relative"
    >
      {chatContent}

      {!isMobile && isArtifactOpen && (
        <>
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={cn(
              "w-1.5 h-full cursor-col-resize transition-all duration-200 z-50",
              "bg-border/10 hover:bg-primary/30 active:bg-primary/50",
              "group relative",
            )}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 bg-border group-hover:bg-primary/50 transition-colors" />
          </div>

          {/* Artifact Panel (Desktop) */}
          <div
            className="flex h-dvh overflow-hidden shrink-0 bg-muted/5 border-l border-border/50 animate-in slide-in-from-right duration-300"
            style={{ width: `${100 - leftWidth}%` }}
          >
            {artifactData ? (
              <Artifact
                title={artifactData.title}
                content={artifactData.content}
                type={artifactData.type}
                defaultTab={defaultTab}
                onClose={() => setIsArtifactOpen(false)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Waiting for artifact...
              </div>
            )}
          </div>
        </>
      )}

      {/* Artifact Panel (Mobile Bottom Sheet) */}
      {isMobile && (
        <Sheet open={isArtifactOpen} onOpenChange={setIsArtifactOpen}>
          <SheetContent
            side="bottom"
            className="h-[85dvh] p-0 border-none rounded-t-2xl overflow-hidden shadow-2xl [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Artifact</SheetTitle>
            </SheetHeader>
            <div className="h-full w-full overflow-hidden">
              {artifactData ? (
                <Artifact
                  title={artifactData.title}
                  content={artifactData.content}
                  type={artifactData.type}
                  defaultTab={defaultTab}
                  onClose={() => setIsArtifactOpen(false)}
                />
              ) : (
                <Loader />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </ChatProvider>
  );
}
