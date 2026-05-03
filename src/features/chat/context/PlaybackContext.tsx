"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type PlaybackType = "audio";

export interface PlaybackMetadata {
  title: string;
  artist?: string;
  coverArt?: string | null;
  duration?: number;
  label?: string;
}

interface PlaybackContextType {
  activeId: string | null;
  type: PlaybackType;
  metadata: PlaybackMetadata | null;
  isPlaying: boolean;
  isMinimized: boolean;
  play: (id: string, type: PlaybackType, metadata?: PlaybackMetadata) => void;
  pause: () => void;
  setPlaying: (playing: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  stop: () => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [type, setType] = useState<PlaybackType>("audio");
  const [metadata, setMetadata] = useState<PlaybackMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const play = useCallback((id: string, newType: PlaybackType, newMetadata?: PlaybackMetadata) => {
    setActiveId(id);
    setType(newType);
    if (newMetadata) setMetadata(newMetadata);
    setIsPlaying(true);
    setIsMinimized(false);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const setPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const setMinimized = useCallback((minimized: boolean) => {
    setIsMinimized(minimized);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setActiveId(null);
    setMetadata(null);
    setIsMinimized(false);
  }, []);

  return (
    <PlaybackContext.Provider
      value={{
        activeId,
        type,
        metadata,
        isPlaying,
        isMinimized,
        play,
        pause,
        stop,
        setPlaying,
        setMinimized,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
}

// Fallback for legacy code
export const useMusic = usePlayback;
