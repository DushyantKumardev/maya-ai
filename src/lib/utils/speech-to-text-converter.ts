/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Speech to Text Converter.
 *
 * Uses the Web Speech API (SpeechRecognition) to convert speech to text.
 * Supported in Chrome, Edge, Safari, and Opera.
 * Defaults to continuous listening and interim results.
 *
 * @param options - Configuration options for the speech recognizer.
 * @returns An instance controlling the speech recognition loop.
 */


interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export type SpeechToTextOptions = {
  /**
   * Whether to listen continuously or stop after one sentence.
   * Default: true
   */
  continuous?: boolean;
  /**
   * Whether to return interim results (real-time).
   * Default: true
   */
  interimResults?: boolean;
  /**
   * Language code (e.g., 'en-US').
   * Default: 'en-US'
   */
  lang?: string;
};

// Return type for the factory function
export type SpeechToTextInstance = {
  start: (
    onResult?: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void,
  ) => void;
  stop: () => void;
  abort: () => void;
  isSupported: boolean;
};

/**
 * Creates a speech-to-text converter instance.
 * @param options Configuration options
 * @returns Object with methods to control speech recognition
 */
export const createSpeechToText = (
  options: SpeechToTextOptions = {},
): SpeechToTextInstance => {
  let recognition: any | null = null;
  let isListening = false;

  // Default options
  const config = {
    continuous: true,
    interimResults: true,
    lang: "en-US",
    ...options,
  };

  // Callbacks storage
  let onResultCallback: ((text: string, isFinal: boolean) => void) | null =
    null;
  let onErrorCallback: ((error: string) => void) | null = null;
  let onEndCallback: (() => void) | null = null;

  // Initialize function
  const init = () => {
    if (typeof window !== "undefined") {
      const { webkitSpeechRecognition, SpeechRecognition } =
        window as unknown as IWindow;
      const SpeechRecognitionConstructor =
        SpeechRecognition || webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        recognition = new SpeechRecognitionConstructor();
        recognition.continuous = config.continuous;
        recognition.interimResults = config.interimResults;
        recognition.lang = config.lang;

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (onResultCallback) {
            if (finalTranscript) {
              onResultCallback(finalTranscript, true);
            }
            if (interimTranscript) {
              onResultCallback(interimTranscript, false);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);

          if (onErrorCallback) {
            let msg = event.error;
            if (event.error === "not-allowed") {
              msg = "Microphone access denied. Please allow microphone access.";
            } else if (event.error === "no-speech") {
              msg = "No speech detected. Please try again.";
            } else if (event.error === "network") {
              msg = "Network error. Please check your internet connection.";
            }
            onErrorCallback(msg);
          }
        };

        recognition.onend = () => {
          isListening = false;
          if (onEndCallback) {
            onEndCallback();
          }
        };
      } else {
        console.warn("Speech Recognition API not supported in this browser.");
      }
    }
  };

  // Initialize on creation
  init();

  const start = (
    onResult?: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void,
  ) => {
    if (!recognition) {
      if (onError)
        onError("Speech Recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      // Already listening, but we can update callbacks
      if (onResult) onResultCallback = onResult;
      if (onError) onErrorCallback = onError;
      if (onEnd) onEndCallback = onEnd;
      return;
    }

    // Update callbacks for this session
    if (onResult) onResultCallback = onResult;
    if (onError) onErrorCallback = onError;
    if (onEnd) onEndCallback = onEnd;

    try {
      recognition.start();
      isListening = true;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      // If it's already started, ignore error
      if (onError && (err as any).name !== "InvalidStateError") {
        onError("Failed to start speech recognition.");
      }
    }
  };

  const stop = () => {
    if (recognition && isListening) {
      recognition.stop();
      isListening = false;
    }
  };

  const abort = () => {
    if (recognition && isListening) {
      recognition.abort();
      isListening = false;
    }
  };

  return {
    start,
    stop,
    abort,
    isSupported: !!recognition,
  };
};
