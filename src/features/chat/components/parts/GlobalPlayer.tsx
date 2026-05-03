"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { usePlayback } from "../../context/PlaybackContext";
import { 
  Play, 
  Pause, 
  X, 
  SkipBack,
  SkipForward,
  Music2, 
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

export function GlobalPlayer() {
  const { 
    activeId, 
    type, 
    metadata, 
    isPlaying, 
    setPlaying, 
    stop 
  } = usePlayback();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolume, setShowVolume] = useState(false);

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

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!activeId) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="minimal-bar"
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
          className="sticky top-0 z-50 mx-auto w-fit pt-4 pb-2"
        >
          <div className="relative overflow-hidden flex flex-col items-center rounded-3xl border border-white/20 bg-background/60 shadow-2xl backdrop-blur-xl">
            {/* Main Controller Row */}
            <div className="flex items-center gap-3 p-1.5 pr-4">
              {/* Playback Controls */}
              <div className="flex items-center gap-0.5 px-2">
                <Button variant="ghost" size="icon" className="size-8 rounded-full text-foreground/70 hover:bg-white/10">
                  <SkipBack className="size-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                  onClick={() => setPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-full text-foreground/70 hover:bg-white/10">
                  <SkipForward className="size-4" />
                </Button>
              </div>

              {/* Info Pill */}
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-4">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-white/20 shadow-lg">
                  {metadata?.coverArt ? (
                    <Image src={metadata.coverArt} alt="" width={32} height={32} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                      <Music2 className="size-4" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="max-w-30 truncate text-[11px] font-bold tracking-tight text-foreground/90 leading-tight">
                    {metadata?.title || "Unknown Track"}
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                    {metadata?.artist || metadata?.label || "Maya AI"}
                  </span>
                </div>
              </div>

              {/* Utilities */}
              <div className="flex items-center gap-1">
                {/* Volume Control */}
                <div 
                  className="relative flex items-center"
                  onMouseEnter={() => setShowVolume(true)}
                  onMouseLeave={() => setShowVolume(false)}
                >
                  <AnimatePresence>
                    {showVolume && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 80, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="overflow-hidden flex items-center"
                      >
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-20 h-1 mx-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 rounded-full text-muted-foreground/60 hover:bg-white/5"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </Button>
                </div>

                <div className="h-4 w-px bg-white/10 mx-1" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 rounded-full text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={stop}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Seeker / Progress Row */}
            <div className="group relative w-full px-6 pb-2 -mt-1 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[8px] font-mono font-bold text-muted-foreground/40 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="relative h-1 w-full rounded-full bg-white/10 group-hover:h-1.5 transition-all cursor-pointer">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary/60 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <input 
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
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
