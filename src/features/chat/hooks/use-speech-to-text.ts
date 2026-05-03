"use client";
import * as React from "react";
import { createSpeechToText, SpeechToTextInstance } from "@/lib/utils";
import { HANDSFREE_START_BEEP, HANDSFREE_STOP_BEEP } from "@/lib/constants";
import { toast } from "sonner";

interface UseSpeechToTextOptions {
  onTranscript: (text: string) => void;
  currentText: string;
}

/**
 * Hook that encapsulates all speech-to-text logic:
 * start/stop, silence detection, sound effects, and interim results.
 */
export function useSpeechToText({
  onTranscript,
  currentText,
}: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = React.useState(false);
  const [isHearing, setIsHearing] = React.useState(false);

  const speechConverter = React.useRef<SpeechToTextInstance | null>(null);
  const silenceTimer = React.useRef<NodeJS.Timeout | null>(null);
  const baseInput = React.useRef(currentText);

  const playStartSound = () => {
    new Audio(HANDSFREE_START_BEEP).play().catch(() => {});
  };

  const playStopSound = () => {
    new Audio(HANDSFREE_STOP_BEEP).play().catch(() => {});
  };

  React.useEffect(() => {
    speechConverter.current = createSpeechToText({
      continuous: true,
      interimResults: true,
    });

    return () => {
      if (speechConverter.current?.isSupported) {
        speechConverter.current.stop();
      }
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, []);

  const stopListening = React.useCallback(() => {
    if (speechConverter.current) {
      speechConverter.current.stop();
      setIsListening(false);
      setIsHearing(false);
      playStopSound();
    }
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
  }, []);

  const toggleListening = React.useCallback(() => {
    if (!speechConverter.current?.isSupported) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      setIsListening(true);
      playStartSound();
      baseInput.current = currentText;

      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        stopListening();
      }, 4000);

      speechConverter.current!.start(
        (text, isFinal) => {
          setIsHearing(true);
          setTimeout(() => setIsHearing(false), 300);

          if (silenceTimer.current) clearTimeout(silenceTimer.current);
          silenceTimer.current = setTimeout(() => {
            stopListening();
          }, 4000);

          const separator =
            baseInput.current && !baseInput.current.endsWith(" ") ? " " : "";

          if (isFinal) {
            baseInput.current = baseInput.current + separator + text;
            onTranscript(baseInput.current);
          } else {
            onTranscript(baseInput.current + separator + text);
          }
        },
        (error) => {
          console.error("Speech error:", error);
          if (error === "No speech detected. Please try again.") {
            toast.warning(error, { duration: 2000 });
          } else {
            toast.error(error || "An error occurred during speech recognition.");
            stopListening();
          }
        },
        () => {
          setIsListening(false);
          setIsHearing(false);
        },
      );
    }
  }, [isListening, currentText, stopListening, onTranscript]);

  return { isListening, isHearing, toggleListening };
}
