/**
 * Audio Utility
 *
 * Provides functions for playing notification sounds from base64-encoded strings.
 */

/**
 * Plays an audio clip from a base64 string or a URL.
 * Uses the Web Audio API or HTML5 Audio for maximum compatibility.
 *
 * @param source - The data URI or URL of the audio clip (e.g. "data:audio/wav;base64,..." or "/sounds/ding.mp3")
 */
export const playAudio = (source: string) => {
  if (typeof window === "undefined") return;

  try {
    const audio = new Audio(source);
    audio.volume = 1;
    audio.play()
      .catch((err) => {
        console.warn("Playback blocked or failed:", err.message);
      });
  } catch (err) {
    console.error("Error creating audio element:", err);
  }
};
