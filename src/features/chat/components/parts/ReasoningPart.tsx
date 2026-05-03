"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronUp } from "lucide-react";
import TextShimmer from "@/components/ui/shimmer/TextShimmer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";

interface ReasoningPartProps {
  reasoning: string;
  isThinking: boolean;
}

/**
 * ReasoningPart
 *
 * Renders the assistant's internal chain-of-thought (reasoning).
 * Uses a collapsible UI with smooth scrolling for streaming content.
 */
export default function ReasoningPart({
  reasoning,
  isThinking,
}: ReasoningPartProps) {
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const lines = React.useMemo(() => 
    reasoning
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0),
    [reasoning]
  );

  // Extract the latest title wrapped in ** (e.g. **Thinking about life**)
  const currentStatus = React.useMemo(() => {
    const boldMatches = Array.from(reasoning.matchAll(/\*\*(.*?)\*\*/g));
    if (boldMatches.length > 0) {
      return boldMatches[boldMatches.length - 1][1];
    }
    return "Thinking...";
  }, [reasoning]);

  const isOpen = isThinking || isManuallyOpen;

  // Scroll to bottom of container
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [lines.length, isOpen]);

  if (!reasoning) return null;

  return (
    <div data-copy-exclude className="mb-2">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsManuallyOpen}
        className="w-full transition-transform duration-300"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant={"ghost"}
            className="group -ml-3 flex items-center gap-2.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground/70 transition-all hover:bg-secondary/50 hover:text-foreground"
          >
            {isThinking ? (
              <div className="flex items-center gap-2">
                <TextShimmer 
                  text={currentStatus} 
                  speed={2} 
                  className="font-medium text-primary/80" 
                  color="var(--muted-foreground)"
                  shineColor="var(--primary)"
                />
              </div>
            ) : (
              <span className="text-secondary-foreground/80">Thought Process</span>
            )}
            <ChevronUp
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                isOpen ? "" : "rotate-180",
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-3">
          <div
            ref={scrollContainerRef}
            className="mt-4 relative max-h-80 overflow-y-auto custom-scrollbar"
          >
            <div className="relative flex flex-col gap-4 py-1">
              {/* Vertical Line - connects the dots from first to last */}
              <div className="absolute left-1.75 top-3.5 bottom-3.5 w-px bg-secondary/80" />

              {lines.map((line, i) => {
                const isLastLine = i === lines.length - 1;
                return (
                  <div key={i} className="flex items-start gap-4 pl-0">
                    <div className="relative z-10 mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-background border border-border/40 shadow-sm">
                      {isThinking && isLastLine ? (
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      ) : (
                        <Check
                          className={cn(
                            "h-2 w-2",
                            line.startsWith("**") && line.endsWith("**") 
                              ? "text-primary/70" 
                              : "text-emerald-500/80"
                          )}
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <p className={cn(
                      "text-sm leading-relaxed font-normal transition-colors",
                      line.startsWith("**") && line.endsWith("**")
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground/80"
                    )}>
                      {line.startsWith("**") && line.endsWith("**") 
                        ? line.slice(2, -2) 
                        : line}
                    </p>
                  </div>
                );
              })}

              {!isThinking && (
                <div className="flex items-start gap-4 pl-0 opacity-60">
                  <div className="relative z-10 mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-secondary/50 border border-border/20">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  </div>
                  <p className="text-xs italic text-muted-foreground/70">
                    I&apos;m done.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
