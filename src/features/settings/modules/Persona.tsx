"use client";

import React from "react";
import { AppSettings } from "@/features/settings/types";
import { MessageSquare, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSection, SettingsCard, SettingsItem } from "../components/SettingsUI";

interface ModuleProps {
  draftSettings: AppSettings;
  updateDraft: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export default function PersonaModule({
  draftSettings,
  updateDraft,
}: ModuleProps) {
  
  const updatePersona = (updates: Partial<AppSettings>) => {
    Object.entries(updates).forEach(([key, val]) => {
      updateDraft(key as keyof AppSettings, val as any);
    });
  };

  return (
    <div className="space-y-10 pb-10 max-w-xl">
      <SettingsSection 
        title="Persona" 
        description="Define Maya's identity and how she should adapt to your preferences."
      >
        <SettingsCard className="space-y-6 ">
          <SettingsItem
            label="System Persona"
            description="The core instructions that define Maya's personality and base behavior."
            icon={User}
            col
          >
            <Textarea
              placeholder="Enter system prompt here..."
              value={draftSettings.persona}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updatePersona({ persona: e.target.value })
              }
              className="min-h-32 bg-background/50 border-border/40 resize-none text-sm"
            />
          </SettingsItem>

          <SettingsItem
            label="Interaction Style"
            description="Instructions for formatting, tone, and response verbosity."
            icon={MessageSquare}
            col
          >
            <Textarea
              placeholder="Maya will follow these instructions in every response..."
              value={draftSettings.outputFormat}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                updatePersona({ outputFormat: e.target.value })
              }
              className="min-h-32 bg-background/50 border-border/40 resize-none text-sm"
            />
          </SettingsItem>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
