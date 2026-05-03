"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AppSettings } from "@/features/settings/types";
import { DEFAULT_SETTINGS } from "@/features/settings/types";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

const SettingsModal = dynamic(
  () => import("@/features/settings/components/SettingsModal").then(mod => mod.SettingsModal),
  { ssr: false }
);

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  syncSettings: (draft: AppSettings) => Promise<void>;

  // Semantic Update Functions (Now targeting flat keys)
  updateInterface: (
    updates: Partial<{
      theme: AppSettings["theme"];
      locale: AppSettings["locale"];
    }>,
  ) => Promise<void>;
  updateEngine: (
    updates: Partial<{
      provider: AppSettings["provider"];
      modelId: AppSettings["modelId"];
      config: AppSettings["config"];
    }>,
  ) => Promise<void>;
  updatePersona: (
    updates: Partial<{
      persona: AppSettings["persona"];
      outputFormat: AppSettings["outputFormat"];
      memories: AppSettings["memories"];
    }>,
  ) => Promise<void>;
  updateKeys: (
    updates: Partial<{
      emailProvider: AppSettings["emailProvider"];
      gmailEmail: AppSettings["gmailEmail"];
      resendEmail: AppSettings["resendEmail"];
      apiKeys: AppSettings["apiKeys"];
    }>,
  ) => Promise<void>;
  updateTools: (
    updates: Partial<{ tools: AppSettings["tools"] }>,
  ) => Promise<void>;
  updateMemory: (
    updates: Partial<{
      persistConversations: AppSettings["persistConversations"];
      maxMessagesPerConversation: AppSettings["maxMessagesPerConversation"];
      summarizeAfter: AppSettings["summarizeAfter"];
    }>,
  ) => Promise<void>;
  refetchSettings: () => Promise<void>;

  isLoading: boolean;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const { setTheme } = useTheme();

  // Sync theme with system/app when settings change
  useEffect(() => {
    if (settings.theme) {
      setTheme(settings.theme);
    }
  }, [settings.theme, setTheme]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS.BASE);
      if (res.ok) {
        const data = await res.json();
        // Merge with defaults to ensure all keys exist
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { status } = useSession();

  // Load from API on mount when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, fetchSettings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Modular: Appearance
   */
  const updateInterface = useCallback(async (
    updates: Partial<{
      theme: AppSettings["theme"];
      locale: AppSettings["locale"];
    }>,
  ) => {
    // 1. Update theme locally (client-side only)
    if (updates.theme) {
      setSettings((prev) => ({ ...prev, theme: updates.theme! }));
      setTheme(updates.theme);
    }

    // 2. Update locale on backend
    if (updates.locale) {
      try {
        const res = await fetch(API_ENDPOINTS.SETTINGS.INTERFACE, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: updates.locale }),
        });

        if (!res.ok) throw new Error("Failed to update locale settings");
        const data = await res.json();

        setSettings((prev) => ({
          ...prev,
          locale: data.locale,
        }));
      } catch (error) {
        console.error("Failed to update interface settings:", error);
        throw error;
      }
    }
  }, [setTheme]);

  /**
   * Modular: Model
   */
  const updateEngine = useCallback(async (
    updates: Partial<{
      provider: AppSettings["provider"];
      modelId: AppSettings["modelId"];
      config: AppSettings["config"];
    }>,
  ) => {
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS.ENGINE, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update engine settings");
      const data = await res.json();

      setSettings((prev) => ({
        ...prev,
        provider: data.provider,
        modelId: data.modelId,
        config: data.config,
      }));
    } catch (error) {
      console.error("Failed to update engine settings:", error);
      throw error;
    }
  }, []);

  /**
   * Modular: Instructions
   */
  const updatePersona = useCallback(async (
    updates: Partial<{
      persona: AppSettings["persona"];
      outputFormat: AppSettings["outputFormat"];
      memories: AppSettings["memories"];
    }>,
  ) => {
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS.PERSONA, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update persona settings");
      const data = await res.json();

      setSettings((prev) => ({
        ...prev,
        persona: data.persona,
        outputFormat: data.outputFormat,
        memories: data.memories,
      }));
    } catch (error) {
      console.error("Failed to update persona settings:", error);
      throw error;
    }
  }, []);

  /**
   * Modular: Connectivity
   */
  const updateKeys = useCallback(async (
    updates: Partial<{
      emailProvider: AppSettings["emailProvider"];
      gmailEmail: AppSettings["gmailEmail"];
      resendEmail: AppSettings["resendEmail"];
      apiKeys: AppSettings["apiKeys"];
    }>,
  ) => {
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS.KEYS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update keys settings");
      const data = await res.json();

      setSettings((prev) => ({
        ...prev,
        emailProvider: data.emailProvider,
        gmailEmail: data.gmailEmail,
        resendEmail: data.resendEmail,
        apiKeys: data.apiKeys,
      }));
    } catch (error) {
      console.error("Failed to update keys settings:", error);
      throw error;
    }
  }, []);

  /**
   * Modular: Capabilities
   */
  const updateTools = useCallback(async (
    updates: Partial<{ tools: AppSettings["tools"] }>,
  ) => {
    try {
      const res = await fetch(API_ENDPOINTS.SETTINGS.TOOLS, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update tools settings");
      const data = await res.json();

      setSettings((prev) => ({
        ...prev,
        tools: data.tools,
      }));
    } catch (error) {
      console.error("Failed to update tools settings:", error);
      throw error;
    }
  }, []);

  /**
   * Modular: History
   */
  const updateMemory = useCallback(async (
    updates: Partial<{
      persistConversations: AppSettings["persistConversations"];
      maxMessagesPerConversation: AppSettings["maxMessagesPerConversation"];
      summarizeAfter: AppSettings["summarizeAfter"];
    }>,
  ) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    try {
      await fetch(API_ENDPOINTS.SETTINGS.MEMORY, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error("Failed to update memory settings:", error);
    }
  }, []);

  /**
   * Universal: Sync all settings
   * Compares the entire flat structure and updates changed fields.
   */
  const syncSettings = useCallback(async (draft: AppSettings) => {
    setIsLoading(true);
    try {
      const changedKeys = (Object.keys(draft) as (keyof AppSettings)[]).filter(
        (key) => JSON.stringify(draft[key]) !== JSON.stringify(settings[key]),
      );

      if (changedKeys.length === 0) return;

      // For now, we still trigger modular API calls to avoid breaking the backend endpoints
      // In a later step, we can consolidate to a single PATCH /api/settings
      const updatePromises: Promise<any>[] = [];

      // Interface (Locale only for backend)
      if (changedKeys.includes("locale")) {
        updatePromises.push(updateInterface({ locale: draft.locale }));
      }

      // Theme is client-only, update local state immediately
      if (changedKeys.includes("theme")) {
        setSettings((prev) => ({ ...prev, theme: draft.theme }));
      }
      // Engine
      if (
        changedKeys.some((k) => ["provider", "modelId", "config"].includes(k))
      ) {
        updatePromises.push(
          updateEngine({
            provider: draft.provider,
            modelId: draft.modelId,
            config: draft.config,
          }),
        );
      }
      // Persona
      if (
        changedKeys.some((k) =>
          ["persona", "outputFormat", "memories"].includes(k),
        )
      ) {
        updatePromises.push(
          updatePersona({
            persona: draft.persona,
            outputFormat: draft.outputFormat,
            memories: draft.memories,
          }),
        );
      }
      // Keys
      if (changedKeys.some((k) => ["emailProvider", "gmailEmail", "resendEmail", "apiKeys"].includes(k))) {
        updatePromises.push(
          updateKeys({
            emailProvider: draft.emailProvider,
            gmailEmail: draft.gmailEmail,
            resendEmail: draft.resendEmail,
            apiKeys: draft.apiKeys,
          }),
        );
      }
      // Tools
      if (changedKeys.includes("tools")) {
        updatePromises.push(updateTools({ tools: draft.tools }));
      }
      // History
      if (
        changedKeys.some((k) =>
          [
            "persistConversations",
            "maxMessagesPerConversation",
            "summarizeAfter",
          ].includes(k),
        )
      ) {
        updatePromises.push(
          updateMemory({
            persistConversations: draft.persistConversations,
            maxMessagesPerConversation: draft.maxMessagesPerConversation,
            summarizeAfter: draft.summarizeAfter,
          }),
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error("Failed to sync settings:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    settings,
    updateInterface,
    updateEngine,
    updatePersona,
    updateKeys,
    updateTools,
    updateMemory,
  ]);

  const contextValue = React.useMemo(() => ({
    settings,
    updateSetting,
    syncSettings,
    updateInterface,
    updateEngine,
    updatePersona,
    updateKeys,
    updateTools,
    updateMemory,
    refetchSettings: fetchSettings,
    isLoading,
    isSettingsModalOpen,
    setSettingsModalOpen,
  }), [
    settings,
    isLoading,
    isSettingsModalOpen,
    setSettingsModalOpen,
    // Functions are stable anyway but included for completeness
    updateSetting,
    syncSettings,
    updateInterface,
    updateEngine,
    updatePersona,
    updateKeys,
    updateTools,
    updateMemory,
    fetchSettings,
  ]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
      <SettingsModal />
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
