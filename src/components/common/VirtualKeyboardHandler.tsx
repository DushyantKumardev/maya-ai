"use client";

import { useEffect } from "react";

/**
 * VirtualKeyboardHandler
 * 
 * This component manages the VirtualKeyboard API to prevent content from being hidden
 * under the virtual keyboard on supported browsers (Chrome on Windows/Android).
 * 
 * It sets overlaysContent = true which tells the browser NOT to resize the viewport,
 * and instead we handle the layout adjustment manually using the --keyboard-height CSS variable.
 */
export default function VirtualKeyboardHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if the VirtualKeyboard API is supported
    if ("virtualKeyboard" in navigator) {
      const vk = (navigator as any).virtualKeyboard;
      
      // Opt-in to the overlays behavior
      vk.overlaysContent = true;

      const updateKeyboardHeight = (height: number) => {
        document.documentElement.style.setProperty("--keyboard-height", `${height}px`);
      };

      // Initial update (should be 0)
      if (vk.boundingRect) {
        updateKeyboardHeight(vk.boundingRect.height);
      }

      const handleGeometryChange = (e: any) => {
        const { boundingRect } = e.target;
        updateKeyboardHeight(boundingRect.height);
      };

      vk.addEventListener("geometrychange", handleGeometryChange);

      return () => {
        vk.removeEventListener("geometrychange", handleGeometryChange);
        document.documentElement.style.removeProperty("--keyboard-height");
        // Reset overlaysContent if needed, though usually we want it globally
        // vk.overlaysContent = false; 
      };
    }
  }, []);

  return null;
}
