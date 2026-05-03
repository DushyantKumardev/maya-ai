"use client";

import React from "react";
import { AppSettings } from "@/features/settings/types";
import { ProviderSettings } from "@/features/settings/components/ProviderSettings";
import { SERVICES } from "@/lib/constants/services";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/constants/api";

import { Settings2, Brain, Trash2 } from "lucide-react";
import { SettingsSection, SettingsCard, SettingsItem, SettingsDangerZone } from "../components/SettingsUI";

interface ModuleProps {
  draftSettings: AppSettings;
  updateDraft: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setDraftSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function EngineModule({
  draftSettings,
  updateDraft,
  setDraftSettings,
}: ModuleProps) {
  const [countClick, setCountClick] = React.useState(0);

  const updateModelConfig = (updates: Partial<AppSettings["config"]>) => {
    updateDraft("config", { 
      ...draftSettings.config, 
      ...updates 
    });
  };

  const clearConversations = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all conversations? This cannot be undone.",
      )
    )
      return;
    try {
      await fetch(API_ENDPOINTS.CONVERSATIONS.BASE, { method: "DELETE" });
      toast.success("All conversations cleared");
      window.location.reload();
    } catch {
      toast.error("Failed to clear conversations");
    }
  };

  const scheduleClearConversations = () => {
    setCountClick((prev) => prev + 1);
    if (countClick < 3) {
      toast.error(
        `Please click ${3 - countClick} more times to clear all conversations`,
      );
      return;
    }
    clearConversations();
  };

  return (
    <div className="space-y-10 pb-10 max-w-xl">
      <SettingsSection 
        title="Engine" 
        description="Configure your preferred AI provider and model parameters."
      >
        <ProviderSettings
          draftSettings={draftSettings}
          updateDraft={updateDraft}
          setDraftSettings={setDraftSettings}
          systemProviders={SERVICES.filter(s => s.category === "ai").map(s => ({
            name: s.name,
            value: s.id,
            baseURL: s.baseURL || ""
          }))}
        />

        <SettingsCard className="mt-6 space-y-6">
          <SettingsItem
            label="Creativity (Temperature)"
            description="Higher values make responses more creative, lower values make them more factual."
            icon={Settings2}
          >
            <input 
              type="number" 
              step="0.1" 
              min="0"
              max="2"
              value={draftSettings.config.temperature}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateModelConfig({ temperature: parseFloat(e.target.value) })
              }
              className="px-2 py-1 w-20 text-sm text-right bg-background/50 border border-border/40 rounded-lg text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </SettingsItem>

          <SettingsItem
            label="Token Limit"
            description="The maximum number of tokens Maya can generate in a single response."
            icon={Brain}
          >
            <input 
              type="number" 
              step="128" 
              min="128"
              max="128000"
              value={draftSettings.config.maxTokens}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                updateModelConfig({ maxTokens: parseInt(e.target.value) })
              }
              className="px-2 py-1 w-24 text-sm text-right bg-background/50 border border-border/40 rounded-lg text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </SettingsItem>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title="Danger Zone">
        <SettingsDangerZone
          title="Clear All Conversations"
          description="Permanently delete all your chat history and attachments. This action cannot be undone."
        >
          <Button
            variant="destructive"
            onClick={scheduleClearConversations}
            className="px-4 py-2 h-9 text-xs font-medium shadow-sm transition-all active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete Everything
          </Button>
        </SettingsDangerZone>
      </SettingsSection>
    </div>
  );
}
