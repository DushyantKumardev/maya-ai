"use client";

import { useEffect } from "react";

/**
 * VirtualKeyboardHandler
 * 
 * Manages virtual keyboard height across both iOS Safari and Android Chrome.
 * Uses the standard Visual Viewport API with fallback to the VirtualKeyboard API.
 * Dynamically updates the --keyboard-height CSS variable and scrolls focused inputs into view.
 */
export default function VirtualKeyboardHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateKeyboardHeight = (height: number) => {
      document.documentElement.style.setProperty("--keyboard-height", `${Math.max(0, height)}px`);
      
      // Auto-scroll the active input into view when keyboard opens
      if (height > 50) {
        setTimeout(() => {
          const activeEl = document.activeElement;
          if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
            activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }, 120);
      }
    };

    // 1. Standard cross-platform: Visual Viewport API (iOS Safari, Mobile Chrome/Firefox)
    if (window.visualViewport) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport;
        if (!viewport) return;
        
        // The virtual keyboard height is the difference between innerHeight and visible height
        const height = window.innerHeight - viewport.height;
        updateKeyboardHeight(height);
      };

      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
      
      // Run once initially
      handleViewportChange();

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", handleViewportChange);
          window.visualViewport.removeEventListener("scroll", handleViewportChange);
        }
        document.documentElement.style.removeProperty("--keyboard-height");
      };
    }

    // 2. Fallback: Experimental VirtualKeyboard API (Chrome Android PWAs)
    if ("virtualKeyboard" in navigator) {
      const vk = (navigator as any).virtualKeyboard;
      vk.overlaysContent = true;

      const handleGeometryChange = (e: any) => {
        const { boundingRect } = e.target;
        updateKeyboardHeight(boundingRect.height);
      };

      vk.addEventListener("geometrychange", handleGeometryChange);

      return () => {
        vk.removeEventListener("geometrychange", handleGeometryChange);
        document.documentElement.style.removeProperty("--keyboard-height");
      };
    }
  }, []);

  return null;
}
