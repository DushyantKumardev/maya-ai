"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { usePlayback } from "../../context/PlaybackContext";
import { Play, Pause, X, Music2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

export function GlobalPlayer() {
  const { activeId, type, metadata, isPlaying, setPlaying, stop } =
    usePlayback();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Handle Audio Playback
  useEffect(() => {
    if (type === "audio" && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, type, activeId]);

  // Sync Volume/Mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : 0.8;
    }
  }, [isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  if (!activeId) return null;

  // Circle progress calculation
  const radius = 14;
  const circumference = 2 * Math.PI * radius; // 87.96
  const progressPercent = currentTime / (duration || 1);
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <>
      <style>{`
        @keyframes eq-bar-1 { 0%, 100% { height: 4px; } 50% { height: 16px; } }
        @keyframes eq-bar-2 { 0%, 100% { height: 6px; } 50% { height: 12px; } }
        @keyframes eq-bar-3 { 0%, 100% { height: 3px; } 50% { height: 18px; } }
        .eq-bar-active-1 { animation: eq-bar-1 0.8s ease-in-out infinite; }
        .eq-bar-active-2 { animation: eq-bar-2 0.6s ease-in-out infinite; }
        .eq-bar-active-3 { animation: eq-bar-3 0.7s ease-in-out infinite; }
      `}</style>

      <AnimatePresence mode="wait">
        <motion.div
          key="luxury-sticky-badge"
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="sticky top-0 z-50 mx-auto w-fit pt-3 pb-1 select-none animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="relative flex items-center gap-3 p-2 rounded-2xl border border-white/20 bg-background/80 shadow-[0_8px_32px_rgba(0,0,0,0.15)] shadow-primary/5 backdrop-blur-md transition-all duration-300 hover:border-primary/30">
            {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-300 flex items-center justify-center shrink-0 active:scale-95"
              onClick={() => setPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current ml-0.5" />
              )}
            </Button>

            {/* Circular Progress & Art Badge */}
            <div className="relative size-9 flex items-center justify-center shrink-0">
              <svg
                className="size-9 absolute inset-0 -rotate-90"
                viewBox="0 0 36 36"
              >
                {/* Background Ring */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="2"
                />
                {/* Active Progress Ring */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-100 ease-out"
                />
              </svg>
              {/* Art thumbnail inside progress ring */}
              <div className="absolute inset-1 rounded-full overflow-hidden border border-white/10 bg-muted shadow-inner">
                {metadata?.coverArt ? (
                  <Image
                    src={metadata.coverArt}
                    alt=""
                    width={28}
                    height={28}
                    className={`h-full w-full object-cover transition-transform duration-1000 ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                    <Music2 className="size-3.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Title, Artist, & Equalizer Stack */}
            <div className="flex items-center gap-3 pr-1">
              <div className="flex flex-col min-w-24 max-w-28 select-none">
                <span className="truncate text-[10px] font-bold tracking-tight text-foreground/90 leading-tight">
                  {metadata?.title || "Unknown Track"}
                </span>
                <span className="truncate text-[8px] font-medium text-muted-foreground/60 uppercase tracking-wider leading-none mt-0.5">
                  {metadata?.artist || metadata?.label || "Maya AI"}
                </span>
              </div>

              {/* Animated Equalizer Waveform */}
              <div className="flex items-end gap-0.5 h-4.5 w-4.5 shrink-0 px-0.5 pb-0.5">
                <div
                  className={`w-[2.5px] bg-primary/80 rounded-full transition-all duration-300 ${isPlaying ? "eq-bar-active-1" : "h-0.75"}`}
                />
                <div
                  className={`w-[2.5px] bg-primary/80 rounded-full transition-all duration-300 ${isPlaying ? "eq-bar-active-2" : "h-0.75"}`}
                />
                <div
                  className={`w-[2.5px] bg-primary/80 rounded-full transition-all duration-300 ${isPlaying ? "eq-bar-active-3" : "h-0.75"}`}
                />
              </div>
            </div>

            {/* Mute and Close Controls */}
            <div className="flex items-center gap-0.5 border-l border-white/10 pl-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground/60 hover:bg-white/5 active:scale-95"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="size-3.5" />
                ) : (
                  <Volume2 className="size-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                onClick={stop}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={activeId}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={stop}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </>
  );
}
