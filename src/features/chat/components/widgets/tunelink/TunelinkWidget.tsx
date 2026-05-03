"use client";

import React, { useEffect, useRef } from "react";
import { Play, Pause, Music2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import { usePlayback } from "../../../context/PlaybackContext";
import { useChatContext } from "../../../context/ChatContext";
import { WidgetProps } from "../index";

export default function TunelinkWidget({ part }: WidgetProps) {
  const rawData = (part as any).data;
  const data = rawData?.result || rawData;

  const {
    activeId,
    isPlaying: globalPlaying,
    play,
    pause,
  } = usePlayback();
  const { isStreaming } = useChatContext();

  const audioUrl = data?.audioUrl || data?.url;
  const isCurrentTrack = activeId === audioUrl;
  const isPlaying = isCurrentTrack && globalPlaying;

  const {
    title,
    artist,
    album,
    coverArt: resultCoverArt,
    screenshot,
    label
  } = data || {};
  const coverArt = resultCoverArt || screenshot;
  const hasAutoPlayed = useRef(false);

  // Sync with global player on mount
  useEffect(() => {
    if (audioUrl && isStreaming && activeId !== audioUrl && !hasAutoPlayed.current) {
      play(audioUrl, "audio", {
        title: title || "Unknown Title",
        artist: artist || "Unknown Artist",
        coverArt: coverArt,
        label: label
      });
      hasAutoPlayed.current = true;
    }
  }, [audioUrl, isStreaming, play, activeId, title, artist, coverArt, label]);

  const isDone = part.type === "tool_result" || (part as any).done;
  if (!isDone) return null;
  if (!audioUrl && !data?.searchResults) return null;

  return (
    <div className="w-fit max-w-100 mt-3 mb-1 animate-in fade-in slide-in-from-top-1 duration-500">
      <div 
        className={cn(
          "group flex items-center gap-4 p-2.5 rounded-2xl border transition-all duration-300",
          isPlaying 
            ? "border-primary/20 bg-primary/5 shadow-[0_0_20px_-5px_rgba(var(--primary),0.15)]" 
            : "border-border/40 bg-secondary/10 hover:border-border/60 hover:bg-secondary/20"
        )}
      >
        {/* Compact Artwork / Icon */}
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-md">
          {coverArt ? (
            <Image src={coverArt} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
              <Music2 className="size-5" />
            </div>
          )}
          {isPlaying && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex items-end gap-0.5 h-4">
                  <div className="w-0.5 bg-white animate-[bounce_0.6s_infinite] h-full" />
                  <div className="w-0.5 bg-white animate-[bounce_0.6s_infinite_0.1s] h-2/3" />
                  <div className="w-0.5 bg-white animate-[bounce_0.6s_infinite_0.2s] h-1/2" />
                </div>
             </div>
          )}
        </div>

        {/* Track Details */}
        <div className="flex-1 min-w-30 max-w-50">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
              {label || "TuneLink"}
            </span>
            {isPlaying && (
              <span className="flex items-center gap-1">
                <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-500/80 uppercase tracking-tighter">Live</span>
              </span>
            )}
          </div>
          <h4 className="truncate text-[12px] font-bold text-foreground/90 leading-tight">
            {title || "Untitled"}
          </h4>
          <p className="truncate text-[10px] font-medium text-muted-foreground/60">
            {artist || album || "Unknown Artist"}
          </p>
        </div>

        {/* Control Button */}
        {audioUrl && (
          <button 
            onClick={() => isPlaying ? pause() : play(audioUrl, "audio", { title, artist, coverArt, label })}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90",
              isPlaying 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "bg-background/40 hover:bg-background/60 text-muted-foreground"
            )}
          >
            {isPlaying ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current ml-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
