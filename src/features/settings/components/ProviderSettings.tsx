"use client";

import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AppSettings,
  SystemProvider,
} from "@/features/settings/types";

import { SettingsCard, SettingsItem } from "./SettingsUI";

interface ProviderSettingsProps {
  draftSettings: AppSettings;
  updateDraft: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  setDraftSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  systemProviders: SystemProvider[];
}

export function ProviderSettings({
  draftSettings,
  updateDraft,
  systemProviders,
}: ProviderSettingsProps) {
  return (
    <SettingsCard>
      <SettingsItem
        label="AI Provider"
        description="Select the default LLM inference engine for your workspace."
        icon={Globe}
      >
        <Select
          value={draftSettings.provider}
          onValueChange={(v) => updateDraft("provider", v as any)}
        >
          <SelectTrigger
            id="provider"
            className="w-40 border-border/40 bg-background/50"
          >
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {systemProviders.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsItem>
    </SettingsCard>
  );
}
